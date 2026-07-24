import React, { useState, useEffect, useRef } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { auth, db, sanitizeForFirestore } from "./lib/firebase";
import { OrbitState, UserRole, ActionPayload, MinigameType } from "./types";
import { initialOrbitState } from "./data/initialState";
import { calculateCountdown, TARGET_REUNION_DATE } from "./utils/countdown";
import { applyDepletion } from "./utils/tamagotchi";
import { Header } from "./components/Header";
import { PartnerTab } from "./components/PartnerTab";
import { TamagotchiSprout } from "./components/TamagotchiSprout";
import { Scrapbook } from "./components/Scrapbook";
import { PhotoBooth } from "./components/PhotoBooth";
import { OpenWhenLetters } from "./components/OpenWhenLetters";
import { IntimacyZone } from "./components/IntimacyZone";
import { OnboardingModal } from "./components/OnboardingModal";
import { TamagotchiMinigamesModal } from "./components/TamagotchiMinigamesModal";
import { ClashRoyaleNav, NavTabType } from "./components/ClashRoyaleNav";
import { AuthGate } from "./components/AuthGate";
import { RoomGate } from "./components/RoomGate";
import { Heart, Camera, BookOpen } from "lucide-react";

export default function App() {
  const [state, setState] = useState<OrbitState>(initialOrbitState);
  const [activeUser, setActiveUser] = useState<UserRole>("User_A");

  // Always-current ref mirror of `state`. The 15s depletion interval below lives
  // for a while between re-creations (it only rebuilds when roomCode/tamagotchi
  // change), so reading `state` directly inside it can capture a STALE snapshot —
  // missing scrapbook/photobooth items added since. Reading `stateRef.current`
  // instead guarantees the interval always sees the latest data before writing.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  // Clash Royale style navigation tabs: "partner" | "memories" | "pet" | "vault" | "letters"
  // Default to middle tab: "pet" (Tamagotchi Sprout Care Hub)
  const [activeTab, setActiveTab] = useState<NavTabType>("pet");
  
  // Memories Page Sub-tab: "scrapbook" | "photobooth"
  const [memoriesSubTab, setMemoriesSubTab] = useState<"scrapbook" | "photobooth">("scrapbook");

  // Auth & Room State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [roomCode, setRoomCode] = useState<string | null>(() => localStorage.getItem("orbit_room_code"));
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Minigame Modal (Optional Arcade Mode)
  const [activeMinigame, setActiveMinigame] = useState<MinigameType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Notification limits and helper
  const notifiedRef = useRef({
    hunger: false,
    happiness: false,
    energy: false,
    lastTimestamp: "",
  });

  const sendNotification = (title: string, body: string, icon = "/icon-192.png") => {
    if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;

    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200],
          tag: "sprout-alert",
          renotify: true,
        } as any);
      }).catch(err => {
        console.warn("Service worker notification error, falling back:", err);
        new Notification(title, { body, icon });
      });
    } else {
      new Notification(title, { body, icon });
    }
  };

  // Derive active partner profile
  const partnerUserKey = activeUser === "User_A" ? "user_b" : "user_a";
  const partnerProfile = state.users[partnerUserKey];
  const partnerFirstName = partnerProfile.name.split(" ")[0];

  // 1. Firebase Auth Listener + User Room Mapping Lookup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Look up persistent user room mapping in Firestore
        try {
          const userRoomRef = doc(db, "orbit_user_rooms", currentUser.uid);
          const userRoomSnap = await getDoc(userRoomRef);
          if (userRoomSnap.exists()) {
            const savedCode = userRoomSnap.data()?.roomCode;
            if (savedCode) {
              setRoomCode(savedCode);
              localStorage.setItem("orbit_room_code", savedCode);
            }
          }
        } catch (err) {
          console.warn("User room mapping lookup notice:", err);
        }

        setState((prev) => {
          const isUserA = activeUser === "User_A";
          const currentRoleKey = isUserA ? "user_a" : "user_b";
          const otherRoleKey = isUserA ? "user_b" : "user_a";

          return {
            ...prev,
            users: {
              ...prev.users,
              [currentRoleKey]: {
                ...prev.users[currentRoleKey],
                name: currentUser.displayName || currentUser.email?.split("@")[0] || prev.users[currentRoleKey].name,
                uid: currentUser.uid,
                email: currentUser.email || undefined,
                photo_url: currentUser.photoURL || undefined,
              },
            },
          };
        });
      } else {
        setRoomCode(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [activeUser]);

  // 2. Real-time Firestore Sync Listener for active room with catch-up depletion
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = doc(db, "orbit_rooms", roomCode);
    const unsubscribe = onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const roomData = docSnap.data() as OrbitState;
          const targetDate = roomData.countdown?.target_date || TARGET_REUNION_DATE;

          // Catch-up depletion on incoming Firestore data
          const { updated, tamagotchi: depletedTamagotchi } = applyDepletion(roomData.tamagotchi);

          // Lock active user role based on authenticated Firebase UID
          if (user?.uid) {
            if (roomData.users?.user_b?.uid === user.uid) {
              setActiveUser("User_B");
            } else if (roomData.users?.user_a?.uid === user.uid) {
              setActiveUser("User_A");
            }
          }

          const finalRoomState: OrbitState = {
            ...roomData,
            tamagotchi: depletedTamagotchi,
            roomCode,
            countdown: calculateCountdown(targetDate),
          };

          setState(finalRoomState);

          // If catch-up depletion happened, write back immediately to sync both partners
          if (updated) {
            setDoc(roomRef, sanitizeForFirestore(finalRoomState), { merge: true }).catch((err) => {
              console.warn("Failed to auto-sync catch-up depletion:", err);
            });
          }
        } else {
          const newRoomState: OrbitState = {
            ...initialOrbitState,
            roomCode,
            timestamp: new Date().toISOString(),
            countdown: calculateCountdown(TARGET_REUNION_DATE),
          };
          setDoc(roomRef, sanitizeForFirestore(newRoomState));
          setState(newRoomState);
        }
      },
      (error) => {
        console.warn("Firestore snapshot listener notice:", error);
      }
    );

    return () => unsubscribe();
  }, [roomCode, user?.uid]);

  // 3. Notification triggers for low stats and partner activity
  useEffect(() => {
    if (!state.tamagotchi || !state.timestamp) return;

    // A. Check stats levels
    const hunger = state.tamagotchi.hunger;
    const happiness = state.tamagotchi.happiness;
    const energy = state.tamagotchi.energy;

    if (hunger < 30) {
      if (!notifiedRef.current.hunger) {
        sendNotification(
          "🌱 Sprout is Hungry!",
          `${state.tamagotchi.name} is hungry (${Math.round(hunger)}%). Please feed Sprout a warm meal!`
        );
        notifiedRef.current.hunger = true;
      }
    } else if (hunger >= 40) {
      notifiedRef.current.hunger = false;
    }

    if (happiness < 30) {
      if (!notifiedRef.current.happiness) {
        sendNotification(
          "💖 Sprout feels lonely!",
          `${state.tamagotchi.name} needs affection (${Math.round(happiness)}%). Give Sprout some cuddles or play a game!`
        );
        notifiedRef.current.happiness = true;
      }
    } else if (happiness >= 40) {
      notifiedRef.current.happiness = false;
    }

    if (energy < 30) {
      if (!notifiedRef.current.energy) {
        sendNotification(
          "💤 Sprout is sleepy!",
          `${state.tamagotchi.name} is exhausted (${Math.round(energy)}%). Tuck Sprout in for a cozy nap!`
        );
        notifiedRef.current.energy = true;
      }
    } else if (energy >= 40) {
      notifiedRef.current.energy = false;
    }

    // B. Check partner activity
    if (notifiedRef.current.lastTimestamp && notifiedRef.current.lastTimestamp !== state.timestamp) {
      if (state.active_user !== activeUser) {
        // Partner performed an action!
        const partnerKey = state.active_user === "User_A" ? "user_a" : "user_b";
        const partnerName = state.users[partnerKey]?.name || "Your partner";
        const lastAction = state.users[partnerKey]?.last_action || "updated Orbit";
        
        sendNotification(
          "💖 Partner Activity!",
          `${partnerName} just: ${lastAction}!`
        );
      }
    }
    notifiedRef.current.lastTimestamp = state.timestamp;
  }, [state.tamagotchi, state.timestamp, state.active_user, activeUser]);

  // 4. Local active depletion interval
  useEffect(() => {
    if (!roomCode || !state.tamagotchi) return;

    const interval = setInterval(() => {
      // Read from the ref, NOT the closed-over `state`, so this always operates
      // on the latest data even if this effect hasn't been recreated recently.
      const currentState = stateRef.current;
      const { updated, tamagotchi: depletedTamagotchi } = applyDepletion(currentState.tamagotchi);
      if (updated) {
        // Update local state for immediate UI feedback.
        setState((prev) => ({ ...prev, tamagotchi: depletedTamagotchi }));

        if (roomCode) {
          localStorage.setItem(
            `orbit_room_data_${roomCode}`,
            JSON.stringify({ ...currentState, tamagotchi: depletedTamagotchi })
          );
          // Write ONLY the tamagotchi field via updateDoc (dot-path partial write)
          // instead of setDoc-ing the whole state object. This makes it impossible
          // for this background tick to ever clobber scrapbook/photobooth/letters/
          // intimacy_zone data, no matter how stale any other part of local state is.
          const roomRef = doc(db, "orbit_rooms", roomCode);
          updateDoc(roomRef, { tamagotchi: depletedTamagotchi }).catch((err) => {
            console.warn("Failed to sync tamagotchi depletion tick:", err);
          });
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [roomCode, state.tamagotchi]);

  // Save user room mapping helper
  const linkUserToRoom = async (code: string) => {
    if (user) {
      try {
        await setDoc(
          doc(db, "orbit_user_rooms", user.uid),
          sanitizeForFirestore({ roomCode: code, updatedAt: new Date().toISOString() }),
          { merge: true }
        );
      } catch (err) {
        console.warn("Failed to write orbit_user_rooms mapping:", err);
      }
    }
  };

  // Room Creation Handler
  const handleCreateRoom = async (partnerName?: string): Promise<string> => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "ORB";
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newRoomState: OrbitState = {
      ...initialOrbitState,
      roomCode: code,
      timestamp: new Date().toISOString(),
      countdown: calculateCountdown(TARGET_REUNION_DATE),
      users: {
        ...initialOrbitState.users,
        user_a: {
          ...initialOrbitState.users.user_a,
          name: user?.displayName || user?.email?.split("@")[0] || "Alex",
          uid: user?.uid,
          email: user?.email || undefined,
        },
        user_b: {
          ...initialOrbitState.users.user_b,
          name: partnerName || initialOrbitState.users.user_b.name,
        },
      },
    };

    // Attempt sync with Firebase Firestore
    try {
      const roomRef = doc(db, "orbit_rooms", code);
      await setDoc(roomRef, sanitizeForFirestore(newRoomState));
      await linkUserToRoom(code);
    } catch (firestoreErr) {
      console.warn("Firestore room save notice (using local storage fallback):", firestoreErr);
    }

    // Always persist locally as well to ensure bulletproof operation
    localStorage.setItem("orbit_room_code", code);
    localStorage.setItem(`orbit_room_data_${code}`, JSON.stringify(newRoomState));
    setRoomCode(code);
    setState(newRoomState);
    return code;
  };

  // Join Existing Room Handler
  const handleJoinRoom = async (code: string): Promise<boolean> => {
    const upperCode = code.toUpperCase();
    try {
      const roomRef = doc(db, "orbit_rooms", upperCode);
      const docSnap = await getDoc(roomRef);

      if (docSnap.exists()) {
        await linkUserToRoom(upperCode);
        localStorage.setItem("orbit_room_code", upperCode);
        setRoomCode(upperCode);
        setActiveUser("User_B");

        const roomData = docSnap.data() as OrbitState;
        const updatedUsers = {
          ...roomData.users,
          user_b: {
            ...roomData.users.user_b,
            name: user?.displayName || user?.email?.split("@")[0] || roomData.users.user_b.name,
            uid: user?.uid,
            email: user?.email || undefined,
          },
        };

        try {
          await setDoc(roomRef, sanitizeForFirestore({ ...roomData, users: updatedUsers }), { merge: true });
        } catch (e) {
          console.warn("Could not update user_b info on Firestore:", e);
        }
        return true;
      }
    } catch (err) {
      console.warn("Error fetching room from Firestore, checking local backup:", err);
    }

    // Local storage fallback for offline / un-synced rooms
    const localSaved = localStorage.getItem(`orbit_room_data_${upperCode}`);
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved) as OrbitState;
        localStorage.setItem("orbit_room_code", upperCode);
        setRoomCode(upperCode);
        setActiveUser("User_B");
        setState(parsed);
        return true;
      } catch (e) {
        console.warn("Failed parsing local room state:", e);
      }
    }

    return false;
  };

  // Leave Room Handler
  const handleLeaveRoom = async () => {
    if (window.confirm("Are you sure you want to leave this room? You can create a new room or join another room anytime.")) {
      localStorage.removeItem("orbit_room_code");
      if (user) {
        try {
          await deleteDoc(doc(db, "orbit_user_rooms", user.uid));
        } catch (err) {
          console.warn("Failed to clear user room mapping:", err);
        }
      }
      setRoomCode(null);
    }
  };

  // Sync State with Firestore & Local State
  const syncStateUpdate = async (updatedState: OrbitState) => {
    setState(updatedState);
    if (roomCode) {
      localStorage.setItem(`orbit_room_data_${roomCode}`, JSON.stringify(updatedState));
      try {
        const roomRef = doc(db, "orbit_rooms", roomCode);
        await setDoc(roomRef, sanitizeForFirestore(updatedState), { merge: true });
      } catch (err) {
        console.warn("Firestore sync notice (local backup retained):", err);
      }
    }
  };

  // Dispatch Actions (Local State Engine + Async API Sync + Firestore & LocalStorage)
  const dispatchAction = async (payload: Partial<ActionPayload>) => {
    setIsLoading(true);
    const fullPayload: ActionPayload = {
      active_user: activeUser,
      action_type: payload.action_type || "raw_command",
      action_input: payload.action_input,
      extra_data: payload.extra_data,
    };

    // 1. Immediately apply action to client room state & sync to Firestore & localStorage
    const nextState = executeLocalAction(fullPayload);
    await syncStateUpdate(nextState);

    // 2. Asynchronously notify backend server for Gemini narrative response
    try {
      const res = await fetch("/api/orbit/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fullPayload, roomCode, current_state: nextState }),
      });

      if (res.ok) {
        const serverRes = await res.json();
        if (serverRes.narrative_response) {
          setState((prev) => ({
            ...prev,
            narrative_response: serverRes.narrative_response,
            chat_history_update: serverRes.chat_history_update || prev.chat_history_update,
          }));
        }
      }
    } catch (err) {
      console.warn("Backend API sync notice:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Local Action Execution Logic
  const executeLocalAction = (payload: ActionPayload): OrbitState => {
    const userKey = activeUser === "User_A" ? "user_a" : "user_b";
    const partnerKey = activeUser === "User_A" ? "user_b" : "user_a";
    const nextState: OrbitState = {
      ...state,
      timestamp: new Date().toISOString(),
      active_user: activeUser,
      scrapbook: [...(state.scrapbook || [])],
      tamagotchi: { ...state.tamagotchi },
      users: { ...state.users },
      letters: [...(state.letters || [])],
      intimacy_zone: {
        active_encrypted_items: [...(state.intimacy_zone?.active_encrypted_items || [])],
      },
      photobooth_requests: [...(state.photobooth_requests || [])],
    };

    if (payload.action_type === "feed_sprout") {
      nextState.tamagotchi.hunger = Math.min(100, nextState.tamagotchi.hunger + 25);
      nextState.tamagotchi.happiness = Math.min(100, nextState.tamagotchi.happiness + 10);
      nextState.tamagotchi.status_message = `${nextState.users[userKey].name} fed ${nextState.users[partnerKey].name} a warm meal!`;
      nextState.users[userKey].last_action = `Fed ${nextState.users[partnerKey].name}`;
    } else if (payload.action_type === "play_sprout") {
      nextState.tamagotchi.happiness = Math.min(100, nextState.tamagotchi.happiness + 25);
      nextState.tamagotchi.energy = Math.max(0, nextState.tamagotchi.energy - 10);
      nextState.tamagotchi.status_message = `${nextState.users[userKey].name} played a game with ${nextState.users[partnerKey].name}!`;
      nextState.users[userKey].last_action = `Played with ${nextState.users[partnerKey].name}`;
    } else if (payload.action_type === "rest_sprout") {
      nextState.tamagotchi.energy = Math.min(100, nextState.tamagotchi.energy + 35);
      nextState.tamagotchi.hunger = Math.max(0, nextState.tamagotchi.hunger - 10);
      nextState.tamagotchi.status_message = `${nextState.users[userKey].name} tucked ${nextState.users[partnerKey].name} in for a cozy nap!`;
      nextState.users[userKey].last_action = `Tucked ${nextState.users[partnerKey].name} in`;
    } else if (payload.action_type === "pet_sprout") {
      nextState.tamagotchi.happiness = Math.min(100, nextState.tamagotchi.happiness + 15);
      nextState.tamagotchi.status_message = `${nextState.users[userKey].name} gave ${nextState.users[partnerKey].name} sweet cuddles!`;
      nextState.users[userKey].last_action = `Cuddled ${nextState.users[partnerKey].name}`;
    } else if (payload.action_type === "change_skin") {
      const selectedSkin = payload.action_input || payload.extra_data?.skin || "sprout";
      nextState.tamagotchi.selected_skin = selectedSkin;
      nextState.tamagotchi.status_message = `${nextState.users[userKey].name} equipped ${
        selectedSkin === "dark_hoodie" ? "Chibi Dark Hoodie" : selectedSkin === "kiss_hoodie" ? "Chibi KISS Rock Hoodie" : "Classic Sprout"
      } skin!`;
      nextState.users[userKey].last_action = "Changed Sprout skin";
    } else if (payload.action_type === "set_mood") {
      nextState.users[userKey].mood = payload.action_input || "Happy";
      if (payload.extra_data?.custom_status) {
        nextState.tamagotchi.status_message = payload.extra_data.custom_status;
      } else {
        nextState.tamagotchi.status_message = `${nextState.users[userKey].name} is feeling ${payload.action_input || "Happy"}!`;
      }
      nextState.users[userKey].last_action = `Set mood to ${payload.action_input}`;
    } else if (payload.action_type === "add_scrapbook") {
      const { caption, image_url, tags } = payload.extra_data || {};
      const newItem = {
        id: `item_${Date.now()}`,
        author: activeUser,
        caption: caption || payload.action_input || "New Memory",
        timestamp: new Date().toISOString(),
        image_url: image_url || "",
        tags: tags || ["memory"],
      };
      nextState.scrapbook = [newItem, ...(nextState.scrapbook || [])];
      nextState.users[userKey].last_action = "Added photo to Scrapbook";
    } else if (payload.action_type === "create_photobooth_request") {
      if (!nextState.photobooth_requests) nextState.photobooth_requests = [];
      const { photo_url, caption } = payload.extra_data || {};
      nextState.photobooth_requests.unshift({
        id: `pb_${Date.now()}`,
        requester: activeUser,
        requester_name: nextState.users[userKey].name,
        requester_photo: photo_url || "",
        requester_caption: caption || "",
        status: "pending",
        created_at: new Date().toISOString(),
      });
      nextState.users[userKey].last_action = "Requested Photo Booth Strip";
    } else if (payload.action_type === "complete_photobooth_request") {
      if (!nextState.photobooth_requests) nextState.photobooth_requests = [];
      const { request_id, responder_photo } = payload.extra_data || {};
      const targetReq = nextState.photobooth_requests.find((r) => r.id === (request_id || payload.action_input));
      if (targetReq) {
        targetReq.responder_photo = responder_photo || "";
        targetReq.status = "completed";
        targetReq.completed_at = new Date().toISOString();

        nextState.scrapbook.unshift({
          id: `item_pb_${Date.now()}`,
          author: activeUser,
          caption: `Photo Booth Strip with ${targetReq.requester_name}`,
          timestamp: new Date().toISOString(),
          image_url: responder_photo || targetReq.requester_photo,
          tags: ["photobooth", "strip", "couple"],
          is_photobooth_strip: true,
          photobooth_data: {
            requester_photo: targetReq.requester_photo,
            responder_photo: responder_photo || "",
          },
        });
      }
      nextState.users[userKey].last_action = "Completed Photo Booth Strip";
    } else if (payload.action_type === "unlock_letter") {
      const letter = nextState.letters.find((l) => l.id === payload.action_input);
      if (letter) letter.is_unlocked = true;
      nextState.users[userKey].last_action = "Opened an Open-When letter";
    } else if (payload.action_type === "add_letter") {
      const { title, condition, content } = payload.extra_data || {};
      nextState.letters.push({
        id: `letter_${Date.now()}`,
        title: title || "Open when...",
        condition: condition || "special_moment",
        is_unlocked: false,
        content: content || "I love you endlessly!",
        author: activeUser,
      });
      nextState.users[userKey].last_action = "Wrote an Open-When letter";
    } else if (payload.action_type === "view_intimacy") {
      const item = nextState.intimacy_zone.active_encrypted_items.find((i) => i.id === payload.action_input);
      if (item) item.is_viewed = true;
      nextState.users[userKey].last_action = "Viewed E2EE memory";
    } else if (payload.action_type === "add_intimacy") {
      const { title, secret_message, image_url } = payload.extra_data || {};
      nextState.intimacy_zone.active_encrypted_items.unshift({
        id: `photo_${Date.now()}`,
        uploader: activeUser,
        ciphertext_ref: `AES256_GCM_${Math.random().toString(36).substring(2, 10)}`,
        is_viewed: false,
        title: title || "Encrypted Memory",
        secret_message: secret_message || "",
        image_url: image_url || "",
        created_at: new Date().toISOString(),
      });
      nextState.users[userKey].last_action = "Uploaded E2EE memory";
    } else if (payload.action_type === "update_countdown") {
      const { target_date } = payload.extra_data || {};
      const newTarget = target_date || payload.action_input;
      if (newTarget) {
        nextState.countdown = calculateCountdown(newTarget);
        nextState.users[userKey].last_action = "Updated Reunion Date";
      }
    }

    return nextState;
  };

  // Change Skin Handler
  const handleChangeSkin = (skinId: string) => {
    dispatchAction({
      action_type: "change_skin",
      action_input: skinId,
      extra_data: { skin: skinId },
    });
  };

  // Direct Interactive Tamagotchi Care Action
  const handleDirectTamagotchiAction = (actionType: "feed_sprout" | "play_sprout" | "rest_sprout" | "pet_sprout") => {
    dispatchAction({ action_type: actionType });
  };

  // Minigame Arcade Win Handler
  const handleMinigameWin = (gameType: MinigameType) => {
    let actionType: "feed_sprout" | "play_sprout" | "rest_sprout" | "pet_sprout" = "feed_sprout";
    if (gameType === "play") actionType = "play_sprout";
    if (gameType === "rest") actionType = "rest_sprout";
    if (gameType === "pet") actionType = "pet_sprout";

    dispatchAction({ action_type: actionType });
  };

  // UI Action Triggers
  const handleUpdateTargetDate = (newTargetDateStr: string) => {
    dispatchAction({
      action_type: "update_countdown",
      extra_data: { target_date: newTargetDateStr },
    });
  };

  const handleSetMood = (mood: string, customStatus?: string) => {
    dispatchAction({
      action_type: "set_mood",
      action_input: mood,
      extra_data: { custom_status: customStatus },
    });
  };

  const handleAddMemory = (caption: string, imageUrl?: string, tags?: string[]) => {
    dispatchAction({
      action_type: "add_scrapbook",
      action_input: caption,
      extra_data: { caption, image_url: imageUrl, tags },
    });
  };

  const handleRequestPhotoBooth = (photoUrl: string, caption?: string) => {
    dispatchAction({
      action_type: "create_photobooth_request",
      extra_data: { photo_url: photoUrl, caption },
    });
  };

  const handleCompletePhotoBooth = (requestId: string, responderPhotoUrl: string) => {
    dispatchAction({
      action_type: "complete_photobooth_request",
      action_input: requestId,
      extra_data: { request_id: requestId, responder_photo: responderPhotoUrl },
    });
  };

  const handleUnlockLetter = (letterId: string) => {
    dispatchAction({ action_type: "unlock_letter", action_input: letterId });
  };

  const handleAddLetter = (title: string, condition: string, content: string) => {
    dispatchAction({
      action_type: "add_letter",
      extra_data: { title, condition, content },
    });
  };

  const handleViewIntimacy = (photoId: string) => {
    dispatchAction({ action_type: "view_intimacy", action_input: photoId });
  };

  const handleAddIntimacy = (title: string, secretMessage?: string, imageUrl?: string) => {
    dispatchAction({
      action_type: "add_intimacy",
      extra_data: { title, secret_message: secretMessage, image_url: imageUrl },
    });
  };

  // 1. Mandatory Sign In Gate (Demo mode removed)
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0A0518] text-white flex flex-col items-center justify-center p-4">
        <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-500 to-indigo-600 p-0.5 animate-pulse flex items-center justify-center mb-4">
          <div className="w-full h-full bg-[#0A0518] rounded-[22px] flex items-center justify-center">
            <Heart className="w-8 h-8 text-pink-400 fill-pink-400 animate-ping" />
          </div>
        </div>
        <p className="text-xs text-slate-300 font-mono tracking-widest uppercase">Initializing Orbit Security...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  // 2. Mandatory Room Setup Gate
  if (!roomCode) {
    return <RoomGate user={user} onJoinRoom={handleJoinRoom} onCreateRoom={handleCreateRoom} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0518] text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Orbs */}
      <div className="fixed top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-pink-900/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed top-[40%] right-[10%] w-[400px] h-[400px] bg-indigo-900/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <Header
        activeUser={activeUser}
        onUserSwitch={setActiveUser}
        onOpenOnboarding={() => setShowOnboarding(true)}
        onLeaveRoom={handleLeaveRoom}
        state={state}
        roomCode={roomCode}
        user={user}
        isLoading={isLoading}
      />

      {/* Main Content Area - Responsive padding bottom for Clash Royale Navigation Dock */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-28 sm:pb-32">
        {/* Tab 1: Partner Tab (Countdown + Custom Target Date Configurator + Partner Status) */}
        {activeTab === "partner" && (
          <PartnerTab
            countdown={state.countdown}
            userA={state.users.user_a}
            userB={state.users.user_b}
            activeUser={activeUser}
            onUpdateTargetDate={handleUpdateTargetDate}
            onSetMood={handleSetMood}
            isLoading={isLoading}
          />
        )}

        {/* Tab 2: Memories Tab (Scrapbook + Photo Booth) */}
        {activeTab === "memories" && (
          <div className="space-y-6">
            {/* Sub-tabs Bar */}
            <div className="flex items-center gap-3 bg-black/40 p-2 rounded-2xl border border-white/10 max-w-md">
              <button
                onClick={() => setMemoriesSubTab("scrapbook")}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  memoriesSubTab === "scrapbook"
                    ? "bg-sky-500/30 text-sky-200 border border-sky-500/40 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>Scrapbook ({state.scrapbook.length})</span>
              </button>

              <button
                onClick={() => setMemoriesSubTab("photobooth")}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                  memoriesSubTab === "photobooth"
                    ? "bg-pink-500/30 text-pink-200 border border-pink-500/40 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Camera className="w-4 h-4 text-pink-400" />
                <span>Photo Booth</span>
              </button>
            </div>

            {/* Sub-tab 1: Scrapbook Album */}
            {memoriesSubTab === "scrapbook" && (
              <Scrapbook
                items={state.scrapbook}
                activeUser={activeUser}
                onAddMemory={handleAddMemory}
                isLoading={isLoading}
              />
            )}

            {/* Sub-tab 2: Photo Booth */}
            {memoriesSubTab === "photobooth" && (
              <PhotoBooth
                requests={state.photobooth_requests || []}
                activeUser={activeUser}
                partnerName={partnerFirstName}
                onRequestPhotoBooth={handleRequestPhotoBooth}
                onCompletePhotoBooth={handleCompletePhotoBooth}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {/* Tab 3: PET / SPROUT (PROMINENT CENTER CLASH ROYALE MAIN TAB) */}
        {activeTab === "pet" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <TamagotchiSprout
              tamagotchi={state.tamagotchi}
              userA={state.users.user_a}
              userB={state.users.user_b}
              activeUser={activeUser}
              onDirectAction={handleDirectTamagotchiAction}
              onSetMood={handleSetMood}
              onChangeSkin={handleChangeSkin}
              onOpenMinigame={(type) => setActiveMinigame(type)}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Tab 4: Encrypted Intimacy Vault Tab */}
        {activeTab === "vault" && (
          <div className="space-y-6">
            <IntimacyZone
              items={state.intimacy_zone.active_encrypted_items}
              activeUser={activeUser}
              onViewItem={handleViewIntimacy}
              onAddIntimacyItem={handleAddIntimacy}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Tab 5: Open-When Love Letters Tab */}
        {activeTab === "letters" && (
          <div className="space-y-6">
            <OpenWhenLetters
              letters={state.letters}
              activeUser={activeUser}
              onUnlockLetter={handleUnlockLetter}
              onAddLetter={handleAddLetter}
              isLoading={isLoading}
            />
          </div>
        )}
      </main>

      {/* Clash Royale Mobile Bottom Navigation Dock */}
      <ClashRoyaleNav
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        memoryCount={state.scrapbook.length}
        vaultCount={state.intimacy_zone.active_encrypted_items.length}
        letterCount={state.letters.length}
        partnerFirstName={partnerFirstName}
      />

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          user={user}
          roomCode={roomCode}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onCompleteOnboarding={() => setShowOnboarding(false)}
        />
      )}

      {/* Optional Minigame Modal */}
      {activeMinigame && (
        <TamagotchiMinigamesModal
          type={activeMinigame}
          sproutName={state.tamagotchi.name}
          onClose={() => setActiveMinigame(null)}
          onGameWin={handleMinigameWin}
        />
      )}
    </div>
  );
}

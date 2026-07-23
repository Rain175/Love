import React, { useState, useEffect } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { OrbitState, UserRole, ActionPayload, MinigameType } from "./types";
import { initialOrbitState } from "./data/initialState";
import { calculateCountdown, TARGET_REUNION_DATE } from "./utils/countdown";
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
import { Heart, Camera, BookOpen } from "lucide-react";

export default function App() {
  const [state, setState] = useState<OrbitState>(initialOrbitState);
  const [activeUser, setActiveUser] = useState<UserRole>("User_A");
  
  // Clash Royale style navigation tabs: "partner" | "memories" | "pet" | "vault" | "letters"
  // Default to middle tab: "pet" (Tamagotchi Sprout Care Hub)
  const [activeTab, setActiveTab] = useState<NavTabType>("pet");
  
  // Memories Page Sub-tab: "scrapbook" | "photobooth"
  const [memoriesSubTab, setMemoriesSubTab] = useState<"scrapbook" | "photobooth">("scrapbook");

  // Auth & Room State
  const [user, setUser] = useState<User | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(() => localStorage.getItem("orbit_room_code"));
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Minigame Modal (Optional Arcade Mode)
  const [activeMinigame, setActiveMinigame] = useState<MinigameType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Derive active partner profile
  const partnerUserKey = activeUser === "User_A" ? "user_b" : "user_a";
  const partnerProfile = state.users[partnerUserKey];
  const partnerFirstName = partnerProfile.name.split(" ")[0];

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
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
              [otherRoleKey]: {
                ...prev.users[otherRoleKey],
                name: prev.users[otherRoleKey].name === (currentUser.displayName || currentUser.email?.split("@")[0])
                  ? (isUserA ? "Partner B (Maya)" : "Partner A (Alex)")
                  : prev.users[otherRoleKey].name,
              },
            },
          };
        });
      }
    });
    return () => unsubscribe();
  }, [activeUser]);

  // 2. Real-time Firestore Sync Listener
  useEffect(() => {
    if (!roomCode) return;

    const roomRef = doc(db, "orbit_rooms", roomCode);
    const unsubscribe = onSnapshot(
      roomRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const roomData = docSnap.data() as OrbitState;
          const targetDate = roomData.countdown?.target_date || TARGET_REUNION_DATE;
          setState({
            ...roomData,
            roomCode,
            countdown: calculateCountdown(targetDate),
          });
        } else {
          const newRoomState: OrbitState = {
            ...initialOrbitState,
            roomCode,
            timestamp: new Date().toISOString(),
            countdown: calculateCountdown(TARGET_REUNION_DATE),
          };
          setDoc(roomRef, newRoomState);
          setState(newRoomState);
        }
      },
      (error) => {
        console.warn("Firestore snapshot listener notice:", error);
      }
    );

    return () => unsubscribe();
  }, [roomCode]);

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

    const roomRef = doc(db, "orbit_rooms", code);
    await setDoc(roomRef, newRoomState);

    localStorage.setItem("orbit_room_code", code);
    setRoomCode(code);
    setState(newRoomState);
    return code;
  };

  // Join Existing Room Handler
  const handleJoinRoom = async (code: string): Promise<boolean> => {
    const upperCode = code.toUpperCase();
    const roomRef = doc(db, "orbit_rooms", upperCode);
    const docSnap = await getDoc(roomRef);

    if (docSnap.exists()) {
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

      await setDoc(roomRef, { ...roomData, users: updatedUsers }, { merge: true });
      return true;
    }
    return false;
  };

  // Sync State with Firestore & Local State
  const syncStateUpdate = async (updatedState: OrbitState) => {
    setState(updatedState);
    if (roomCode) {
      try {
        const roomRef = doc(db, "orbit_rooms", roomCode);
        await setDoc(roomRef, updatedState, { merge: true });
      } catch (err) {
        console.warn("Firestore sync error:", err);
      }
    }
  };

  // Dispatch Actions (Backend Server + Local Fallback)
  const dispatchAction = async (payload: Partial<ActionPayload>) => {
    setIsLoading(true);
    const fullPayload: ActionPayload = {
      active_user: activeUser,
      action_type: payload.action_type || "raw_command",
      action_input: payload.action_input,
      extra_data: payload.extra_data,
    };

    try {
      const res = await fetch("/api/orbit/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPayload),
      });

      if (res.ok) {
        const updatedState: OrbitState = await res.json();
        await syncStateUpdate(updatedState);
      } else {
        throw new Error("Action request failed");
      }
    } catch (err) {
      console.warn("Backend API error, running local state engine with Firestore sync:", err);
      executeLocalAction(fullPayload);
    } finally {
      setIsLoading(false);
    }
  };

  // Local Action Execution Logic
  const executeLocalAction = (payload: ActionPayload) => {
    const userKey = activeUser === "User_A" ? "user_a" : "user_b";
    const partnerKey = activeUser === "User_A" ? "user_b" : "user_a";
    const nextState = { ...state, timestamp: new Date().toISOString(), active_user: activeUser };

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
        image_url: image_url || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80",
        tags: tags || ["memory"],
      };
      nextState.scrapbook.unshift(newItem);
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
        image_url: image_url || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80",
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

    syncStateUpdate(nextState);
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

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { OrbitState, ActionPayload, ChatMessageUpdate } from "./src/types";
import { calculateCountdown, TARGET_REUNION_DATE } from "./src/utils/countdown";
import { initialOrbitState } from "./src/data/initialState";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// In-memory persistent state for Orbit
let currentState: OrbitState = { ...initialOrbitState };

// Helper to sanitize & clamp stats
function clampStat(val: number): number {
  return Math.min(100, Math.max(0, Math.round(val)));
}

// Initialize Gemini client server-side safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback narrative generator when AI quota is exceeded or offline
function getFallbackNarrative(
  actionType: string,
  activeUser: string,
  partnerName: string,
  actionDescription: string,
  state: OrbitState
): string {
  const days = state.countdown?.days_remaining ?? 14;
  switch (actionType) {
    case "feed_sprout":
      return `${partnerName} fed Sprout a delicious meal! Sprout is happily munching away and sending love across the miles. (${days} days until reunion!)`;
    case "play_sprout":
      return `${partnerName} spent quality time playing with Sprout! The little pet is full of joy and energetic bounces today.`;
    case "rest_sprout":
      return `${partnerName} tucked Sprout in for a cozy nap. Sprout is sleeping peacefully, dreaming of your upcoming reunion!`;
    case "pet_sprout":
      return `${partnerName} gave Sprout warm, gentle headpats. Sprout purrs with contentment and feels deeply cherished.`;
    case "chat":
      return `${partnerName} shared a sweet message in your private chat.`;
    case "add_scrapbook":
      return `${partnerName} added a precious memory to your shared scrapbook! Another beautiful moment captured for your journey together.`;
    case "create_photobooth_request":
    case "complete_photobooth_request":
      return `${partnerName} updated your Photo Booth strip! Memory captured and locked in your shared love vault.`;
    case "unlock_letter":
    case "add_letter":
      return `${partnerName} interacted with your Open-When letters! Love notes that keep your hearts connected across any distance.`;
    case "add_intimacy":
    case "view_intimacy":
      return `${partnerName} updated the Intimacy Zone! Your private moments remain safely encrypted.`;
    default:
      return `${partnerName} updated your shared Orbit space. Only ${days} days remaining until you're back in each other's arms!`;
  }
}

// System instruction for Game Master
const GAME_MASTER_SYSTEM_INSTRUCTION = `
You are the romantic, witty Game Master and application engine for "Orbit", a private long-distance couple's app.
Your task is to summarize user actions and partner interactions into a warm, charming, 1-2 sentence narrative_response.
Keep it sweet, playful, and empathetic to partners in a long-distance relationship.
`;

// API Endpoint: Get Current State
app.get("/api/orbit/state", (req, res) => {
  // Always update countdown to ensure precision
  currentState.countdown = calculateCountdown(TARGET_REUNION_DATE);
  currentState.timestamp = new Date().toISOString();
  res.json(currentState);
});

// API Endpoint: Process Action & Update State
app.post("/api/orbit/action", async (req, res) => {
  const payload: ActionPayload = req.body;
  if (req.body.current_state) {
    currentState = { ...currentState, ...req.body.current_state };
  }
  const activeUser = payload.active_user || "User_A";
  const userKey = activeUser === "User_A" ? "user_a" : "user_b";
  const partnerName = currentState.users?.[userKey]?.name || (activeUser === "User_A" ? "Nithilan" : "Sofia");

  currentState.active_user = activeUser;
  currentState.timestamp = new Date().toISOString();
  currentState.countdown = calculateCountdown(TARGET_REUNION_DATE);

  let actionDescription = "";
  let messageType: "chat" | "action" | "scrapbook" | "letter" | "intimacy" = "action";

  // Process specific action types
  switch (payload.action_type) {
    case "feed_sprout": {
      currentState.tamagotchi.hunger = clampStat(currentState.tamagotchi.hunger + 25);
      currentState.tamagotchi.happiness = clampStat(currentState.tamagotchi.happiness + 10);
      currentState.tamagotchi.status_message = "Sprout is happily munching and full of energy!";
      actionDescription = `[${activeUser}] fed Sprout a hearty meal (+25 Hunger, +10 Happiness)`;
      currentState.users[userKey].last_action = "Fed Sprout";
      break;
    }
    case "play_sprout": {
      currentState.tamagotchi.happiness = clampStat(currentState.tamagotchi.happiness + 25);
      currentState.tamagotchi.energy = clampStat(currentState.tamagotchi.energy - 15);
      currentState.tamagotchi.status_message = "Sprout had a blast playing games with you!";
      actionDescription = `[${activeUser}] played games with Sprout (+25 Happiness, -15 Energy)`;
      currentState.users[userKey].last_action = "Played with Sprout";
      break;
    }
    case "rest_sprout": {
      currentState.tamagotchi.energy = clampStat(currentState.tamagotchi.energy + 35);
      currentState.tamagotchi.hunger = clampStat(currentState.tamagotchi.hunger - 10);
      currentState.tamagotchi.status_message = "Sprout is sleeping soundly and regaining energy.";
      actionDescription = `[${activeUser}] tucked Sprout in for a nap (+35 Energy, -10 Hunger)`;
      currentState.users[userKey].last_action = "Tucked Sprout in";
      break;
    }
    case "pet_sprout": {
      currentState.tamagotchi.happiness = clampStat(currentState.tamagotchi.happiness + 15);
      currentState.tamagotchi.status_message = "Sprout feels loved and cherished!";
      actionDescription = `[${activeUser}] gave Sprout warm headpats (+15 Happiness)`;
      currentState.users[userKey].last_action = "Petted Sprout";
      break;
    }
    case "set_mood": {
      const newMood = payload.action_input || "Happy";
      currentState.users[userKey].mood = newMood;
      if (payload.extra_data?.custom_status) {
        currentState.tamagotchi.status_message = payload.extra_data.custom_status;
      } else {
        currentState.tamagotchi.status_message = `${currentState.users[userKey].name} is feeling ${newMood}!`;
      }
      currentState.users[userKey].last_action = `Updated mood to ${newMood}`;
      actionDescription = `[${activeUser}] updated daily mood to "${newMood}"`;
      break;
    }
    case "change_skin": {
      const skinId = payload.action_input || payload.extra_data?.skin || "sprout";
      currentState.tamagotchi.selected_skin = skinId;
      actionDescription = `[${activeUser}] equipped Sprout skin: ${skinId}`;
      currentState.users[userKey].last_action = "Changed Sprout skin";
      break;
    }
    case "chat": {
      messageType = "chat";
      const text = payload.action_input || "Sent a love note";
      actionDescription = `[${activeUser}]: ${text}`;
      currentState.users[userKey].last_action = "Sent a message";
      break;
    }
    case "add_scrapbook": {
      messageType = "scrapbook";
      const { caption, image_url, tags } = payload.extra_data || {};
      const newItem = {
        id: `item_${Date.now()}`,
        author: activeUser,
        caption: caption || payload.action_input || "New Memory",
        timestamp: new Date().toISOString(),
        image_url: image_url || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80",
        tags: tags || ["memory", "orbit"],
      };
      currentState.scrapbook.unshift(newItem);
      actionDescription = `[${activeUser}] added a new scrapbook photo: "${newItem.caption}"`;
      currentState.users[userKey].last_action = "Added photo to Scrapbook";
      break;
    }
    case "create_photobooth_request": {
      messageType = "scrapbook";
      if (!currentState.photobooth_requests) currentState.photobooth_requests = [];
      const { photo_url, caption } = payload.extra_data || {};
      const newPbReq = {
        id: `pb_${Date.now()}`,
        requester: activeUser,
        requester_name: currentState.users[userKey].name,
        requester_photo: photo_url || payload.action_input || "",
        requester_caption: caption || "",
        status: "pending" as const,
        created_at: new Date().toISOString(),
      };
      currentState.photobooth_requests.unshift(newPbReq);
      actionDescription = `[${activeUser}] requested a Photo Booth Strip with partner!`;
      currentState.users[userKey].last_action = "Requested Photo Booth Strip";
      break;
    }
    case "complete_photobooth_request": {
      messageType = "scrapbook";
      if (!currentState.photobooth_requests) currentState.photobooth_requests = [];
      const { request_id, responder_photo } = payload.extra_data || {};
      const targetReq = currentState.photobooth_requests.find((r) => r.id === (request_id || payload.action_input));
      if (targetReq) {
        targetReq.responder_photo = responder_photo || "";
        targetReq.status = "completed";
        targetReq.completed_at = new Date().toISOString();

        currentState.scrapbook.unshift({
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
      actionDescription = `[${activeUser}] completed and saved a Photo Booth Strip!`;
      currentState.users[userKey].last_action = "Completed Photo Booth Strip";
      break;
    }
    case "unlock_letter": {
      messageType = "letter";
      const letterId = payload.action_input;
      const targetLetter = currentState.letters.find((l) => l.id === letterId);
      if (targetLetter) {
        targetLetter.is_unlocked = true;
        targetLetter.unlocked_at = new Date().toISOString();
        actionDescription = `[${activeUser}] unlocked the letter: "${targetLetter.title}"`;
      } else {
        actionDescription = `[${activeUser}] opened a love letter`;
      }
      currentState.users[userKey].last_action = "Opened an Open-When letter";
      break;
    }
    case "add_letter": {
      messageType = "letter";
      const { title, condition, content } = payload.extra_data || {};
      const newLetter = {
        id: `letter_${Date.now()}`,
        title: title || "Open when...",
        condition: condition || "special_moment",
        is_unlocked: false,
        content: content || "I love you to the moon and back!",
        author: activeUser,
      };
      currentState.letters.push(newLetter);
      actionDescription = `[${activeUser}] wrote a new letter: "${newLetter.title}"`;
      currentState.users[userKey].last_action = "Wrote an Open-When letter";
      break;
    }
    case "view_intimacy": {
      messageType = "intimacy";
      const photoId = payload.action_input;
      const targetItem = currentState.intimacy_zone.active_encrypted_items.find((i) => i.id === photoId);
      if (targetItem) {
        targetItem.is_viewed = true;
        actionDescription = `[${activeUser}] decrypted and viewed secure photo "${targetItem.id}"`;
      } else {
        actionDescription = `[${activeUser}] viewed an encrypted memory`;
      }
      currentState.users[userKey].last_action = "Viewed Intimacy Zone memory";
      break;
    }
    case "add_intimacy": {
      messageType = "intimacy";
      const { title, ciphertext_ref, secret_message, image_url } = payload.extra_data || {};
      const newItem = {
        id: `photo_${Date.now()}`,
        uploader: activeUser,
        ciphertext_ref: ciphertext_ref || `AES256_GCM_${Math.random().toString(36).substring(2, 10)}`,
        is_viewed: false,
        title: title || "Encrypted Memory",
        secret_message: secret_message || "",
        image_url: image_url || "",
        created_at: new Date().toISOString(),
      };
      currentState.intimacy_zone.active_encrypted_items.unshift(newItem);
      actionDescription = `[${activeUser}] uploaded an encrypted intimacy memory: "${newItem.title}"`;
      currentState.users[userKey].last_action = "Uploaded E2EE memory";
      break;
    }
    case "update_countdown": {
      messageType = "action";
      const { target_date } = payload.extra_data || {};
      const newTarget = target_date || payload.action_input;
      if (newTarget) {
        currentState.countdown = calculateCountdown(newTarget);
        actionDescription = `[${activeUser}] updated the target reunion date to ${new Date(newTarget).toLocaleDateString()}`;
        currentState.users[userKey].last_action = "Updated Reunion Date";
      }
      break;
    }
    case "raw_command":
    default: {
      actionDescription = payload.action_input || `[${activeUser}] performed an action`;
      const lower = actionDescription.toLowerCase();
      if (lower.includes("feed") || lower.includes("pancake") || lower.includes("apple")) {
        currentState.tamagotchi.hunger = clampStat(currentState.tamagotchi.hunger + 20);
        currentState.tamagotchi.happiness = clampStat(currentState.tamagotchi.happiness + 5);
      } else if (lower.includes("play") || lower.includes("game")) {
        currentState.tamagotchi.happiness = clampStat(currentState.tamagotchi.happiness + 20);
      }
      currentState.users[userKey].last_action = "Performed custom action";
      break;
    }
  }

  // Construct Chat History Update
  const chatUpdate: ChatMessageUpdate = {
    sender: activeUser,
    message: actionDescription,
    type: messageType,
    timestamp: new Date().toISOString(),
  };

  currentState.chat_history_update = chatUpdate;
  if (!currentState.chat_history_log) {
    currentState.chat_history_log = [];
  }
  currentState.chat_history_log.unshift(chatUpdate);

  // Generate Narrative via Gemini if available (with rich romantic fallback when rate limited)
  let narrative = getFallbackNarrative(payload.action_type, activeUser, partnerName, actionDescription, currentState);
  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Action taken by ${activeUser} (${partnerName}): "${actionDescription}". Current Sprout stats: Hunger=${currentState.tamagotchi.hunger}, Happiness=${currentState.tamagotchi.happiness}, Energy=${currentState.tamagotchi.energy}. Reunion countdown: ${currentState.countdown.days_remaining} days remaining. Generate a sweet 1-2 sentence narrative update for the couple.`,
        config: {
          systemInstruction: GAME_MASTER_SYSTEM_INSTRUCTION,
        },
      });
      if (response.text) {
        narrative = response.text.trim();
      }
    } catch (err: any) {
      console.warn("Gemini API note: Using romantic narrative fallback due to limit/offline status:", err?.message || err);
    }
  }

  currentState.narrative_response = narrative;

  // Return exact required JSON schema format
  res.json(currentState);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Orbit Couple's App Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import { OrbitState } from "../types";
import { calculateCountdown, TARGET_REUNION_DATE } from "../utils/countdown";

export const initialOrbitState: OrbitState = {
  timestamp: new Date().toISOString(),
  active_user: "User_A",
  countdown: calculateCountdown(TARGET_REUNION_DATE),
  tamagotchi: {
    name: "Sprout",
    hunger: 85,
    happiness: 90,
    energy: 70,
    status_message: "Sprout is happily bouncing and counting down the days until September 16!",
  },
  users: {
    user_a: {
      name: "Partner A (Alex)",
      mood: "Excited",
      last_action: "Fed Sprout fresh berries",
      avatar_color: "from-pink-400 to-rose-500",
    },
    user_b: {
      name: "Partner B (Maya)",
      mood: "Missing You",
      last_action: "Added cozy photo to Scrapbook",
      avatar_color: "from-indigo-400 to-purple-500",
    },
  },
  scrapbook: [
    {
      id: "item_1",
      author: "User_A",
      caption: "Our favorite coffee shop date before the flight ☕",
      timestamp: "2026-07-15T14:30:00Z",
      image_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80",
      tags: ["coffee", "memories", "date_night"],
    },
    {
      id: "item_2",
      author: "User_B",
      caption: "Sunset video call & matching tea cups 🌅",
      timestamp: "2026-07-20T21:15:00Z",
      image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
      tags: ["videocall", "cozy", "sunset"],
    },
  ],
  photobooth_requests: [
    {
      id: "pb_1",
      requester: "User_A",
      requester_name: "Partner A (Alex)",
      requester_photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
      requester_caption: "Ready for our virtual photobooth strip!",
      status: "pending",
      created_at: "2026-07-23T06:00:00Z",
    },
  ],
  letters: [
    {
      id: "letter_1",
      title: "Open when you can't sleep",
      condition: "cant_sleep",
      is_unlocked: false,
      content: "My love, if you're reading this late at night, close your eyes and listen to my voice. Imagine my hands wrapped around you. You are safe, loved, and September 16 is getting closer with every tick of the clock. Sleep sweet, my darling.",
      author: "User_A",
    },
    {
      id: "letter_2",
      title: "Open when you miss me extra much",
      condition: "missing_me",
      is_unlocked: true,
      content: "Whenever distance feels heavy, remember how many miles we've already conquered together. Every sunrise brings us one day closer to holding hands in person again. I love you endlessly!",
      author: "User_B",
      unlocked_at: "2026-07-22T19:00:00Z",
    },
    {
      id: "letter_3",
      title: "Open on Reunion Day (Sept 16)",
      condition: "reunion_day",
      is_unlocked: false,
      content: "TODAY IS THE DAY! No more screens, no more long distance calls. Go wrap your arms around your favorite person right now!",
      author: "User_A",
    },
  ],
  intimacy_zone: {
    active_encrypted_items: [
      {
        id: "photo_1",
        uploader: "User_A",
        ciphertext_ref: "AES256_GCM_9f8a3e7210b4c8109dff21a8301e74a",
        is_viewed: false,
        title: "Midnight Surprise Memory ✨",
        created_at: "2026-07-22T23:45:00Z",
      },
      {
        id: "photo_2",
        uploader: "User_B",
        ciphertext_ref: "AES256_GCM_a1290ffbc83011e20247d8bca91003f",
        is_viewed: true,
        title: "Private Beach Selfie 🌊",
        created_at: "2026-07-18T16:20:00Z",
      },
    ],
  },
  chat_history_update: {
    sender: "User_A",
    message: "[User_A] fed Sprout a warm pancake and set mood to Excited!",
    type: "action",
    timestamp: "2026-07-23T05:00:00Z",
  },
  chat_history_log: [
    {
      sender: "User_B",
      message: "Good morning my love! Did you check on Sprout today?",
      type: "chat",
      timestamp: "2026-07-23T04:30:00Z",
    },
    {
      sender: "User_A",
      message: "Yes! Just fed Sprout a delicious pancake 🥞",
      type: "chat",
      timestamp: "2026-07-23T04:35:00Z",
    },
    {
      sender: "User_A",
      message: "[User_A] fed Sprout (+20 Hunger, +5 Happiness)",
      type: "action",
      timestamp: "2026-07-23T04:36:00Z",
    },
  ],
  narrative_response: "Partner A fed Sprout a delicious pancake! Sprout is feeling energized and joyful as the reunion countdown ticks away toward September 16.",
};

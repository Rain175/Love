import { OrbitState } from "../types";
import { calculateCountdown, TARGET_REUNION_DATE } from "../utils/countdown";

export const initialOrbitState: OrbitState = {
  timestamp: new Date().toISOString(),
  active_user: "User_A",
  countdown: calculateCountdown(TARGET_REUNION_DATE),
  tamagotchi: {
    name: "Sprout",
    hunger: 90,
    happiness: 90,
    energy: 85,
    status_message: "Sprout is happy and waiting for your first shared memory!",
    selected_skin: "sprout",
  },
  users: {
    user_a: {
      name: "Nithilan",
      mood: "Happy",
      last_action: "Joined Orbit",
      avatar_color: "from-pink-400 to-rose-500",
      location: {
        lat: 37.7749,
        lng: -122.4194,
        updated_at: new Date().toISOString(),
        city_or_place: "San Francisco, CA",
        battery_level: 88,
        is_sharing: true,
      },
    },
    user_b: {
      name: "Sofia",
      mood: "Loving",
      last_action: "Joined Orbit",
      avatar_color: "from-indigo-400 to-purple-500",
      location: {
        lat: 51.5074,
        lng: -0.1278,
        updated_at: new Date().toISOString(),
        city_or_place: "London, UK",
        battery_level: 94,
        is_sharing: true,
      },
    },
  },
  scrapbook: [],
  photobooth_requests: [],
  letters: [],
  intimacy_zone: {
    active_encrypted_items: [],
  },
  chat_history_log: [],
  narrative_response: "Welcome to Orbit! Your private shared space is ready. Start by sending messages, writing letters, or uploading photo memories together.",
};

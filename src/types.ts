export type UserRole = "User_A" | "User_B";

export interface UserProfile {
  name: string;
  mood: string;
  last_action: string;
  avatar_color?: string;
  uid?: string;
  email?: string;
  photo_url?: string;
}

export interface CountdownState {
  target_date: string;
  days_remaining: number;
  hours_remaining: number;
  minutes_remaining?: number;
}

export interface TamagotchiState {
  name: string;
  hunger: number;
  happiness: number;
  energy: number;
  status_message: string;
  last_fed?: string;
  last_played?: string;
}

export interface ScrapbookItem {
  id: string;
  author: UserRole;
  caption: string;
  timestamp: string;
  image_url?: string;
  tags?: string[];
  is_photobooth_strip?: boolean;
  photobooth_data?: {
    requester_photo: string;
    responder_photo: string;
    theme?: string;
  };
}

export interface PhotoBoothRequest {
  id: string;
  requester: UserRole;
  requester_name: string;
  requester_photo: string;
  requester_caption?: string;
  responder_photo?: string;
  status: "pending" | "completed";
  created_at: string;
  completed_at?: string;
}

export interface LetterItem {
  id: string;
  title: string;
  condition: string;
  is_unlocked: boolean;
  content?: string;
  author?: UserRole;
  unlocked_at?: string;
}

export interface EncryptedIntimacyItem {
  id: string;
  uploader: UserRole;
  ciphertext_ref: string;
  is_viewed: boolean;
  title?: string;
  secret_message?: string;
  image_url?: string;
  created_at?: string;
  image_placeholder?: string;
}

export type ChatMessageType = "chat" | "action" | "scrapbook" | "letter" | "intimacy";

export interface ChatMessageUpdate {
  sender: UserRole;
  message: string;
  type: ChatMessageType;
  timestamp?: string;
}

export interface OrbitState {
  roomCode?: string;
  timestamp: string;
  active_user: UserRole;
  countdown: CountdownState;
  tamagotchi: TamagotchiState;
  users: {
    user_a: UserProfile;
    user_b: UserProfile;
  };
  scrapbook: ScrapbookItem[];
  photobooth_requests?: PhotoBoothRequest[];
  letters: LetterItem[];
  intimacy_zone: {
    active_encrypted_items: EncryptedIntimacyItem[];
  };
  chat_history_update: ChatMessageUpdate;
  chat_history_log?: ChatMessageUpdate[];
  narrative_response: string;
}

export type MinigameType = "feed" | "play" | "rest" | "pet";

export interface ActionPayload {
  active_user: UserRole;
  action_type: 
    | "chat" 
    | "feed_sprout" 
    | "play_sprout" 
    | "rest_sprout" 
    | "pet_sprout" 
    | "set_mood" 
    | "add_scrapbook" 
    | "create_photobooth_request"
    | "complete_photobooth_request"
    | "unlock_letter" 
    | "add_letter" 
    | "view_intimacy" 
    | "add_intimacy" 
    | "update_countdown"
    | "raw_command";
  action_input?: string;
  extra_data?: any;
}

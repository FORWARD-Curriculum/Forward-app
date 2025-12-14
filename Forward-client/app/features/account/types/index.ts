/**
 * Represents a User, usually provided by the server
 * @field profile_picture - A url to CDN
 * @interface
 */
export interface User {
    display_name: string;
    username: string;
    id: string;
    facility: string | null;
    profile_picture?: string;
    consent: boolean;
    surveyed_at: string | null;
    preferences: {
      theme: "light" | "dark" | "high-contrast";
      text_size: "txt-sm" | "txt-md" | "txt-base" | "txt-lg" | "txt-xl" | "txt-2xl" | "txt-3xl";
      speech_uri_index?: number;
      speech_speed?: number;
    };
  }
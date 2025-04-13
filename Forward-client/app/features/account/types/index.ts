/**
 * Represents a User, usually provided by the server
 * @field profile_picture - A url to CDN
 * @interface
 */
export interface User {
    display_name: string;
    username: string;
    id: string;
    facility_id: string | null;
    profile_picture?: string;
    consent: boolean;
    preferences: {
      theme: "light" | "dark" | "high-contrast";
      text_size: "txt-sm" | "txt-base" | "txt-lg" | "txt-xl";
      speech_uri_index?: number;
      speech_speed?: number;
    };
  }
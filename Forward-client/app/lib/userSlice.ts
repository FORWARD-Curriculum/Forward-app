import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * Represents a User, usually provided by the server
 * @field profile_picture - A url to CDN 
 * @interface
 */
export interface User {
  displayName: string;
  username: string;
  id: string;
  facility_id?: string;
  profilePicture?: string;
  consent?: boolean;
}

const initialState: { user: User | null } = { user: null };

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
  },
});

export const { setUser } = userSlice.actions;

export default userSlice.reducer;

import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * Represents a User, usually provided by the server
 * @interface
 */
export interface User {
  firstName: string;
  lastName: string;
  username: string;
  id: string;
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

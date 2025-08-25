import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { User } from "@/features/account/types";

const initialState: {
  user: User | null,
  status: "idle" | "loading" | "succeeded" | "failed";
 } = { user: null, status: "idle" };

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.status = action.payload ? "succeeded" : "failed";
    },
    setAuthLoading: (state) => {
      state.status = "loading";
    },
  },
});

export const { setUser, setAuthLoading } = userSlice.actions;

export default userSlice.reducer;

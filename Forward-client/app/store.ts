import {
  configureStore,
  type StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { userSlice } from "./lib/userSlice";

/**
 * Add reducers here to enforce type safety
 */
const reducer = {
  user: userSlice.reducer,
};
/**
 * This type is good for using useSelector((s: RootState)=>s.<something>)
 * Type-Safe store access
 */
export type RootState = StateFromReducersMapObject<typeof reducer>;

// Only run if code is on client
const preloadedState: RootState | undefined =
  typeof window === "undefined"
    ? undefined
    : JSON.parse(localStorage.getItem("reduxState") || "null") || undefined;

const store = configureStore({
  reducer,
  preloadedState,
  devTools: import.meta.env.DEV,
});

export default store;

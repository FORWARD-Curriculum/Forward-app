import {
  configureStore,
  type StateFromReducersMapObject,
} from "@reduxjs/toolkit";
import { userSlice } from "@/features/account/slices/userSlice";
import { curriculumSlice } from "@/features/curriculum/slices/curriculumSlice";
import { lessonSlice } from "@/features/curriculum/slices/lessonSlice";
import { userLessonDataSlice } from "./features/curriculum/slices/userLessonDataSlice";
import { loggingSlice } from "./features/logging/slices/loggingSlice";
import { actionLogMiddleware } from "./features/logging/utils/middleware";

/**
 * Add reducers here to enforce type safety
 */
const reducer = {
  user: userSlice.reducer,
  curriculum: curriculumSlice.reducer,
  lesson: lessonSlice.reducer,
  response: userLessonDataSlice.reducer,
  logging: loggingSlice.reducer,
};

/**
 * This type is good for using useSelector((s: RootState)=>s.<something>)
 * Type-Safe store access
 */
export type RootState = StateFromReducersMapObject<typeof reducer>;

const store = configureStore({
  reducer,
  devTools: import.meta.env.DEV ? {actionsDenylist: ['logging/addDispatch','response/saveCurrentResponse','response/saveUserResponse']} : false,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({serializableCheck: false}).concat(actionLogMiddleware),
});

export type AppDispatch = typeof store.dispatch

export default store;

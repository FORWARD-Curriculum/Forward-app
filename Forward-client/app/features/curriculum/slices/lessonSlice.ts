import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { Lesson } from "../types";

const initialState: {
  lesson: Lesson | null;
  currentActivity: number;
} = { lesson: null, currentActivity: 0 };

export const lessonSlice = createSlice({
  name: "lesson",
  initialState,
  reducers: {
    setLesson: (state, action: PayloadAction<Lesson | null>) => {
      state.lesson = action.payload;
    },
    nextActivity: (state) => {
      state.currentActivity += 1;
    },
    previousActivity: (state) => {
      state.currentActivity -= 1;
    },
    setActivity: (state, action: PayloadAction<number>) => {
      state.currentActivity = action.payload;
    }
  },
});

export const { setLesson,nextActivity,previousActivity,setActivity } = lessonSlice.actions;

export default lessonSlice.reducer;

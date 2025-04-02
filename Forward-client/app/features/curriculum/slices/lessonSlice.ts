import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { Lesson } from "../types";

const initialState: {
  lesson: Lesson | null;
  current_activity: number;
} = { lesson: null, current_activity: 0 };

export const lessonSlice = createSlice({
  name: "lesson",
  initialState,
  reducers: {
    setLesson: (state, action: PayloadAction<Lesson | null>) => {
      state.lesson = action.payload;
    },
    nextActivity: (state) => {
      state.current_activity += 1;
    },
    previousActivity: (state) => {
      state.current_activity -= 1;
    },
    setActivity: (state, action: PayloadAction<number>) => {
      state.current_activity = action.payload;
    }
  },
});

export const { setLesson,nextActivity,previousActivity,setActivity } = lessonSlice.actions;

export default lessonSlice.reducer;

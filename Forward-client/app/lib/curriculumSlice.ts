import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { Lesson } from "./lessonSlice";

const initialState: {
  lessons: Lesson[] | null;
  currentLessonId: number | null;
} = { lessons: null, currentLessonId: null };

export const curriculumSlice = createSlice({
  name: "curriculum",
  initialState,
  reducers: {
    setCurriculum: (state, action: PayloadAction<Lesson[] | null>) => {
      state.lessons = action.payload;
    },
  },
});

export const { setCurriculum } = curriculumSlice.actions;

export default curriculumSlice.reducer;

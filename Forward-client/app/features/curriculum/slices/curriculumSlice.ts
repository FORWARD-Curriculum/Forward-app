import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { Lesson } from "@/features/curriculum/types";

const initialState: {
  lessons: Lesson[] | null;
} = { lessons: null};

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

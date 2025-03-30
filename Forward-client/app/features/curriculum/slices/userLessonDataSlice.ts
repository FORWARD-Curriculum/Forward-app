import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  type BaseResponse,
  type LessonResponse,
} from "@/features/curriculum/types";
import { apiFetch } from "../../../utils/utils";
import type { RootState } from "@/store";

const initialState: LessonResponse = {
  lessonId: null,
  highestActivity: 1,
  timeSpent: Date.now(),
  responseData: { Quiz: [], PollQuestion: [], Writing: [], Question: [], TextContent: [] },
};

/**
 * Posts a user response object to the server to "save" it, then
 * stores in the slice for local state management.
 */
export const saveUserResponseThunk = createAsyncThunk(
  "response/saveUserResponse",
  async (
    data: {
      type: keyof NonNullable<LessonResponse["responseData"]>;
      response: BaseResponse;
      trackTime: boolean;
    },
    thunkAPI,
  ): Promise<{type: keyof NonNullable<LessonResponse["responseData"]>,response: BaseResponse} | undefined> => {
    // compute timeSpent
    const state = thunkAPI.getState() as RootState;
    const lastTime = state.response.timeSpent;
    data.response = {
      ...data.response,
      timeSpent: data.trackTime
        ? data.response.timeSpent + Math.round((Date.now() - lastTime) / 1000)
        : 0,
    };

    // NOTE: SERVER ***ONLY*** RECIEVES THE AGGREGATE TIME
    const response = await apiFetch(`/${data.type.toLowerCase()}/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({lessonId: state.lesson.lesson?.id, ...data.response}),
    });


    if (response.ok) {
      if (data.trackTime) thunkAPI.dispatch(resetTimeSpent());
      const json = await response.json();
      return {type: data.type, response: json.data as BaseResponse};
    }
  },
);

export const userLessonDataSlice = createSlice({
  name: "response",
  initialState,
  reducers: {
    setResponse: (state, action: PayloadAction<LessonResponse>) => {
      return action.payload;
    },
    incrementHighestActivity: (state) => {
      state.highestActivity += 1;
    },
    decrementHighestActivity: (state) => {
      state.highestActivity -= 1;
    },
    setHighestActivity: (state, action: PayloadAction<number>) => {
      state.highestActivity = action.payload;
    },
    resetTimeSpent: (state) => {
      state.timeSpent = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder.addCase(saveUserResponseThunk.fulfilled, (state, action) => {
      if (state.responseData && action.payload) {
        const { type, response } = action.payload;
        const existingResponseIndex = state.responseData[type].findIndex(
          (s) => s.associatedActivity === response.associatedActivity,
        );

        if (existingResponseIndex >= 0) {
          state.responseData[type] = state.responseData[type].map(
            (item, index) =>
              index === existingResponseIndex ? response : (item as any),
          );
        } else {
          (state.responseData[type] as BaseResponse[]).push(response);
        }
      }
    });
  },
});

export const {
  setResponse,
  incrementHighestActivity,
  decrementHighestActivity,
  setHighestActivity,
  resetTimeSpent,
} = userLessonDataSlice.actions;

export default userLessonDataSlice.reducer;

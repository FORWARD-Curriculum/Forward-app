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

export const initialLessonResponseState: LessonResponse = {
  lesson_id: null,
  highest_activity: 1,
  time_spent: Date.now(),
  current_response: null,
  response_data: {
    Quiz: [],
    PollQuestion: [],
    Writing: [],
    Question: [],
    TextContent: [],
    ConceptMap: [],
    Identification: [],
    Poll: [],
    Embed: [],
    LikertScale: [],
    Twine: [],
    DndMatch: [],
    Video: []
  },
};

/**
 * Posts a user response object to the server to "save" it, then
 * stores in the slice for local state management.
 */
export const saveUserResponseThunk = createAsyncThunk(
  "response/saveUserResponse",
  async (
    data: {
      type: keyof NonNullable<LessonResponse["response_data"]>;
      response: BaseResponse;
      trackTime: boolean;
    },
    thunkAPI,
  ): Promise<
    | {
        type: keyof NonNullable<LessonResponse["response_data"]>;
        response: BaseResponse;
      }
    | undefined
  > => {
    // compute timeSpent
    const state = thunkAPI.getState() as RootState;
    const lastTime = state.response.time_spent;
    data.response = {
      ...data.response,
      time_spent: data.trackTime
        ? data.response.time_spent + Math.round((Date.now() - lastTime) / 1000)
        : 0,
    };

    // NOTE: SERVER ***ONLY*** RECIEVES THE AGGREGATE TIME
    const url = data.type === "Question"
      ? `/quizzes/${(data.response as any).quiz_id}/questions/${data.response.associated_activity}/response`
      : `/responses/${data.type.toLowerCase()}`;

    const response = await apiFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_id: state.lesson.lesson?.id,
        ...data.response,
      }),
    });

    if (response.ok) {
      if (data.trackTime) thunkAPI.dispatch(resetTimeSpent());
      const json = await response.json();

      // lets see if this will work on the question edge case, since it is 
      // treated differently as a child
      // please worrrrrrk
    // if (data.type === "Question") {
    //   const transformed = {
    //     type: data.type,
    //     response: {
    //       id: json.data.id,
    //       associated_activity: json.data.question_id,
    //       response_data: json.data.response_data,
    //       attempts_left: json.data.attempts_left,
    //       partial_response: json.data.partial_response,
    //       quiz_id: json.data.quiz_response_id,
    //       lesson_id: state.lesson.lesson?.id,
    //       time_spent: json.data.time_spent
    //     }
    //   };
    //   console.log("Transformed Question response:", transformed);
    //   return transformed;
    // }
    }
  },
);

export const userLessonDataSlice = createSlice({
  name: "response",
  initialState: initialLessonResponseState,
  reducers: {
    setResponse: (state, action: PayloadAction<LessonResponse>) => {
      return action.payload;
    },
    resetResponseState: () => {
      return initialLessonResponseState;
    },
    incrementHighestActivity: (state) => {
      state.highest_activity += 1;
    },
    decrementHighestActivity: (state) => {
      state.highest_activity -= 1;
    },
    setHighestActivity: (state, action: PayloadAction<number>) => {
      state.highest_activity = action.payload;
    },
    resetTimeSpent: (state) => {
      state.time_spent = Date.now();
    },
    setCurrentResponse(state, action: PayloadAction<BaseResponse | null>) {
      state.current_response = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(saveUserResponseThunk.fulfilled, (state, action) => {
      if (state.response_data && action.payload) {
        const { type, response } = action.payload;
        const existingResponseIndex = state.response_data[type].findIndex(
          (s) => s.associated_activity === response.associated_activity,
        );

        if (existingResponseIndex >= 0) {
          state.response_data[type] = state.response_data[type].map(
            (item, index) =>
              index === existingResponseIndex ? response : (item as any),
          );
        } else {
          (state.response_data[type] as BaseResponse[]).push(response);
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
  setCurrentResponse,
  resetResponseState,
} = userLessonDataSlice.actions;

export default userLessonDataSlice.reducer;

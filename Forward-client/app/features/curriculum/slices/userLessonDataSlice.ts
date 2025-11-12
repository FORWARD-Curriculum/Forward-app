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

type ResponseContext = {
  type: keyof NonNullable<LessonResponse["response_data"]>;
  trackTime: boolean;
} | null;

export const initialLessonResponseState: LessonResponse & {
  current_context: ResponseContext;
} = {
  lesson_id: null,
  highest_activity: 1,
  time_spent: Date.now(),
  current_response: null,
  response_data: {
    Quiz: [],
    PollQuestion: [],
    Writing: [],
    FillInTheBlank: [],
    // Question: [],
    TextContent: [],
    ConceptMap: [],
    Identification: [],
    Poll: [],
    Embed: [],
    LikertScale: [],
    Twine: [],
    DndMatch: [],
    Video: [],
    Slideshow: [],
    CustomActivity: []
  },
  current_context: null
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
    
    const state = thunkAPI.getState() as RootState;

    // If no user logged in, return, no actions performed
    if (!state.user.user){
      return undefined
    }

    // compute timeSpent
    const lastTime = state.response.time_spent;
    data.response = {
      ...data.response,
      time_spent: data.trackTime
        ? data.response.time_spent + Math.round((Date.now() - lastTime) / 1000)
        : 0,
    };

    // NOTE: SERVER ***ONLY*** RECIEVES THE AGGREGATE TIME
    const url = `/responses/${data.type.toLowerCase()}`;

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
      return { type: data.type, response: json.data as BaseResponse };
    }
  },
);

export const saveCurrentResponseThunk = createAsyncThunk(
  "response/saveCurrentResponse",
  async (_, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const ctx = state.response.current_context;
    const resp = state.response.current_response;

    if (!ctx || !resp) return undefined;

    return await thunkAPI
      .dispatch(
        saveUserResponseThunk({
          type: ctx.type,
          response: resp,
          trackTime: ctx.trackTime,
        }),
      )
      .unwrap();
  },
);

export const userLessonDataSlice = createSlice({
  name: "response",
  initialState: initialLessonResponseState,
  reducers: {
    setResponse: (state, action: PayloadAction<LessonResponse>) => {
      return {...action.payload, current_context: state.current_context};
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
    setCurrentContext(
      state,
      action: PayloadAction<ResponseContext>,
    ) {
      state.current_context = action.payload;
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
  setCurrentContext
} = userLessonDataSlice.actions;

export default userLessonDataSlice.reducer;

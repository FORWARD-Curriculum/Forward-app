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

/**
 * Provides a function that may be used anywhere in-app to save whatever the current
 * managed response is in memory. This is useful/different from before, as now, the
 * high-level lesson component manages saving data to the backend, but allows us to not
 * proceed in the lesson if the backend fails, contrary to prior, when the student could
 * happily continue on without saving anything.
 * 
 * It is also important to note that current_response in the slice is NOT updated on a
 * fulfilled request, as the assumption is this being primarily used on a navigation AWAY
 * from some component expecting current_response to be their own, and not what may have
 * overrwritten it on hook initialization.
 * 
 * If, there is a case where the active activity compnent needs to have up-to-date info
 * from the backend (see the quiz.tsx compnent) OR saving occurs on a non-unmounting event,
 * such as the end of a lesson displaying a modal and saving response at the same time,
 * the pattern I have chosen to adopt is to call the thunk and update current_response as
 * follows:
 * 
 * @example
 * ```ts
 * await dispatch(saveCurrentResponseThunk())
 *   .unwrap()
 *   .then((save_response_thunk_result) => {
 *     const user_response_thunk_result = save_response_thunk_result?.payload;
 *     if (!user_response_thunk_result) throw new Error();
 *     setCurrentResponse((user_response_thunk_result as any).response as BaseResponse);
 *   })
 *   .catch((rejectedValueOrSerializedError) => {
 *     toast.error("Something went wrong saving that question.");
 *   });
 * ```
 * 
 * If, dear reader, you wish to make a helper function that auto-toasts or magically handles
 * this, be my guest, but I prefer the explicit-ness of this right now.
 */
export const saveCurrentResponseThunk = createAsyncThunk(
  "response/saveCurrentResponse",
  async (
    overrideResponse: Partial<BaseResponse> | undefined = {} as BaseResponse,
    thunkAPI,
  ) => {
    const state = thunkAPI.getState() as RootState;
    const ctx = state.response.current_context;
    const resp = state.response.current_response;

    if (!ctx || !resp) return undefined;

    return await thunkAPI.dispatch(
      saveUserResponseThunk({
        type: ctx.type,
        response: { ...resp, ...overrideResponse },
        trackTime: ctx.trackTime,
      }),
    );
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

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  type BaseActivity,
  type BaseResponse,
  type PollQuestion,
  type PollQuestionResponse,
  type Question,
  type QuestionResponse,
  type QuizResponse,
  type TextContent,
  type TextContentResponse,
  type WritingResponse,
} from "./lessonSlice";
import { apiFetch } from "../utils";
import type { AppDispatch, RootState } from "@/store";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * Slice interface that stores all info relating to data the user inputs.
 * Decoupled from lessonSlice to separate logic, passing only id references
 * for the server to manage.
 *
 * @field timeSpent: The last time since resetting the timeSpent, used
 * to track the amount of time spent on a response without unnessecarily
 * updating the store.
 */
export interface LessonResponse {
  lessonId: number | null;
  highestActivity: number;
  timeSpent: number;
  responseData: {
    TextContent: TextContentResponse[];
    Quiz: QuizResponse[];
    Question: QuestionResponse[];
    Poll: PollQuestionResponse[];
    Writing: WritingResponse[];
  };
}

/**
 * Returns a the outut of a `useState<T>()` to be used on for reactive, managed response
 * state. Automatically saves the response data to the Redux Store/Backend when the component
 * is unmounted, or when `saveResponse()` is called.
 *
 * @param type - Type of the activity to know what reponse goes where.
 * @param activity - The activity object to retrieve id from.
 * @param trackTime - Used in Higher Order Activites (Quiz, Poll) to indicate that time
 * should not be tracked as a whole, but instead is the aggregate of the children's times.
 * This is important to ensure that the unmounting of the parent, which if true calls the
 * `resetTimeSpent()`, and thus tracked time would be inacurate for children.
 * @param initialFields - Due to the nature of generics, the only fields we can guarantee on
 * an initialize are those from the LCD response type {@link BaseResponse}, and so to not have
 * undefined fields can populate them on creation.
 * @returns `[response, setResponse, saveResponse] as const`
 * 
 * @example
 * ```typescript
 *  const [response, setResponse, saveResponse] = useResponse<QuestionResponse, Question>("Quiz", quiz, false, { highestQuestionReached: 0 });
 *  //...
 *    onClick={()=>setResponse({...response, highestQuestionReached: response.highestQuestionReached + 1})};
 *  //...
 * ```
 */
export const useResponse = <
  T extends BaseResponse,
  E extends BaseActivity | Question | PollQuestion | TextContent,
>(
  type: keyof NonNullable<LessonResponse["responseData"]>,
  activity: E,
  trackTime: boolean,
  initialFields?: Partial<T>,
) => {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((state: RootState) =>
    state.response.responseData[type].find((s) => s.id === activity.id),
  );

  // Create state as before
  const [response, setResponse] = useState<T>(
    state
      ? (state as unknown as T)
      : ({
          id: activity.id,
          timeSpent: 0,
          attemptsLeft: 3,
          ...initialFields,
        } as T),
  );

  // Add a ref to track the latest response
  const responseRef = useRef<T>(response);

  // Update the ref whenever response changes
  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  // Save response to store/server on unmount
  useEffect(() => {
    return saveResponse;
  }, []);

  /**
   * Dispatch to `saveUserResponseThunk` to save the current response state.
   */
  const saveResponse = () => {
    dispatch(
      saveUserResponseThunk({
        type,
        response: responseRef.current,
        trackTime,
      }),
    );
  };

  return [response, setResponse, saveResponse] as const;
};

const initialState: LessonResponse = {
  lessonId: null,
  highestActivity: 1,
  timeSpent: Date.now(),
  responseData: { Quiz: [], Poll: [], Writing: [], Question: [], TextContent: [] },
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
  ) => {
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
    const response = await apiFetch(`/response/${data.type.toLowerCase()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.response),
    });

    // TODO: Validate OK status, this is only for not having a backend
    //if (response.ok) {
    if (data.trackTime) thunkAPI.dispatch(resetTimeSpent());
    return data;
    //}
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
          (s) => s.id === response.id,
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

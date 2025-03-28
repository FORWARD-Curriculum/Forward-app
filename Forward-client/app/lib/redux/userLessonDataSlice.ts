import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  type BaseResponse,
  type PollQuestionResponse,
  type QuestionResponse,
  type QuizResponse,
  type WritingResponse,
} from "./lessonSlice";
import { apiFetch } from "../utils";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";

/**
 *
 * @param responseArray - quizzes, polls...
 * @param response - one of the response objects
 * @param order
 */
function updateResponseData<T extends BaseResponse>(
  responseArray: Array<{ id: number; order: number; responses: T[] }>,
  response: T,
  order: number,
) {
  const existingItem = responseArray.find(
    (item) => item.id === response.associatedId,
  );
  if (existingItem) {
    const existingResponse = existingItem.responses.find(
      (r) => r.id === response.id,
    );
    if (existingResponse) {
      const totalTimeSpent = existingResponse.timeSpent + response.timeSpent;
      response.timeSpent = totalTimeSpent;
      Object.assign(existingResponse, response);
    } else {
      existingItem.responses.push(response);
    }
  } else {
    responseArray.push({
      id: response.associatedId,
      order,
      responses: [response],
    });
  }
}
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
  responseData: null | {
    quizzes: QuizResponse[];
    polls: {
      id: number;
      order: number;
      responses: PollQuestionResponse[];
    }[];
    writings: {
      id: number;
      order: number;
      responses: WritingResponse[];
    }[];
  };
}

const initialState: LessonResponse = {
  lessonId: null,
  highestActivity: 1,
  timeSpent: Date.now(),
  responseData: { quizzes: [], polls: [], writings: [] },
};

/**
 * Posts a user response object to the server to "save" it, then
 * stores in the slice for local state management.
 */
export const saveUserResponseThunk = createAsyncThunk(
  "response/saveUserResponse",
  async (
    data: {
      type: "Quiz" | "Poll" | "Writing";
      order: number;
      response: QuestionResponse | PollQuestionResponse | WritingResponse;
    },
    thunkAPI,
  ) => {
    // compute lastTime
    const state = thunkAPI.getState() as RootState;
    const lastTime = state.response.timeSpent;
    data.response.timeSpent = Math.floor((Date.now() - lastTime)/1000);
    
    // FIXME: SERVER DOES NOT RECIEVE THE AGGREGATE TIME, MUST ALSO DO THIS IN THE VIEW
    const response = await apiFetch(`/response/${data.type.toLowerCase()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.response),
    });
    
    // TODO: Validate OK status, this is only for not having a backend
    //if (response.ok) {
      thunkAPI.dispatch(resetTimeSpent())
    return data;
    //}
  },
);

export const userLessonDataSlice = createSlice({
  name: "response",
  initialState,
  reducers: {
    setResponse: (state, action: PayloadAction<LessonResponse>) => {
      state = action.payload;
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
        const { type, order, response } = action.payload;
        switch (type) {
          case "Quiz":
            updateResponseData(
              state.responseData.quizzes,
              response as QuestionResponse,
              order,
            );
            break;
          case "Poll":
            updateResponseData(
              state.responseData.polls,
              response as PollQuestionResponse,
              order,
            );
            break;
          case "Writing":
            updateResponseData(
              state.responseData.writings,
              response as WritingResponse,
              order,
            );
            break;
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

import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  type PollQuestionResponse,
  type QuestionResponse,
  type WritingResponse,
} from "./lessonSlice";
import { apiFetch } from "../utils";

function updateResponseData<T extends { id: number; associatedId: number }>(
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

export interface LessonResponse {
  lessonId: number | null;
  highestActivity: number;
  timeSpent: number;
  responseData: null | {
    quizzes: {
      id: number;
      order: number;
      responses: QuestionResponse[];
    }[];
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
  timeSpent: 0,
  responseData: { quizzes: [], polls: [], writings: [] },
};

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
    const response = await apiFetch(`/response/${data.type.toLowerCase()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data.response),
    });
    // TODO: Validate OK status, this is only for not having a backend
    //if (response.ok) {
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
      state.timeSpent = 0;
    },
    incrementTimeSpent: (state) => {
      state.timeSpent += 1;
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
  incrementTimeSpent,
  resetTimeSpent
} = userLessonDataSlice.actions;

export default userLessonDataSlice.reducer;

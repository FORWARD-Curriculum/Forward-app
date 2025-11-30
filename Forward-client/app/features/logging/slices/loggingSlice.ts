import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const initialState: {
  errors: any[];
  dispatches: {
    date: string;
    type: any;
    payload: any;
    changed: string[];
    durationMs: number;
  }[];
} = {
  errors: [],
  dispatches: [],
};

export const loggingSlice = createSlice({
  name: "logging",
  initialState,
  reducers: {
    addError: (state, action: PayloadAction<any>) => {
      state.errors.unshift(action.payload);
      state.errors.splice(30);
    },
    addDispatch: (state, action: PayloadAction<typeof initialState['dispatches'][0]>) => {
      state.dispatches.unshift(action.payload);
      state.dispatches.splice(30);
    },
  },
});

export const { addError, addDispatch } = loggingSlice.actions;

import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface Lesson {
  id: number;
  title: string;
  description: string;
  objectives: string[];
  order: number;
  tags: string[];
  image: string | undefined;
  activities: (BaseActivity | TextContent)[];
}

export interface BaseActivity {
  type: "Writing" | "Quiz" | "Poll";
  title: string;
  instructions: string;
  order: number;
}

export interface TextContent{
  type: "TextContent";
  title: string;
  content: string;
  order: number;
}

export interface Writing extends BaseActivity {
  prompts: string[];
}

export interface Quiz extends BaseActivity {
  passing_score: number;
  feedback_config: {
    passing: string;
    failing: string;
  };
  questions: Question[];
}

export interface Question {
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "multiple_select";
  has_correct_answer: boolean;
  choices: {
    options: {
      id: number;
      text: string;
      is_correct: boolean;
    }[],
    feedback: {
      correct: string;
      incorrect: string;
    };
  }
  is_required: boolean;
}

export interface Poll extends BaseActivity {
  config: {
    show_results: boolean;
    allow_anonymous: boolean;
  }
  questions: PollQuestion[];
}

export interface PollQuestion {
  question_text: string;
  options: 
    {
      id: number;
      text: string;
    }[]
  
  allow_multiple: boolean;
  order: number;
}

const initialState: {
  lesson: Lesson | null;
  currentActivity: number;
} = { lesson: null, currentActivity: 0 };

export const lessonSlice = createSlice({
  name: "lesson",
  initialState,
  reducers: {
    setLesson: (state, action: PayloadAction<Lesson | null>) => {
      state.lesson = action.payload;
    },
    nextActivity: (state) => {
      state.currentActivity += 1;
    },
    previousActivity: (state) => {
      state.currentActivity -= 1;
    },
    setActivity: (state, action: PayloadAction<number>) => {
      state.currentActivity = action.payload;
    }
  },
});

export const { setLesson,nextActivity,previousActivity,setActivity } = lessonSlice.actions;

export default lessonSlice.reducer;

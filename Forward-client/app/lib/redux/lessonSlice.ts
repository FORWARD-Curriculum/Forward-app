import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { useSearchParams } from "react-router";

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
  lessonId: number;
  id: number;
  type: "Writing" | "Quiz" | "Poll";
  title: string;
  instructions: string;
  order: number;
}

export interface TextContent{
  id: number;
  lessonId: number;
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
  id: number;
  quizId: number;
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "multiple_select";
  hasCorrectAnswer: boolean;
  image?: string;
  caption?: string;
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
  isRequired: boolean;
}

export interface Poll extends BaseActivity {
  config: {
    show_results: boolean;
    allow_anonymous: boolean;
  }
  questions: PollQuestion[];
}

export interface PollQuestion {
  id: number;
  pollId: number;
  question_text: string;
  options: 
    {
      id: number;
      text: string;
    }[]
  allow_multiple: boolean;
  order: number;
}

/**
 * @field associatedId - ex: quizId, pollId...
 */
interface LessonResponse {
  id: number;
  associatedId: number;
  timeSpent: number;
  attempts: number | null;
}

/**
 * @field choices: an array of options by id
 */
export interface QuestionResponse extends LessonResponse {
  choices: number[]
}

/**
 * @field choices: an array of options by id
 */
export interface PollQuestionResponse extends LessonResponse  {
  choices: number[]
}

export interface WritingResponse extends LessonResponse  {
  response: string;
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

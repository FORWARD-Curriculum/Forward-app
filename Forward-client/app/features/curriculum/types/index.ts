// Fields should always be snake_case, and class names should always be ProperCase

export interface Lesson {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  order: number;
  tags: string[];
  image: string | undefined;
  activities: BaseActivity[];
}
/**
 * Check out the [ActivityManager class]({@link ../../../../../Forward-server/core/models.py})
 * defined in the backend.
 *
 * KV Format is as follows:
 * ```javascript
 *  ActivityNameAsString: [ActivityInterface, ActivityResponseInterface, child_class: boolean]
 * ```
 */
export type ActivityManager = {
  Identification: [Identification, IdentificationResponse, false];
  TextContent: [TextContent, TextContentResponse, false];
  Writing: [Writing, WritingResponse, false];
  Quiz: [Quiz, QuizResponse, false];
  Poll: [Poll, PollResponse, false];
  ConceptMap: [ConceptMap, ConceptMapResponse, false];
  Question: [Question, QuestionResponse, true];
  PollQuestion: [PollQuestion, PollQuestionResponse, true];
};

export const ActivityTypeDisplayNames: Record<BaseActivity["type"] | "Default", string> = {
  Writing: "Writing",
  Quiz: "Quiz",
  TextContent: "Info",
  Poll: "Poll",
  Default: "Activity",
  ConceptMap: "Concept Map",
  Identification: "Identification",
}

// #region -------------------------- Activities ---------------------------

export interface BaseActivity {
  id: string;
  lesson_id: string;
  // The below omits child classes
  type: {
    [K in keyof ActivityManager]: ActivityManager[K][2] extends false
      ? K
      : never;
  }[keyof ActivityManager];
  title: string;
  instructions: string | null;
  order: number;
}

export interface TextContent extends BaseActivity {
  content: string;
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
  id: string;
  quiz_id: number;
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "multiple_select";
  has_correct_answer: boolean;
  order: number;
  image?: string;
  caption?: string;
  choices: {
    options: {
      id: number;
      text: string;
      is_correct: boolean;
    }[];
  };
  is_required: boolean;
  attempts?: number;
  feedback_config: {
    correct: string;
    incorrect: string;
  };
}

export interface Poll extends BaseActivity {
  config: {
    show_results: boolean;
    allow_anonymous: boolean;
  };
  questions: PollQuestion[];
}

export interface PollQuestion {
  id: string;
  poll_id: number;
  question_text: string;
  options: {
    id: number;
    text: string;
  }[];
  allow_multiple: boolean;
  order: number;
}

export interface ConceptMap extends BaseActivity {
  summary: string;
  items: {
    term: string;
    image: string;
    definition: string;
  }[];
}

/**
 * @field content: A markdown string with <correct></correct> tags
 * surrounding the correct phrases for the uset to identify.
 */
export interface Identification extends BaseActivity {
  content: string;
  minimum_correct: number;
  feedback: string;
}

// #endregion -------------------------- Activities ---------------------------

// #region -------------------------- Responses ----------------------------

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
  lesson_id: string | null;
  highest_activity: number;
  time_spent: number;
  current_response: BaseResponse | null;
  response_data: {
    [K in keyof ActivityManager]: ActivityManager[K][1][];
  };
}

/**
 * @field id - The id recieved on serialization, or null (first time)
 * responding. A `null` value means that no response was recieved from
 * the server and it's expected the server will take note and generate
 * a new entry into the associated table.
 * @field associatedId - ex: quizId, pollId...
 */
export interface BaseResponse {
  id: null | string;
  associated_activity: string;
  partial_response: boolean;
  time_spent: number;
  attempts_left: number;
}

export interface QuizResponse extends BaseResponse {
  score: number | null;
  highest_question_reached: number;
}

/**
 * @field  Store the selected answer(s) as JSON
    - For multiple choice: `{"selected": "option_id"}`
    - For multiple select: `{"selected": ["option_id1", "option_id2"]}`
    - For true/false: `{"selected": true} or {"selected": false}`
 * @extends BaseResponse
 */
export interface QuestionResponse extends BaseResponse {
  response_data: { selected: number[] };
  quiz_id: string;
}

/**
 * @field choices: an array of options by id
 */
export interface PollQuestionResponse extends BaseResponse {
  response_data: number[];
}

export interface WritingResponse extends BaseResponse {
  response: string;
}

export interface TextContentResponse extends BaseResponse {}
export interface ConceptMapResponse extends BaseResponse {}
export interface IdentificationResponse extends BaseResponse {}
export interface PollResponse extends BaseResponse {}

// #endregion -------------------------- Responses ----------------------------

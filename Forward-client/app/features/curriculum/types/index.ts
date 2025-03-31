// BUG: The json exported by the various views on the backend have
// inconsistent camel/snake case formatting.

export interface Lesson {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  order: number;
  tags: string[];
  image: string | undefined;
  activities: (BaseActivity | TextContent)[];
}
//-------------------------- Activities -----------------------------{

export interface BaseActivity {
  lessonId: string;
  id: string;
  type: "Writing" | "Quiz" | "Poll";
  title: string;
  instructions: string;
  order: number;
}

export interface TextContent {
  id: string;
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
  passingScore: number;
  feedbackConfig: {
    passing: string;
    failing: string;
  };
  questions: Question[];
}

export interface Question {
  id: string;
  quizId: number;
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "multiple_select";
  hasCorrectAnswer: boolean;
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
  isRequired: boolean;
  attempts?: number;
  feedbackConfig: {
    correct: string;
    incorrect: string;
  };
}

export interface Poll extends BaseActivity {
  config: {
    showResults: boolean;
    allowAnonymous: boolean;
  };
  questions: PollQuestion[];
}

export interface PollQuestion {
  id: string;
  pollId: number;
  questionText: string;
  options: {
    id: number;
    text: string;
  }[];
  allowMultiple: boolean;
  order: number;
}

//}----------------------- Responses -----------------

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
  lessonId: string | null;
  highestActivity: number;
  timeSpent: number;
  responseData: {
    TextContent: TextContentResponse[];
    Quiz: QuizResponse[];
    Question: QuestionResponse[];
    PollQuestion: PollQuestionResponse[];
    Writing: WritingResponse[];
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
  associatedActivity: string;
  partialResponse: boolean | null;
  timeSpent: number;
  attemptsLeft: number;
}

export interface QuizResponse extends BaseResponse {
  score: number | null;
  highestQuestionReached: number;
  isComplete: boolean;
}

/**
 * @field  Store the selected answer(s) as JSON
    - For multiple choice: `{"selected": "option_id"}`
    - For multiple select: `{"selected": ["option_id1", "option_id2"]}`
    - For true/false: `{"selected": true} or {"selected": false}`
 * @extends BaseResponse
 */
export interface QuestionResponse extends BaseResponse {
  responseData: { selected: number[] };
  isCorrect?: boolean;
  quizId: string;
}

/**
 * @field choices: an array of options by id
 */
export interface PollQuestionResponse extends BaseResponse {
  responseData: number[];
}

export interface WritingResponse extends BaseResponse {
  response: string;
}

export interface TextContentResponse extends BaseResponse {}

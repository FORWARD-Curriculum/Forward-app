// BUG: The json exported by the various views on the backend have
// inconsistent camel/snake case formatting.

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
//-------------------------- Activities -----------------------------{

export interface BaseActivity {
  lessonId: number;
  id: number;
  type: "Writing" | "Quiz" | "Poll";
  title: string;
  instructions: string;
  order: number;
}

export interface TextContent {
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
  passingScore: number;
  feedbackConfig: {
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
      isCorrect: boolean;
    }[];
    feedback: {
      correct: string;
      incorrect: string;
    };
  };
  isRequired: boolean;
}

export interface Poll extends BaseActivity {
  config: {
    showResults: boolean;
    allowAnonymous: boolean;
  };
  questions: PollQuestion[];
}

export interface PollQuestion {
  id: number;
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
 * @field id - The id recieved on serialization, or null (first time)
 * responding. A `null` value means that no response was recieved from
 * the server and it's expected the server will take note and generate
 * a new entry into the associated table.
 * @field associatedId - ex: quizId, pollId...
 */
export interface BaseResponse {
  id: number;
  partialResponse: boolean | null;
  timeSpent: number;
  attemptsLeft: number;
}

export interface QuizResponse extends BaseResponse {
  score: number | null;
  highestQuestionReached: number;
}

/**
 * @field choices: an array of options by id
 * @extends BaseResponse
 */
export interface QuestionResponse extends BaseResponse {
  choices: number[];
}

export interface QuizResponse {
  id: number;
  associatedId: number;
  isComplete: boolean;
  questionResponses: QuestionResponse[];
}

/**
 * @field choices: an array of options by id
 */
export interface PollQuestionResponse extends BaseResponse {
  choices: number[];
}

export interface WritingResponse extends BaseResponse {
  response: string;
}

export interface TextContentResponse extends BaseResponse {}

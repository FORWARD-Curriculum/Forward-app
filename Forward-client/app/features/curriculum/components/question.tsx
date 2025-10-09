import { Skeleton } from "../../../components/ui/skeleton";
import MarkdownTTS from "../../../components/ui/markdown-tts";
import type { Question, QuestionResponse } from "@/features/curriculum/types";

export default function Question({
  question,
  questionNumber,
  answer,
  onAnswerChange,
  onCheckAnswer,
  disabled
}: {
  question: Question;
  questionNumber: number;
  answer: QuestionResponse | null;
  onAnswerChange: (questionId: string, answerData: { selected: number[] }) => void;
  onCheckAnswer: (questionId: string) => void;
  disabled: boolean;
}) {


  // question configuration
  const isMultipleSelect = question.question_type === "multiple_select";
  const correctAnswers = question.choices.options.filter(
    (option) => option.is_correct,
  );
  const selectedAnswers = answer?.response_data?.selected || [];

  // question state
  const isDisabled = disabled || (answer?.attempts_left ?? 3) <= 0;
  const isAnswered =
    selectedAnswers.length >= (isMultipleSelect ? correctAnswers.length : 1);

  // Check if the answer is correct
  const isCorrect = isMultipleSelect
    ? areArraysEqual(
        selectedAnswers.slice().sort(),
        correctAnswers.map((c) => c.id).sort(),
      )
    : correctAnswers.map((c) => c.id).includes(selectedAnswers[0]);

  /**
   * Handles when a user selects or deselects an option
   */
  const handleOptionChange = (choiceId: number) => {
    const currentSelected = answer?.response_data?.selected || [];
    const newSelected = isMultipleSelect
      ? toggleArrayItem(currentSelected, choiceId)
      : [choiceId];
    
    // informsa parent
    onAnswerChange(question.id, { selected: newSelected });
  };

  return (
    <div className="flex flex-col items-center gap-7">
      {/* Question Image and Caption */}
      <div className="flex flex-col gap-2">
        {question.image ? (
          <img src={question.image} alt={question.caption || "Question image"} />
        ) : (
          <Skeleton className="size-70" />
        )}
        {question.caption ? (
          <p>{question.caption}</p>
        ) : (
          <Skeleton className="h-[var(--txt-base)] w-70" />
        )}
      </div>

      <div className="flex">
        {/* Question Text and Options */}
        <MarkdownTTS
          className="flex flex-col items-center"
          controlsClassName="flex gap-2"
          controlsOrientation="vertical"
          key={questionNumber}
        >
          <fieldset>
            <legend className="max-w-[70ch]">
              {questionNumber + 1}. {question.question_text}
            </legend>
            {question.choices.options.map((option) => (
              <div className="flex pl-6" key={option.id}>
                <input
                  className="bg-primary"
                  type={isMultipleSelect ? "checkbox" : "radio"}
                  disabled={isDisabled}
                  checked={selectedAnswers.includes(option.id)}
                  onChange={() => handleOptionChange(option.id)}
                  id={`question-${questionNumber}:option-${option.id}`}
                  name={`question-${questionNumber}`}
                />
                <label
                  className="ml-2"
                  htmlFor={`question-${questionNumber}:option-${option.id}`}
                >
                  {/* This adds a pause between reading the options */}
                  <span className="text-[0px] opacity-0">.</span>
                  {option.text}
                </label>
              </div>
            ))}
          </fieldset>
        </MarkdownTTS>

        {/* Feedback area */}
        {isDisabled && isAnswered && (
          <p className="max-w-[40ch]">
            {isCorrect ? (
              <>
                <span className="text-green-600">Correct!</span>{" "}
                {question.feedback_config.correct}
              </>
            ) : (
              <>
                <span className="text-error">Not quite!</span>{" "}
                {question.feedback_config.incorrect}
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => onCheckAnswer(question.id)}
          disabled={isDisabled || selectedAnswers.length === 0}
          className="bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-md px-6 py-2"
        >
          Check Answer
        </button>
        
        <p className="text-sm text-gray-600">
          Attempts left: {answer?.attempts_left ?? 3}
        </p>
      </div>
    </div>
  );
}

/**
 * Helper function to check if two arrays have the same elements
 */
function areArraysEqual(arr1: any[], arr2: any[]): boolean {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

/**
 * Helper function to toggle an item in an array
 */
function toggleArrayItem(array: number[], item: number): number[] {
  return array.includes(item)
    ? array.filter((num) => num !== item)
    : [...array, item];
}
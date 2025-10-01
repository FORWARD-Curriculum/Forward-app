import { Skeleton } from "../../../components/ui/skeleton";
import MarkdownTTS from "../../../components/ui/markdown-tts";
import { useResponse } from "@/features/curriculum/hooks";
import type { Question, QuestionResponse } from "@/features/curriculum/types";
import { useEffect } from "react";

export default function Question({
  question,
  questionNumber,
  quizId,
  lessonId,
  setDone,
}: {
  question: Question;
  questionNumber: number;
  quizId: string;
  lessonId: string;
  setDone: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [response, setResponse, saveResponse] = useResponse<
    QuestionResponse,
    Question
  >({
    type: "Question",
    activity: question,
    initialFields: {
      quiz_id: quizId,
      lesson_id: lessonId,
      response_data: { selected: [] },
      attempts_left: question.attempts || 3,
    },
    nonRootActivity: true,
  });

  // question configuration
  const isMultipleSelect = question.question_type === "multiple_select";
  const correctAnswers = question.choices.options.filter(
    (option) => option.is_correct,
  );
  const selectedAnswers = response.response_data?.selected || [];

  // question state
  const isDisabled = response.attempts_left <= 0;
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
    setResponse((prevResponse) => {
      // new selection state
      const newSelected = isMultipleSelect
        ? toggleArrayItem(prevResponse.response_data?.selected || [], choiceId)
        : [choiceId];

      // attempts left
      const newAttemptsLeft = isMultipleSelect
        ? isAnswered
          ? prevResponse.attempts_left - 1
          : prevResponse.attempts_left
        : prevResponse.attempts_left - 1;

      return {
        ...prevResponse,
        attempts_left: newAttemptsLeft,
        response_data: { selected: newSelected },
      };
    });
  };

  /**
   * Handles final submission of the answer
   */
  const handleSubmit = () => {
    setResponse((prevResponse) => ({
      ...prevResponse,
      partial_response: false,
      attempts_left: 0,
    }));
    setDone(true);
    saveResponse();
  };

  // submit on correct answer
  useEffect(() => {
    if (isCorrect && !isDisabled && selectedAnswers.length > 0) {
      handleSubmit();
    }
  }, [isCorrect, isDisabled, selectedAnswers]);

  return (
    <div className="flex flex-col items-center gap-7">
      {/* Question Image and Caption */}
      <div className="flex flex-col gap-2">
        {question.image ? (
          <img
            src={question.image}
            alt={question.caption || "Question image"}
          />
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
        {isAnswered && (
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

      {/* Submit Button and Attempts Counter */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isDisabled || selectedAnswers.length === 0}
          className={`bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-md px-6`}
        >
          Submit Answer
        </button>

        <p className="text-sm text-gray-600">
          Attempts left: {response.attempts_left}
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

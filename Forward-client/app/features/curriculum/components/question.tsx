import MarkdownTTS from "../../../components/ui/markdown-tts";
import type { Question, QuestionResponse } from "@/features/curriculum/types";
import { useEffect, useState } from "react";

export default function Question({
  question,
  questionNumber,
  answer,
  onAnswerChange,
  onCheckAnswer,
  disabled,
}: {
  question: Question;
  questionNumber: number;
  answer: QuestionResponse | null;
  onAnswerChange: (
    questionId: string,
    answerData: { selected: number[] },
  ) => void;
  onCheckAnswer: (questionId: string) => void;
  disabled: boolean;
}) {
  // question configuration
  const [isChecked, setIsChecked] = useState(false);
  const isMultipleSelect = question.question_type === "multiple_select";
  const correctAnswers = question.choices.options?.filter(
    (option) => option.is_correct,
  );
  const selectedAnswers = answer?.response_data?.selected || [];
  // question state
  const isDisabled = disabled || (answer?.attempts_left ?? 3) <= 0;
  const isAnswered =
    selectedAnswers.length >= (isMultipleSelect ? correctAnswers.length : 1);
  // Check if the answer is correct
  const isCorrect = !question.has_correct_answer || isMultipleSelect
    ? areArraysEqual(
        selectedAnswers.slice().sort(),
        correctAnswers?.map((c) => c.id).sort(),
      )
    : correctAnswers?.map((c) => c.id).includes(selectedAnswers[0]);
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
    <div className="bg-foreground border-muted mx-auto max-w-3xl rounded-lg border p-4 shadow-sm mb-4">
      <div className="space-y-4">
        {question.caption && (
          <p className="text-muted-foreground text-sm italic">
            {question.caption}
          </p>
        )}

        {/* Question Text and Options */}
        <div className="space-y-3">
          <div className="space-y-3">
            <MarkdownTTS className="text-base leading-relaxed font-medium" controlsClassName="flex gap-2">
              {questionNumber + 1}. {question.question_text}
            </MarkdownTTS>

            <div className="space-y-2">
              {question.choices.options?.map((option) => (
                <label
                  key={option.id}
                  htmlFor={`question-${questionNumber}:option-${option.id}`}
                  className={`flex cursor-pointer gap-3 rounded-md border-2 p-3 transition-all items-center ${
                    selectedAnswers.includes(option.id)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50 bg-foreground"
                  } ${isDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <input
                    type={isMultipleSelect ? "checkbox" : "radio"}
                    checked={selectedAnswers.includes(option.id)}
                    disabled={isDisabled}
                    onChange={() => {handleOptionChange(option.id), setIsChecked(false)}}
                    id={`question-${questionNumber}:option-${option.id}`}
                    name={`question-${questionNumber}`}
                    className="accent-primary mt-0.5"
                  />
                  <MarkdownTTS
                    className="flex grow"
                    controlsClassName="flex flex-row-reverse grow justify-between items-center"
                    controlsOrientation="horizontal"
                  >
                    {/* This adds a pause between reading the options */}
                    <span className="text-[0px] opacity-0">.</span>
                    {option.text}
                  </MarkdownTTS>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback area */}
        {(isDisabled || (isAnswered && isChecked)) && (
          <div
            className={`rounded-md p-3 text-sm ${
              isCorrect
                ? "bg-green-300/10 border-green-600 border"
                : "bg-error/10 border-error border"
            }`}
          >
            {isCorrect ? (
              <>
                <span className="text-green-600 font-semibold">Correct!</span>{" "}
                {question.feedback_config.correct}
              </>
            ) : (
              <>
                <span className="text-error font-semibold">Not quite!</span>{" "}
                {question.feedback_config.incorrect}
              </>
            )}
          </div>
        )}
      </div>

      <div className="border-muted mt-4 flex items-center justify-between border-t pt-3">
        <button
          onClick={() => {onCheckAnswer(question.id), setIsChecked(true)}}
          disabled={isDisabled || selectedAnswers.length === 0}
          className="bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-md px-6 py-2 font-medium transition-all hover:brightness-110 active:brightness-90"
        >
          Check Answer
        </button>
        <p className="text-muted-foreground text-sm">
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

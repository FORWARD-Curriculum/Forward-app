import MarkdownTTS from "../../../components/ui/markdown-tts";
import type { Question, QuestionResponse } from "@/features/curriculum/types";
import { useEffect } from "react";

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
    <div className="bg-foreground rounded-lg p-4 shadow-sm border border-muted max-w-3xl mx-auto">
      <div className="space-y-4">
        {question.caption && (
          <p className="text-sm text-muted-foreground italic">
            {question.caption}
          </p>
        )}

        {/* Question Text and Options */}
        <div className="space-y-3">
          <div className="space-y-3">
            <MarkdownTTS className="text-base font-medium leading-relaxed">
              {questionNumber + 1}. {question.question_text}
            </MarkdownTTS>
            
            <div className="space-y-2">
              {question.choices.options.map((option) => (
                <label
                  key={option.id}
                  htmlFor={`question-${questionNumber}:option-${option.id}`}
                  className={`flex items-start gap-3 p-3 rounded-md border-2 transition-all cursor-pointer ${
                    selectedAnswers.includes(option.id)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50 bg-foreground"
                  } ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <input
                    type={isMultipleSelect ? "checkbox" : "radio"}
                    checked={selectedAnswers.includes(option.id)}
                    disabled={isDisabled}
                    onChange={() => handleOptionChange(option.id)}
                    id={`question-${questionNumber}:option-${option.id}`}
                    name={`question-${questionNumber}`}
                    className="mt-0.5 accent-primary"
                  />
                  <MarkdownTTS className="flex-1 text-base">
                    {/* This adds a pause between reading the options */}
                    .
                    {option.text}
                  </MarkdownTTS>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback area */}
        {isDisabled && isAnswered && (
          <div
            className={`rounded-md p-3 text-sm ${
              isCorrect
                ? "bg-accent/10 border border-accent"
                : "bg-error/10 border border-error"
            }`}
          >
            {isCorrect ? (
              <>
                <span className="font-semibold text-accent">Correct!</span>{" "}
                {question.feedback_config.correct}
              </>
            ) : (
              <>
                <span className="font-semibold text-error">Not quite!</span>{" "}
                {question.feedback_config.incorrect}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-muted">
        <button
          onClick={() => onCheckAnswer(question.id)}
          disabled={isDisabled || selectedAnswers.length === 0}
          className="bg-primary disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-md px-6 py-2 font-medium transition-all hover:brightness-110 active:brightness-90"
        >
          Check Answer
        </button>
        <p className="text-sm text-muted-foreground">
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
import type {
  Quiz,
  Question as QuestionType,
  QuizResponse,
  QuestionResponse,
} from "@/features/curriculum/types";
import { useLocation } from "react-router";
import { useState } from "react";
import { useResponse } from "@/features/curriculum/hooks";
import Question from "./question";

export default function Quiz({ quiz }: { quiz: Quiz }) {
  const { hash } = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(
    parseInt(hash.substring(1).split("/").at(1) || "1"),
  );

  const [response, setResponse, saveResponse] = useResponse<QuizResponse, Quiz>({
    type: "Quiz",
    activity: quiz,
    trackTime: false,
    initialFields: { 
      score: null, 
      completion_percentage: 0,
      submission: []
    },
  });

  // Helper function to update or add an answer in the submission array
  const updateOrAddAnswer = (
    submission: QuestionResponse[],
    questionId: string,
    answerData: { selected: number[] }
  ): QuestionResponse[] => {
    const existingIndex = submission.findIndex(
      (item) => item.associated_activity === questionId
    );

    if (existingIndex >= 0) {
      // Update existing answer
      return submission.map((item, index) =>
        index === existingIndex
          ? { ...item, response_data: answerData }
          : item
      );
    } else {
      // Add new answer
      return [
        ...submission,
        {
          id: null,
          associated_activity: questionId,
          response_data: answerData,
          quiz_id: quiz.id,
          lesson_id: quiz.lesson_id,
          partial_response: true,
          time_spent: 0,
          // attempts_left: 3,
        } as QuestionResponse,
      ];
    }
  };

  // Get answer for a specific question from submission
  const getAnswerForQuestion = (questionId: string) => {
    return response.submission.find(
      (item) => item.associated_activity === questionId
    ) || null;
  };

  // Update submission when user answers
  const handleAnswerChange = (questionId: string, answerData: { selected: number[] }) => {
    setResponse((prev) => ({
      ...prev,
      submission: updateOrAddAnswer(prev.submission, questionId, answerData),
    }));
  };

  // Handle "Check Answer" button click
  const handleCheckAnswer = async (questionId: string) => {

      const questionToCheck = response.submission.find(
        (item) => item.associated_activity === questionId
      );
      
    
      if (questionToCheck) {
        // Only send THIS question's data
        await saveResponse({ 
          submission: [questionToCheck] 
        } as Partial<QuizResponse>);
      }
    
  };

  return (
    <div>
      <div className="flex lg:flex-row flex-col justify-between">
      <p className="mb-4 text-sm text-muted-foreground italic">
        Note: Any checked answers will be automatically submitted when you leave this quiz.
      </p>
      
      <div className="mb-4 text-sm text-muted-foreground">
        Progress: {response.completion_percentage.toFixed(0)}% complete
      </div></div>

      {response.score !== null && (
        <div className="mb-4 text-sm font-medium">
          Score: {response.score} / {quiz.questions.length}
        </div>
      )}
      
      
      {quiz.questions.map((question: QuestionType, questionNumber) => {
        if (currentQuestion - 1 === questionNumber)
          return (
            <Question
              key={questionNumber}
              question={question}
              questionNumber={questionNumber}
              answer={getAnswerForQuestion(question.id)}
              onAnswerChange={handleAnswerChange}
              onCheckAnswer={handleCheckAnswer}
              disabled={!response.partial_response}
            />
          );
      })}

      {/* Navigation buttons */}
      <div className="mx-auto flex w-full justify-center">
        <div className="grid grid-cols-3 items-center justify-center">
          {currentQuestion != 1 && (
            <button
              className="bg-primary text-primary-foreground col-span-1 col-start-1 col-end-1 flex h-full w-16 items-center justify-center rounded-md text-center active:brightness-90"
              onClick={() => {
                history.replaceState(
                  null,
                  "",
                  `#${quiz.order}/${currentQuestion - 1}`,
                );
                setCurrentQuestion(currentQuestion - 1);
              }}
            >
              Prev
            </button>
          )}
          <p className="col-start-2 col-end-2 w-full rounded-full p-3 text-center">
            {currentQuestion}
          </p>
          {currentQuestion != quiz.questions.length && (
            <button
              className="bg-primary text-primary-foreground col-span-1 col-start-3 col-end-3 flex h-full w-16 items-center justify-center rounded-md text-center active:brightness-90"
              onClick={() => {
                history.replaceState(
                  null,
                  "",
                  `#${quiz.order}/${currentQuestion + 1}`,
                );
                setCurrentQuestion(currentQuestion + 1);
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
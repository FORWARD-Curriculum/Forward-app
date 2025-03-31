import type {
  Quiz,
  Question as QuestionType,
  QuizResponse,
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

  const [response, setResponse] = useResponse<QuizResponse, Quiz>(
    "Quiz",
    quiz,
    false,
    { highestQuestionReached: 0, score: 0, isComplete: false },
  );

  return (
    <div>
      <p>Time spent: {response.timeSpent}</p>
      <p className="mb-4 text-sm font-light">{quiz.instructions}</p>
      {quiz.questions.map((question: QuestionType, questionNumber) => {
        if (currentQuestion - 1 === questionNumber)
          return (
            <Question key={questionNumber} question={question} questionNumber={questionNumber} quizId={quiz.id} />
          );
      })}
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
                if (response.highestQuestionReached < currentQuestion + 1)
                  setResponse({
                    ...response,
                    highestQuestionReached: currentQuestion + 1,
                  });
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

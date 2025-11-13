import type {
  Quiz,
  Question as QuestionType,
  QuizResponse,
  QuestionResponse,
} from "@/features/curriculum/types";
import { useLocation } from "react-router";
import { useCallback, useState } from "react";
import { useResponse } from "@/features/curriculum/hooks";
import Question from "./question";
import { Circle } from "lucide-react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store";
import { saveCurrentResponseThunk } from "../slices/userLessonDataSlice";
import { toast } from "sonner";

export default function Quiz({ quiz }: { quiz: Quiz }) {
  const { hash } = useLocation();
  const dispatch = useDispatch<AppDispatch>()
  const [currentQuestion, setCurrentQuestion] = useState(
    parseInt(hash.substring(1).split("/").at(1) || "1"),
  );

  const [response, setResponse] = useResponse<QuizResponse, Quiz>({
    type: "Quiz",
    activity: quiz,
    trackTime: false,
    disableAutoSave: true,
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
  const handleCheckAnswer = useCallback(
    async (questionId: string) => {
      const questionToCheck = response.submission.find(
        (item) => item.associated_activity === questionId,
      );

      if (questionToCheck) {
        // Only send THIS question's data
        await dispatch(
          saveCurrentResponseThunk({
            submission: [questionToCheck],
          } as Partial<QuizResponse>),
        )
          .unwrap()
          .then((originalPromiseResult) => {
            const savePayload = originalPromiseResult?.payload;
            if (!savePayload) throw new Error();

            // We must update the 'local' (redux/global) current_response with the
            // response from the server, as we are not navingating away so we want to
            // rerender with the new responded info (checked correct/not)
            setResponse((savePayload as any).response as QuizResponse);
          })
          .catch((rejectedValueOrSerializedError) => {
            toast.error("Something went wrong saving that question.");
          });
      }
    },
    [response, dispatch],
  );


  //Used to display different statuses in the bottom circles as they navigate questions
  const getQuestionStatus = (questionId: string) => {
    const answer = getAnswerForQuestion(questionId);
    
    if (!answer) {
      return 'unanswered'; // White - no attempt yet
    }
    
    if (answer.is_correct === true) {
      return 'correct'; // Green - correct answer
    }
    
    // if (answer.attempts_left === 0 && answer.is_correct === false) {
    //   return 'exhausted'; // Red - all attempts used, still wrong
    // }
    
    if (answer.is_correct === false) {
      return 'attempted'; // Grey - attempted but not correct yet
    }
    
    return 'unanswered'; // Grey - fallback
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

      {/* Quiz-level image */}
      {quiz.image && (
        <div className="mb-6">
          <img 
            src={quiz.image} 
            alt={quiz.title} 
            className="w-full max-w-lg mx-auto rounded-lg shadow-sm border border-muted object-cover"
            style={{ maxHeight: '300px' }}  
          />
        </div>
      )}

      {/* Quiz level videos */}
      {quiz.video && (
        <div className="mb-6">
          <video 
            controls 
            className="w-full max-w-lg mx-auto rounded-lg shadow-sm border border-muted object-cover"
            style={{ maxHeight: '400px' }}
          >
            <source src={quiz.video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
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
              disabled={!response.partial_response} // We might not need this prop anymore
            />
          );
      })}

      {/* Navigation buttons */}
      <div className="mx-auto flex w-full justify-center">
        <div className="grid grid-cols-3 items-center justify-center gap-4">
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
          
          {/* Circle navigation */}
          <div className="col-start-2 col-end-2 flex gap-2 items-center justify-center">
            {Array.from({ length: quiz.questions.length }, (_, index) => (
              <button
                key={index}
                onClick={() => {
                  history.replaceState(
                    null,
                    "",
                    `#${quiz.order}/${index + 1}`,
                  );
                  setCurrentQuestion(index + 1);
                }}
                className="cursor-pointer"
                aria-label={`Go to question ${index + 1}`}
              >
                <Circle
                  fill={
                    (() => {
                      const status = getQuestionStatus(quiz.questions[index].id);
                      //TODO add green into our tailwind
                      if (status === 'correct') return '#00a63e'; //equivalent to tailwind green-600
                      // if (status === 'exhausted') return 'var(--error)'; 
                      if (status === 'attempted') return 'var(--muted-foreground)'; 
                      return 'var(--color-white)'; 
                    })()
                  }
                  // stroke={index + 1 === currentQuestion ? 'var(--muted-foreground)' : undefined}
                  stroke="var(--muted-foreground)" 
                  strokeWidth={index + 1 === currentQuestion ? 2 : 1}
                  size={16}
                />
              </button>
            ))}
          </div>
          
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
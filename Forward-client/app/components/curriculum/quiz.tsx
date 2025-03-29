import type { Quiz, Question, QuestionResponse } from "@/lib/redux/lessonSlice";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useLocation } from "react-router";
import { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { useDispatch, useSelector } from "react-redux";
import { resetTimeSpent, saveUserResponseThunk } from "@/lib/redux/userLessonDataSlice";
import type { AppDispatch, RootState } from "@/store";

export default function Quiz({ quiz }: { quiz: Quiz }) {
  const { hash } = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const userResponseData = useSelector((state: RootState) => state.response);
  const [currentQuestion, setCurrentQuestion] = useState(
    parseInt(hash.substring(1).split("/").at(1) || "1"),
  );

  return (
    <div>
      <p className="mb-4 text-sm font-light">{quiz.instructions}</p>
      {quiz.questions.map((question: Question, questionNumber) => {
        if (currentQuestion - 1 === questionNumber)
          return (
            <div className="flex flex-col items-center gap-7">
              <div className="flex flex-col gap-2">
                {question.image ? (
                  <img src={question.image} />
                ) : (
                  <Skeleton className="size-70" />
                )}
                {question.caption ? (
                  <p>{question.caption}</p>
                ) : (
                  <Skeleton className="h-[var(--txt-base)] w-70" />
                )}
              </div>
              <MarkdownTTS
                className="flex flex-col items-center"
                controlsClassName="flex gap-2"
                controlsOrientation="vertical"
                key={questionNumber}
              >
                <fieldset>
                  <legend>
                    {questionNumber + 1}. {question.questionText}
                  </legend>

                  {question.choices.options.map((option, choiceNumber) => {
                    return (
                      <div className="flex pl-6" key={choiceNumber}>
                        <input
                          className="bg-primary"
                          type={
                            question.questionType == "multiple_select"
                              ? "checkbox"
                              : "radio"
                          }
                          onClick={() =>
                            dispatch(
                              saveUserResponseThunk({
                                type: "Quiz",
                                order: quiz.order,
                                response: {
                                  id: question.id,
                                  associatedId: quiz.id,
                                  attempts: 1,
                                  choices: [option.id],
                                } as QuestionResponse,
                              }),
                            )
                          }
                          id={`question-${questionNumber}:option-${choiceNumber}`}
                          name={`question-${questionNumber}`}
                        />
                        <label
                          className="ml-2"
                          htmlFor={
                            "question-" +
                            questionNumber +
                            ":option-" +
                            choiceNumber
                          }
                        >
                          {/*This adds a pause between reading the options*/}
                          <span className="text-[0px] opacity-0">.</span>
                          {option.text}
                        </label>
                      </div>
                    );
                  })}
                </fieldset>
              </MarkdownTTS>
              {(userResponseData.responseData?.quizzes.findIndex(
                (q) => q.order === quiz.order,
              ) || -1) >= 0 && <>
              
              </>}
            </div>
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
                dispatch(resetTimeSpent())
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
                dispatch(resetTimeSpent())
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

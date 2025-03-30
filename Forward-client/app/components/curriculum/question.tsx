import type { Question, QuestionResponse } from "@/lib/redux/lessonSlice";
import { useResponse } from "@/lib/redux/userLessonDataSlice";
import { Skeleton } from "../ui/skeleton";
import MarkdownTTS from "../ui/markdown-tts";
import { useEffect } from "react";

export default function Question({
  question,
  questionNumber,
}: {
  question: Question;
  questionNumber: number;
}) {
  const [response, setResponse] = useResponse<QuestionResponse, Question>(
    "Question",
    question,
    true,
  );

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
                  disabled={response.attemptsLeft <= 0}
                  onChange={() => {
                    setResponse((prevResp) => ({
                      ...prevResp,
                      attemptsLeft: prevResp.attemptsLeft - 1,
                      choices: [choiceNumber],
                    }));
                  }}
                  id={`question-${questionNumber}:option-${choiceNumber}`}
                  name={`question-${questionNumber}`}
                />
                <label
                  className="ml-2"
                  htmlFor={
                    "question-" + questionNumber + ":option-" + choiceNumber
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
      <p>Attempts left: {response.attemptsLeft} | Time spent: {response.timeSpent}</p>
    </div>
  );
}

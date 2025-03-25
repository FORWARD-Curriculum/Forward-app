import type { Quiz, Question } from "@/lib/lessonSlice";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { Link, useLocation } from "react-router";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useEffect, useState } from "react";

export default function Quiz({ quiz }: { quiz: Quiz }) {
  const { hash } = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(parseInt(hash.substring(1).split("/").at(1) || "1"));

  return (
    <div>
      <p className="mb-4 text-sm font-light">{quiz.instructions}</p>
        {quiz.questions.map((question: Question, questionNumber) => {
          if ((currentQuestion-1)===questionNumber) return (
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
          );
        })}
      <Pagination>
        <PaginationContent className="-top-full">
          {currentQuestion != 1 && (
            <Link to={`#${quiz.order}/${currentQuestion - 1}`} onClick={()=>setCurrentQuestion(currentQuestion-1)}>
              Prev
            </Link>
          )}
          <PaginationItem>
            {currentQuestion}
          </PaginationItem>
          {currentQuestion != quiz.questions.length && (
            <PaginationItem>
              <Link to={`#${quiz.order}/${currentQuestion + 1}`} onClick={()=>setCurrentQuestion(currentQuestion+1)}>
                Next
              </Link>
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}

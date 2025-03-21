import type { Quiz, Question } from "@/lib/lessonSlice";
import MarkdownTTS from "@/components/ui/markdown-tts";

export default function Quiz({ quiz }: { quiz: Quiz }) {
  return (
    <div>
      <p className="text-sm font-light mb-4">{quiz.instructions}</p>
      <ul className="flex flex-col gap-4">
        {quiz.questions.map((question: Question, questionNumber) => {
          return (
            <li className="pl-4">
              <MarkdownTTS className="flex gap-2" controlsOrientation="vertical">
              <fieldset>
                <legend>{questionNumber+1}. {question.questionText}</legend>
              
              {question.choices.options.map((option, choiceNumber) => {
                return (
                  <div className="pl-6 flex">
                    <input
                    className=" bg-primary"
                    type={question.questionType == "multiple_select"?"checkbox":"radio"}
                    id={`question-${questionNumber}:option-${choiceNumber}`}
                    name={`question-${questionNumber}`} />
                    <label className="ml-2" htmlFor={"question-"+questionNumber+":option-"+choiceNumber}>
                      {/*This adds a pause between reading the options*/}
                      <span className="opacity-0 text-[0px]">.</span>
                      {option.text}</label>
                  </div>
                );
              })}
              </fieldset>
              </MarkdownTTS>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

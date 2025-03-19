import type { Quiz, Question } from "@/lib/lessonSlice";

export default function Quiz({ quiz }: { quiz: Quiz }) {
  return (
    <div>
      <p className="text-sm font-light mb-4">{quiz.instructions}</p>
      <ul className="flex flex-col gap-4">
        {quiz.questions.map((question: Question, questionNumber) => {
          return (
            <li className="pl-4">
              <fieldset>
                <legend>{questionNumber+1}.) {question.questionText}</legend>
              
              {question.choices.options.map((option, choiceNumber) => {
                return (
                  <div className="pl-6 flex">
                    <input
                    className=" bg-primary"
                    type={question.questionType === "multiple_select"?"checkbox":"radio"}
                    id={`question-${questionNumber}:option-${choiceNumber}`}
                    name={`question-${questionNumber}`} />
                    <label className="ml-2" htmlFor={"question-"+questionNumber+":option-"+choiceNumber}>{option.text}</label>
                  </div>
                );
              })}
              </fieldset>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

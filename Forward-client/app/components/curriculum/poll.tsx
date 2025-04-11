import type { Poll, PollQuestion, PollQuestionResponse } from "@/lib/redux/lessonSlice";
import { saveUserResponseThunk } from "@/lib/redux/userLessonDataSlice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";


export default function Writing({ poll }: { poll: Poll }) {
  const dispatch = useDispatch<AppDispatch>();
  const lessonId = useSelector((state: RootState) => state.response.lessonId);

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    optionText: string, // added optionText
  ) => {
    const question = poll.questions[questionIndex];
    if (!lessonId) return;

    const response: PollQuestionResponse = {
      id: question.id, // Use question.id
      associatedId: poll.id,
      partialResponse: null,
      attempts: null,
      answer: optionText,
      timeSpent: 0,
      order: poll.order,
    };

    dispatch(
      saveUserResponseThunk({
        type: "Poll",
        response,
        order: response.order,
      }),
    )
  };

  return (
    <div>
      <p>{poll.instructions}</p>
      <ul>
        {poll.questions.map((question: PollQuestion, index: number) => {
          return (
            <div key={index}>
              <li>{question.questionText}</li>
              <form>
                {question.options.map((option, optionIndex) => {
                  const optionId = `question-${index}-option-${optionIndex}`;
                  return (
                    <div key={optionIndex}>
                      <input
                        type="radio"
                        id={optionId}
                        name={`question-${index}`}
                        value={option.text}
                        onChange={() =>
                          handleOptionChange(index, optionIndex, option.text)
                        }
                      />
                      <label htmlFor={optionId}>{option.text}</label>
                    </div>
                  );
                })}
              </form>
            </div>
          );
        })}
      </ul>
    </div>
  );
}

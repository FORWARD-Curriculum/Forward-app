import type { Poll, PollQuestion, PollQuestionResponse } from "../types/index";
import { saveUserResponseThunk } from "@/features/curriculum/slices/userLessonDataSlice";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store";


export default function Writing({ poll }: { poll: Poll }) {
  const dispatch = useDispatch<AppDispatch>();
  const lessonId = useSelector((state: RootState) => state.response.lesson_id);

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    optionText: string, // added optionText
  ) => {
    const question = poll.questions[questionIndex];
    if (!lessonId) return;

    const response: PollQuestionResponse = {
      id: question.id, // Use question.id
      associated_activity: poll.id,
      partial_response: false,
      time_spent: 0,
      attempts_left: 0,
      response_data: [],
    };

    dispatch(
      saveUserResponseThunk({
        type: "Poll",
        response,
        trackTime: true,
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
              <li>{question.question_text}</li>
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

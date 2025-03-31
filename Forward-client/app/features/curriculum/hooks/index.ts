import {
  type BaseActivity,
  type BaseResponse,
  type LessonResponse,
  type PollQuestion,
  type Question,
  type TextContent,
} from "@/features/curriculum/types";
import type { AppDispatch, RootState } from "@/store";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { saveUserResponseThunk } from "@/features/curriculum/slices/userLessonDataSlice";

/**
 * Returns a the outut of a `useState<T>()` to be used on for reactive, managed response
 * state. Automatically saves the response data to the Redux Store/Backend when the component
 * is unmounted, or when `saveResponse()` is called.
 *
 * @param type - Type of the activity to know what reponse goes where.
 * @param activity - The activity object to retrieve id from.
 * @param trackTime - Used in Higher Order Activites (Quiz, Poll) to indicate that time
 * should not be tracked as a whole, but instead is the aggregate of the children's times.
 * This is important to ensure that the unmounting of the parent, which if true calls the
 * `resetTimeSpent()`, and thus tracked time would be inacurate for children.
 * @param initialFields - Due to the nature of generics, the only fields we can guarantee on
 * an initialize are those from the LCD response type {@link BaseResponse}, and so to not have
 * undefined fields can populate them on creation.
 * @returns `[response, setResponse, saveResponse] as const`
 *
 * @example
 * ```typescript
 *  const [response, setResponse, saveResponse] = useResponse<QuestionResponse, Question>("Quiz", quiz, false, { highestQuestionReached: 0 });
 *  //...
 *    onClick={()=>setResponse({...response, highestQuestionReached: response.highestQuestionReached + 1})};
 *  //...
 * ```
 */
export const useResponse = <
  T extends BaseResponse,
  E extends BaseActivity | Question | PollQuestion | TextContent,
>(
  type: keyof NonNullable<LessonResponse["responseData"]>,
  activity: E,
  trackTime: boolean,
  initialFields?: Omit<T, keyof BaseResponse> &
    Partial<Pick<T, keyof BaseResponse>>,
) => {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((state: RootState) =>
    state.response.responseData[type].find(
      (s) => s.associatedActivity === activity.id,
    ),
  );

  // Create state as before
  const [response, setResponse] = useState<T>(
    state
      ? (state as T)
      : ({
          ...({
            id: null,
            associatedActivity: activity.id,
            timeSpent: 0,
            attemptsLeft: 0,
            partialResponse: true,
          } satisfies BaseResponse),
          ...(initialFields as Partial<T>),
        } as T),
  );

  // Add a ref to track the latest response
  const responseRef = useRef<T>(response);

  // Update the ref whenever response changes
  useEffect(() => {
    responseRef.current = response;
  }, [response]);

  // Save response to store/server on unmount
  useEffect(() => {
    return () => {
      void saveResponse();
    };
  }, []);

  /**
   * Dispatch to `saveUserResponseThunk` to save the current response state.
   */
  const saveResponse = async () => {
    const saved = await dispatch(
      saveUserResponseThunk({
        type,
        response: responseRef.current,
        trackTime,
      }),
    );
    if (saved.meta.requestStatus === "fulfilled")
      setResponse((saved.payload as { response: BaseResponse }).response as T);
  };

  return [response, setResponse, saveResponse] as const;
};

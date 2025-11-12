import {
  type BaseActivity,
  type BaseResponse,
  type LessonResponse,
  type PollQuestion,
  type Question,
} from "@/features/curriculum/types";
import type { AppDispatch, RootState } from "@/store";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  saveUserResponseThunk,
  setCurrentContext,
  setCurrentResponse,
} from "@/features/curriculum/slices/userLessonDataSlice";

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
 * @param nonRootActivity - Used to indicate that this is a non-root activity, and thus, should not
 * be saved as the "current" response, which is used to lock progress on the lesson.
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
  E extends BaseActivity | Question | PollQuestion,
>({
  type,
  activity,
  trackTime=true,
  initialFields,
  nonRootActivity=false,
  disableAutoSave = false
}: {
  type: keyof NonNullable<LessonResponse["response_data"]>;
  activity: E;
  trackTime?: boolean;
  initialFields?: Omit<T, keyof BaseResponse> &
    Partial<Pick<T, keyof BaseResponse>>;
  nonRootActivity?: boolean;
  disableAutoSave?: boolean;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((state: RootState) =>
    state.response.response_data[type]
      ? state.response.response_data[type].find(
          (s) => s.associated_activity === activity.id,
        )
      : null,
  );

  // Create state as before
  const [response, setResponse] = useState<T>(
    state
      ? (state as T)
      : ({
          ...({
            id: null,
            associated_activity: activity.id,
            time_spent: 0,
            attempts_left: 0,
            partial_response: true,
          } satisfies BaseResponse),
          ...(initialFields as Partial<T>),
        } as T),
  );

  // Add a ref to track the latest response
  const responseRef = useRef<T>(response);

  // Update the ref whenever response changes
  useEffect(() => {
    responseRef.current = response;
    // TODO: Replace the above ref completely with the currentResponse state from
    // the store, and pull it in the thunk.
    if (!nonRootActivity) {
      dispatch(setCurrentResponse(response)),
      dispatch(setCurrentContext({ type, trackTime }));
    };
  }, [response]);

  // Save response to store/server on unmount
  // useEffect(() => {
  //   return () => {
  //     if (!disableAutoSave){
  //       void saveResponse();
  //     }
  //   };
  // }, []); // maybe add to dependency array

  /**
   * Dispatch to `saveUserResponseThunk` to save the current response state.
   * 
   * NOTE : The override currently exists for the quiz component which deal with many questions
   * This allows it to override and send a single question as a parameter to be evlauated by the backend 
   * Rather than the all the questions together. 
   */
  const saveResponse = useCallback(async (overrideResponse?: Partial<T>) => {
    const dataToSave = overrideResponse
      ? { ...responseRef.current, ...overrideResponse}
      : responseRef.current
    
    const saved = await dispatch(
      saveUserResponseThunk({
        type,
        response: dataToSave,
        trackTime,
      }),
    );
    if (saved.meta.requestStatus === "fulfilled" && saved.payload !== undefined)
      setResponse((saved.payload as { response: BaseResponse }).response as T);
  },[dispatch, trackTime, type]);

  return [response, setResponse, saveResponse] as const;
};

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
  saveCurrentResponseThunk,
  setCurrentContext,
  setCurrentResponse,
} from "@/features/curriculum/slices/userLessonDataSlice";

/**
 * Returns the outut of a `useState<T>()` to be used on for reactive, managed response
 * state. State will be saved to the backend when {@link saveCurrentResponseThunk} is called
 * from anywhere in the app
 *
 * @param activity - The activity object to retrieve id from.
 * @param trackTime - Used in Higher Order Activites (Quiz, Poll) to indicate that time
 * should not be tracked as a whole, but instead is the aggregate of the children's times.
 * This is important to ensure that the unmounting of the parent, which if true calls the
 * `resetTimeSpent()`, and thus tracked time would be inacurate for children.
 * @param initialFields - Due to the nature of generics, the only fields we can guarantee on
 * an initialize are those from the LCD response type {@link BaseResponse}, and so to not have
 * undefined fields can populate them on creation.
 * @returns `[response, setResponse] as const`
 *
 * @example
 * ```ts
 *  const [response, setResponse] = useResponse<QuizResponse, Quiz>({
 *    type: "Quiz",
 *    activity: quiz,
 *    trackTime: false,
 *    disableAutoSave: true,
 *    initialFields: { 
 *      score: null, 
 *      completion_percentage: 0,
 *      submission: []
 *    },
 *  });
 *  //...
 *  onClick={()=>setResponse(
 *    {
 *      ...response,
 *      partial_response: !partial_response ?
 *        false
 *        : allQuestionsAnswered})
 *  };
 *  //...
 * ```
 */
export const useResponse = <
  T extends BaseResponse,
  E extends BaseActivity,
>({
  activity,
  trackTime = true,
  initialFields
}: {
  activity: E;
  trackTime?: boolean;
  initialFields?: Omit<T, keyof BaseResponse> &
    Partial<Pick<T, keyof BaseResponse>>;
}) => {
  const dispatch = useDispatch<AppDispatch>();

  let existingResponse = useSelector((state: RootState) =>
    state.response.response_data[activity.type]
      ? state.response.response_data[activity.type].find(
          (s) => s.associated_activity === activity.id,
        )
      : null,
  );

  // Synchronously instantiate current_response, overwriting old/stale resp
  const isInitialized = useRef(false);

  if (!isInitialized.current) {
    const initialResponse = existingResponse
      ? (existingResponse as T)
      : ({
          ...({
            id: null,
            associated_activity: activity.id,
            time_spent: 0,
            attempts_left: 0,
            partial_response: true,
          } satisfies BaseResponse),
          ...(initialFields as Partial<T>),
        } as T);

    /* NOTE: this is only here because I want to give the option
     * to disable trackTime if, for some reason it is needed. If,
     * there comes a time where we don't need to disable it for sure
     * we could remove it.
     */
    dispatch(setCurrentContext({ type: activity.type, trackTime }));
    dispatch(setCurrentResponse(initialResponse));

    isInitialized.current = true;
  }

  const response = useSelector(
    (state: RootState) => state.response.current_response as T,
  );

  // Exposes a setState like function, which actually updates the store
  const setResponse: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (v) => {
      const next =
        typeof v === "function" ? (v as (prev: T) => T)(response) : (v as T);
      dispatch(setCurrentResponse(next));
    },
    [response],
  );

  return [response, setResponse] as const;
};

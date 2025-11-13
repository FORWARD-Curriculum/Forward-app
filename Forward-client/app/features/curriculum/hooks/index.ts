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
import store from "@/store";

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
  E extends BaseActivity,
>({
  type,
  activity,
  trackTime = true,
  initialFields
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

  let existingResponse = useSelector((state: RootState) =>
    state.response.response_data[type]
      ? state.response.response_data[type].find(
          (s) => s.associated_activity === activity.id,
        )
      : null,
  );

  // Synchronously instantiate current_response, removing old/stale resp
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

    dispatch(setCurrentContext({ type, trackTime }));
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

import {
  type BaseActivity,
  type BaseResponse,
} from "@/features/curriculum/types";
import type { AppDispatch, RootState } from "@/store";
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  saveCurrentResponseThunk,
  setCurrentContext,
  setCurrentResponse,
} from "@/features/curriculum/slices/userLessonDataSlice";
import store from "@/store";

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

  const existingResponse = useSelector((state: RootState) =>
    state.response?.response_data?.[activity.type]?.find(
      (s) => s.associated_activity === activity.id,
    ) ?? null,
  );

  const currentResponseFromStore = useSelector(
    (state: RootState) => state.response?.current_response as T | null,
  );

  //Synchronously prepare an initial response object as a fallback
  const initialResponse = useMemo(() => (
    existingResponse
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
        } as T)
  ), [existingResponse, activity.id, initialFields]);


  // only should run on first render/activity change
  useEffect(() => {
    // Dispatch only if the response in the store is stale or not set for this activity
    if (currentResponseFromStore?.associated_activity !== activity.id) {
        dispatch(
          setCurrentContext({
            type: activity.type,
            trackTime,
            current_response_saved: store.getState().user.user === null ? true :
              store.getState().response.current_context?.current_response_saved ??
              true,
          }),
        );
        dispatch(setCurrentResponse(initialResponse));
    }
  }, [activity.id, activity.type, dispatch, trackTime, initialResponse, currentResponseFromStore]);


  // On the first render, it will be `initialResponse`. On all renders after, it will be from the store.
  const response = currentResponseFromStore?.associated_activity === activity.id
    ? currentResponseFromStore
    : initialResponse;


  const setResponse: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (v) => {
      const latestResponse = store.getState().response.current_response as T;
      const next =
        typeof v === "function" ? (v as (prev: T) => T)(latestResponse) : (v as T);
      dispatch(setCurrentResponse(next));
      dispatch(
        setCurrentContext({
          type: activity.type,
          trackTime,
          current_response_saved: store.getState().user.user === null ? true : false,
        }),
      );
    },
    [dispatch, activity.type, trackTime],
  );

  return [response, setResponse] as const;
};
import type { RootState } from "@/store";
import type { Middleware } from "@reduxjs/toolkit";
import { addDispatch, addError } from "../slices/loggingSlice";

function changedTopLevel(prev: RootState, next: RootState): string[] {
  return Object.keys(next).filter((k) => (prev as any)[k] !== (next as any)[k]);
}

export const actionLogMiddleware: Middleware<{}, RootState> =
  (api) => (next) => (action: any) => {
    if (typeof action?.type !== "string") return next(action);
    if (action.type.startsWith("logging/")) return next(action);

    const started = Date.now();
    const prev = api.getState();
    try {
      const result = next(action);
      const nextState = api.getState();
      const duration = Date.now() - started;
      const changed = changedTopLevel(prev, nextState);

      const entry = {
        date: new Date(started).toISOString(),
        type: action.type,
        payload: action.payload,
        changed: changed,
        durationMs: duration,
      };

      api.dispatch(addDispatch(entry));
      return result;
    } catch (err) {
      const msg =
        (err instanceof Error ? err.stack || err.message : String(err)) +
        ` while handling ${action.type}`;
      api.dispatch(addError(msg));
      throw err;
    }
  };
import { addError } from "@/features/logging/slices/loggingSlice";
import store from "@/store";
import { clsx, type ClassValue } from "clsx";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";

export const API_PROGRESS_EVENT = "api-progress-update";

export type Image = {
  thumbnail: string;
  optimized: { [key: string]: number };
  original: string;
};

export function srcsetOf(image: Image) {
  let out: string[] = [];
  for (const [url, width] of Object.entries(image.optimized)) {
    out.push(`${url} ${width}w`);
  }
  return out.join(", ");
}

declare global {
  interface Window {
    apiProgress: {
      progress: number;
      loading: boolean;
    };
  }
}
if (typeof window !== "undefined") {
  window.apiProgress = window.apiProgress || {
    progress: 0,
    loading: false,
  };
}

export function updateApiProgress(isLoading: boolean, newProgress: number) {
  window.apiProgress.loading = isLoading;
  window.apiProgress.progress = newProgress;
  window.dispatchEvent(new CustomEvent(API_PROGRESS_EVENT));
}

/**
 * Concatenates tailwind classnames for use within components
 * @param {ClassValue[]} inputs
 * @returns {string}
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * A helper function that returns a cookie's value given a name
 * @param name
 * @returns a string containing the current cookie of said name
 */
export const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
};

/**
 * An api wrapper that centralizes API calls and
 * authenticates them with the CSRF token needed for authed requests.
 *
 * Use exatly like a normal fetch() function
 * @param url
 * @param options
 * @returns {Promise<Response>}
 */
export async function apiFetch(
  url: string,
  options: RequestInit & {
    headers?: Record<string, string>;
  } = {},
  disableLoader?: boolean,
): Promise<Response> {
  if (!disableLoader) updateApiProgress(true, 0);

  const headers = {
    ...options.headers,
    "X-CSRFToken": getCookie("csrftoken") || "",
  };

  if (disableLoader === true)
    return fetch(import.meta.env.VITE_BACKEND_URL + "/api" + url, {
      ...options,
      headers,
      credentials: "include",
    });

  const response = await fetch(
    import.meta.env.VITE_BACKEND_URL + "/api" + url,
    { ...options, headers, credentials: "include" },
  );

  if (!response.ok || !response.body) {
    updateApiProgress(false, 100);
    return response;
  }

  const contentLength = response.headers.get("Content-Length");
  if (!contentLength) {
    console.warn("Content-Length header not found. Cannot show progress.");
    return response;
  }

  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const stream = new ReadableStream({
    start(controller) {
      const reader = response.body!.getReader();

      function read() {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              updateApiProgress(false, 100);
              controller.close();
              return;
            }
            // Update progress
            loaded += value.length;
            const progress = Math.round((loaded / total) * 100);
            updateApiProgress(true, progress);

            controller.enqueue(value);
            read();
          })
          .catch((error) => {
            console.error("Error reading stream:", error);
            updateApiProgress(false, 100);
            controller.error(error);
          });
      }
      read();
    },
  });

  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/**
 * Update the document title with provided string
 * @param titleOrFn can be a String or a function.
 * @param deps? if provided, the title will be updated when one of these values changes
 */
export function useTitle(
  titleOrFn: string | (() => string),
  ...deps: React.DependencyList
): void {
  useEffect(() => {
    // console.log(titleOrFn);
    document.title = typeof titleOrFn === "function" ? titleOrFn() : titleOrFn;
  }, [...deps]);
}

function getCallerStack(skipLines = 2) {
  const err = new Error();
  const raw = err.stack || "";
  const lines = raw.split(/\r?\n/);
  return lines.slice(skipLines).join("\n");
}



declare global {
  interface String {
    trunc(n: number): string;
  }
}

String.prototype.trunc = 
      function(n){
          return this.substr(0,n-1)+(this.length>n?'...':'');
      };

const originalConsoleError = console.error.bind(console);

console.error = (...args: any[]) => {
  const stack = getCallerStack(2);
  originalConsoleError(...args);

  store.dispatch(
    addError(
      {
        args,
        stack,
        time: Date.now(),
      }
    )
  );
};
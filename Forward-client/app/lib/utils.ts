import { clsx, type ClassValue } from "clsx";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";

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
): Promise<Response> {
  const headers: Record<string, string> = {
    ...options.headers,
  };

  headers["X-CSRFToken"] = getCookie("csrftoken") || "";

  return fetch("http://127.0.0.1:8000/api" + url, {
    ...options,
    headers,
  credentials: 'include'
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
    console.log(titleOrFn);
    document.title = typeof titleOrFn === "function" ? titleOrFn() : titleOrFn;
  }, [...deps]);
}

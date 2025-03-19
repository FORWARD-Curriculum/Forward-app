import { clsx, type ClassValue } from "clsx";
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
  const headers = {
    ...options.headers,
    "X-CSRFToken": getCookie("csrftoken") || "",
  };

  return fetch("/api" + url , { ...options, headers });
}

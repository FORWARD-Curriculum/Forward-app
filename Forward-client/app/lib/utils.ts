import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Concatenates tailwind classnames for use within components
 * @param {ClassValue[]} inputs 
 * @returns {string}
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

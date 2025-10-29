import { setUser } from "@/features/account/slices/userSlice";
import { useDispatch } from "react-redux";
import { apiFetch } from "@/utils/utils";
import type { User } from "@/features/account/types";
import { initialLessonResponseState, resetResponseState, setResponse } from "@/features/curriculum/slices/userLessonDataSlice";
import { resetInitialLessonState } from "@/features/curriculum/slices/lessonSlice";

// Function to get the CSRF token from cookies
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
};

export const useAuth = () => {
  // we can re export the user methods or object from this hook
  const dispatch = useDispatch();
  /**
   * Adds a user's information to LocalStorage and updates the AuthContext
   * @param {User} user - The constructed User object from the backend
   */
  const login = (user: User) => {
    dispatch(setUser(user));
    // dispatch(resetResponseState());  // test
    // dispatch(resetInitialLessonState());
    window.location.reload();
    window.location.href = "/dashboard"; // this may have worked
  };

  /**
   * Updates a user's information. (You could use login for the same thing,
   * but self-descriptive code is better)
   * @param {User} user
   */
  const update = (user: User) => {
    dispatch(setUser(user));
  };

  /**
   * Sends a request to the backend to delete the current user session
   * @throws Logout Error
   * @async
   */
  const logout = async () => {
    try {
      const response = await apiFetch("/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        // If the backend fails, we don't log the user out on the client.
        const result = await response.json();
        throw new Error(result.detail || "Server logout failed.");
      }

      //eagerly log out
      dispatch(resetResponseState());
      dispatch(resetInitialLessonState());
      
      window.location.reload();
      window.location.href = "/";
      
    } catch (error: any) {
      console.error(error.message || "Logout failed. Please try again.");
      throw error; // This propagates the error to the caller
    }
  };

  return { login, logout, update };
};

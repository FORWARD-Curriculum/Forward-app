import { useEffect, useState } from "react";
import { useUser, type User } from "@/lib/useUser";
import { useLocalStorage } from "@/lib/useLocalStorage";

// Function to get the CSRF token from cookies
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

export const useAuth = () => {
  // we can re export the user methods or object from this hook
  const { user, addUser, removeUser, setUser } = useUser();
  const { getItem } = useLocalStorage();

  const [loading, setLoading] = useState(true); // Loading state to prevent early navigation

  useEffect(() => {
    // Check for an existing user in localStorage only once when the app initializes
    const existingUser = getItem("user");
    if (existingUser && !user) {
      let parsedUser;
      try {
        parsedUser = JSON.parse(existingUser);
      } catch (error) {
        parsedUser = null;
      }

      addUser(parsedUser);
    }
    setLoading(false); // Loading complete
  }, [user, addUser, getItem]);

  const login = (user: User) => {
    addUser(user);
  };

  const logout = () => {
    fetch("/api/logout/", {
      method: "POST",
      headers: {
        "X-CSRFToken": getCookie("csrftoken") || "",
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    }).then((response) => {
      if (response.ok) {
        removeUser();
      }
    });
  };

  return { user, loading, login, logout, setUser };
};
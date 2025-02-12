import { useEffect, useState } from "react";
import { useUser, type User } from "@/lib/useUser";
import { useLocalStorage } from "@/lib/useLocalStorage";


export const useAuth = () => {
  // we can re export the user methods or object from this hook
  const { user, addUser, removeUser, setUser } = useUser();
  const { getItem } = useLocalStorage();

  const [loading, setLoading] = useState(true); // Loading state to prevent early navigation

  useEffect(() => {
    // Check for an existing user in localStorage only once when the app initializes
    const existingUser = getItem("user");
    if (existingUser && !user) {
      const parsedUser = JSON.parse(existingUser);
      addUser(parsedUser);
    }
    setLoading(false); // Loading complete
  }, [user, addUser, getItem]);
  
  const login = (user: User) => {
    addUser(user);
  };

  const logout = () => {
    removeUser();
  };




  return { user, loading, login, logout, setUser };
};
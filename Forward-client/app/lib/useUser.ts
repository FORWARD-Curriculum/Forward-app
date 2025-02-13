import React, { useContext } from "react";
import { AuthContext } from "@/components/authContext";
import { useLocalStorage } from "@/lib/useLocalStorage";

export interface User {
    firstName: string;
    lastName: string;
    username: string;
    id: string;
}

export const useUser = () => {
    const { user, setUser } = useContext(AuthContext);
    const { setItem } = useLocalStorage();

    const addUser = (user: User) => {
        setUser(user);
        setItem("user", JSON.stringify(user));
    };

    const removeUser = () => {
        setUser(null);
        setItem("user", "");
    };

    return { user, addUser, removeUser, setUser };
};
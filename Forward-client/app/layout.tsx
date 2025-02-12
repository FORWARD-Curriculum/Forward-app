import { Outlet } from "react-router";
import { useState, type Dispatch, type SetStateAction } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { AuthContext } from "@/components/authContext";
import type { User } from "@/lib/useUser";

export default function Layout() {
    const [user, setUser] = useState<User | null>(null);

    return <>
        <AuthContext.Provider value={{ user, setUser }}>
            <div className="relative min-h-[100vh] flex content-evenly flex-col">
                <Header />
                <div className="flex-grow flex">
                    <Outlet />
                </div>
                <Footer />
            </div>
        </AuthContext.Provider>
    </>
}
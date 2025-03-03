import { Navigate, Outlet, useLocation } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function Layout() {
    const location = useLocation();
    const user = useSelector((state: RootState)=> state.user.user)

    return <>
        {user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace/>}
    </>
}
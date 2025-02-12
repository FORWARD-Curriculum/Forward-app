import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./lib/useAuth";

export default function Layout() {
    const { user, loading } = useAuth();
    const location = useLocation();


    return <>
        {user  ? 
            <Outlet /> 
            : !loading ?
                <Navigate to="/login" state={{ from: location }} replace/>
                : <></>
        }
    </>
}
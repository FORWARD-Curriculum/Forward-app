import { Outlet } from "react-router";
import Header from "./components/header";
import Footer from "./components/footer";

export default function Layout() {
    return <>
        <div className="relative min-h-[100vh] flex content-evenly flex-col">
            <Header />
            <div className="flex-grow flex">
                <Outlet />
            </div>
            <Footer />
        </div>
    </>
}
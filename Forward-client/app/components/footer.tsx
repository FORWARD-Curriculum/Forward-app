import { Link } from "react-router";

export default function Footer() {
    return <>
        <div className="

        flex flex-col bg-muted **:!text-muted-foreground **:!no-underline  box-border
        items-center px-12 py-4 min-h-25 left-0 bottom-0 right-0 w-full gap-3 lg:gap-0.5
        
        ">
            <Link to="/" className="text-2xl lg:text-xl font-medium text-center lg:text-left w-full">FORWARD</Link>
            <ul className=" list-none flex flex-col lg:flex-row gap-1 items-center">
                <li>
                    <Link to="/Linkccessibility">Accessibility</Link>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <Link to="/technical-help">Technical Help</Link>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <Link to="/feedback">Feedback</Link>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <Link to="/privacy-policy">Privacy Policy</Link>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <Link to="/cookie-settings">Cookie Settings</Link>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <Link to="/cookie-settings">Cookie Settings</Link>
                </li>
                <li className="hidden lg:block">|</li>
                <li className="mt-4 lg:mt-0">©2025 Anne Grayson</li>

            </ul>
        </div>
    </>
}
export default function Footer() {
    return <>
        <div className="

        flex flex-col bg-gray-200 **:!text-gray-400 **:!no-underline  box-border
        items-center px-12 py-4 min-h-25 left-0 bottom-0 right-0 w-full gap-3 lg:gap-0.5
        
        ">
            <a href="/" className="text-2xl lg:text-xl font-medium text-center lg:text-left w-full">FORWARD</a>
            <ul className=" list-none flex flex-col lg:flex-row gap-1 items-center">
                <li>
                    <a href="/accessibility">Accessibility</a>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <a href="/technical-help">Technical Help</a>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <a href="/feedback">Feedback</a>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <a href="/privacy-policy">Privacy Policy</a>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <a href="/cookie-settings">Cookie Settings</a>
                </li>
                <li className="hidden lg:block">|</li>
                <li>
                    <a href="/cookie-settings">Cookie Settings</a>
                </li>
                <li className="hidden lg:block">|</li>
                <li className="mt-4 lg:mt-0">©2025 Anne Grayson</li>

            </ul>
        </div>
    </>
}
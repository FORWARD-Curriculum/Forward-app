export default function Footer() {
    return <>
        <div className="flex flex-col bg-gray-200 text-gray-400 box-border items-center px-12 py-4 h-25 left-0 bottom-0 right-0 w-full space-y-0.5 absolute">
            <a href="/" className="text-xl font-medium text-left w-full">FORWARD</a>
            <ul className=" list-none flex gap-1 items-center">
                <li>
                    <a href="/accessibility">Accessibility</a>
                </li>
                <li>|</li>
                <li>
                    <a href="/technical-help">Technical Help</a>
                </li>
                <li>|</li>
                <li>
                    <a href="/feedback">Feedback</a>
                </li>
                <li>|</li>
                <li>
                    <a href="/privacy-policy">Privacy Policy</a>
                </li>
                <li>|</li>
                <li>
                    <a href="/cookie-settings">Cookie Settings</a>
                </li>
                <li>|</li>
                <li>
                    <a href="/cookie-settings">Cookie Settings</a>
                </li>
                <li>|</li>
                <li>©2025 Anne Grayson</li>

            </ul>
        </div>
    </>
}
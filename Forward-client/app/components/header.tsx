import React from 'react';

export default function Header() {
    return <>
        <div className="flex bg-cyan-500 box-border **:!text-white **:!no-underline items-center px-12 h-18 w-full">
            <a href="/" className="text-xl font-medi">FORWARD</a>
            <ul className=" list-none flex gap-6 ml-auto items-center font-medium">
                <li>
                    <a href="/dashboard">Dashboard</a>
                </li>
                <li>
                    <a href="/lessons">Lessons</a>
                </li>
                <li>
                    <a href="/activities">Activities</a>
                </li>
                <li>
                    <a href="/login">Log In</a>
                </li>
            </ul>
        </div>
    </>
}
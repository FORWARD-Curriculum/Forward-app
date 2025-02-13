import { useAuth } from '@/lib/useAuth';
import * as DropdownMenu from '@/components/ui/dropdown-menu';

export default function Header() {
    const { user, logout } = useAuth();

    return <>
        <div className={`flex bg-cyan-500 box-border **:!text-white **:!no-underline items-center ${user?"pl-12 pr-8":"px-12"} h-18 w-full`}>
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
                    {
                    user?
                        <DropdownMenu.DropdownMenu>
                            <DropdownMenu.DropdownMenuTrigger className='flex gap-4 items-centerrounded-none hover:bg-cyan-400 transition-colors duration-200 p-3'>
                                <img src="pfp.png" className="h-10 w-10 rounded-full" />
                            </DropdownMenu.DropdownMenuTrigger>
                            <DropdownMenu.DropdownMenuContent className='bg-white rounded-sm w-full border-none p-0 *:p-0'>
                                <DropdownMenu.DropdownMenuItem >
                                    <p className='p-3'>{user.firstName} {user.lastName}</p>
                                </DropdownMenu.DropdownMenuItem>
                                <DropdownMenu.DropdownMenuItem >
                                    <button onClick={logout} className='w-full text-left hover:underline hover:bg-gray-100 p-3'>Log Out</button>
                                </DropdownMenu.DropdownMenuItem>
                            </DropdownMenu.DropdownMenuContent>
                        </DropdownMenu.DropdownMenu>
                        :<a href="/login">Log In</a>
                    }
                </li>
            </ul>
        </div>
    </>
}
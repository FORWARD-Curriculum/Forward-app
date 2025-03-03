import React from "react";
import { useAuth } from "@/lib/useAuth";
import * as Sheet from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import * as DropdownMenu from "@/components/ui/dropdown-menu";
import { useClient } from "@/lib/useClient";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Link } from "react-router";

export default function Header() {
  const { logout } = useAuth();
  const { windowDimensions } = useClient();
  const user = useSelector((state: RootState) => state.user.user);

  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div
        className={` flex bg-cyan-500 box-border **:text-white items-center ${
          user ? "pl-12 pr-8" : "px-12"
        } h-18 w-full`}
      >
        <Link to="/" className="text-xl font-medi">
          FORWARD
        </Link>

        {/* This is the mobile menu */}

        {/* This is the desktop menu */}
        {windowDimensions.width > 1024 ? (
          <ul className="flex list-none gap-6 ml-auto items-center font-medium">
            <li>
              <Link to={"/dashboard"}>Dashboard</Link>
            </li>
            <li>
              <Link to={"/lessons"}>Lessons</Link>
            </li>
            <li>
              <Link to={"/activities"}>Activities</Link>
            </li>
            <li>
              {/* BUG: radixui applies a data-scroll-lock css class to the body with the
                  !important modifier, this causes an overflow on the right side of the screen.
                  Even with the overflow-x: hidden; applied, or margin-right: 0px !important;
                  the body still has a content shift due to the margin. I have looked into Radix's
                  documentation, and have found no way to disable the content shift caused by shadcn's 
                  use of their headless dialog component. It may be a case of having to use a different
                  custom component or looking further into it. For now, I am choosing to keep it.*/}
              {user ? (
                <DropdownMenu.DropdownMenu>
                  <DropdownMenu.DropdownMenuTrigger className="flex gap-4 items-center rounded-none hover:bg-cyan-400 transition-colors duration-200 p-3">
                    <img src="pfp.png" className="h-10 w-10 rounded-full" />
                  </DropdownMenu.DropdownMenuTrigger>
                  <DropdownMenu.DropdownMenuContent className="bg-white rounded-sm w-full border-none p-0 *:p-0">
                    <DropdownMenu.DropdownMenuItem>
                      <Link
                        to="/account"
                        className="w-full text-left hover:underline hover:bg-gray-100 p-3"
                      >
                        Account
                      </Link>
                    </DropdownMenu.DropdownMenuItem>
                    <DropdownMenu.DropdownMenuItem>
                      <button
                        onClick={() => {
                          logout()
                            .then(() => {
                              setOpen(false);
                              toast.success("Successfully Logged Out");
                            })
                            .catch((error: any) => {
                              toast.error(error.message);
                            });
                        }}
                        className="w-full text-left hover:underline hover:bg-gray-100 p-3"
                      >
                        Log Out
                      </button>
                    </DropdownMenu.DropdownMenuItem>
                  </DropdownMenu.DropdownMenuContent>
                </DropdownMenu.DropdownMenu>
              ) : (
                <Link to={"/login"}>Log In</Link>
              )}
            </li>
          </ul>
        ) : (
          <Sheet.Sheet open={open} onOpenChange={setOpen}>
            <Sheet.SheetTrigger className="ml-auto">
              <Menu className="h-8 w-8" />
            </Sheet.SheetTrigger>
            <Sheet.SheetContent
              className="bg-gray-100 flex flex-col px-4"
              aria-describedby="A slide out from the right of the screen containing the navigation in a mobile-friendly way."
            >
              <Sheet.SheetTitle>FORWARD Navigation</Sheet.SheetTitle>
              <div className="flex flex-col *:bg-white *:flex *:justify-between *:p-4 space-y-1 *:active:bg-gray-200 *:rounded-xl">
                <Link to={"/dashboard"}>Dashboard</Link>
                <Link to={"/lessons"}>Lessons</Link>
                <Link to={"/activities"}>Activities</Link>
              </div>
              {user ? (
                <div className="flex flex-col mt-auto gap-4">
                  <Link to="/account" className="w-full flex gap-3 ">
                    <img src="pfp.png" className="h-10 w-10 rounded-full" />
                    <div className="flex flex-col text-left">
                      <p>
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-500">{user.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                        .then(() => {
                          setOpen(false);
                          toast.success("Successfully Logged Out");
                        })
                        .catch((error: any) => {
                          toast.error(error.message);
                        });
                    }}
                    className="w-full text-center hover:underline bg-red-700 text-white p-3 active:bg-red-900"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="mt-auto text-center bg-cyan-500 text-white p-3 w-full"
                >
                  Login
                </Link>
              )}
            </Sheet.SheetContent>
          </Sheet.Sheet>
        )}
      </div>
    </>
  );
}

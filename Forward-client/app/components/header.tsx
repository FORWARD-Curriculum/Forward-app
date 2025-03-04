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
        className={` flex bg-primary box-border **:text-white items-center ${
          user ? "pl-12 pr-8" : "px-12"
        } h-18 w-full border-b-primary-border border-b-1`}
      >
        <Link to="/" className="text-xl font-medi">
          FORWARD
        </Link>

        {/* This is the mobile menu */}

        {/* This is the desktop menu */}
        {windowDimensions.width > 1024 ? (
          <ul className="flex list-none gap-6 ml-auto items-center font-medium *:hover:underline">
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
                  <DropdownMenu.DropdownMenuTrigger className="flex gap-4 items-center rounded-none hover:backdrop-brightness-115 transition-colors duration-200 p-3">
                    <div
                      className={`w-10 h-10 rounded-full overflow-hidden flex justify-center items-center ${
                        user.profilePicture
                          ? ""
                          : "border-1 border-solid border-white"
                      }`}
                    >
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          className=" object-cover"
                        />
                      ) : (
                        <p className="text-xl font-light">
                          {(user.displayName || "   ")
                            .substring(0, 2)
                            .toUpperCase()}
                        </p>
                      )}
                    </div>
                  </DropdownMenu.DropdownMenuTrigger>
                  <DropdownMenu.DropdownMenuContent className="bg-secondary text-secondary-foreground rounded-sm w-full border-none p-0 *:p-0 **:active:backdrop-brightness-95">
                    <DropdownMenu.DropdownMenuItem>
                      <Link
                        to="/account"
                        className="w-full text-left hover:underline hover:backdrop-brightness-90 p-3"
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
                        className="w-full text-left hover:underline hover:backdrop-brightness-90 p-3"
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
              className={`bg-background flex flex-col px-4 ${
                user?.preferences?.theme || ""
              } ${user?.preferences?.text_size || ""}`}
              aria-describedby="A slide out from the right of the screen containing the navigation in a mobile-friendly way."
            >
              <Sheet.SheetTitle className="text-secondary-foreground">
                FORWARD Navigation
              </Sheet.SheetTitle>
              <div className="flex flex-col *:bg-secondary *:flex *:justify-between *:p-4 space-y-1 *:active:bg-gray-200/80
              *:rounded-xl text-secondary-foreground *:outline-secondary-border *:outline-1">
                <Link to={"/dashboard"}>Dashboard</Link>
                <Link to={"/lessons"}>Lessons</Link>
                <Link to={"/activities"}>Activities</Link>
              </div>
              {user ? (
                <div className="flex flex-col mt-auto gap-4 group">
                  <Link
                    to="/account"
                    className="w-full flex gap-3 active:backdrop-brightness-150"
                  >
                    <div
                      className={`w-10 h-10 rounded-full overflow-hidden flex justify-center items-center ${
                        user.profilePicture
                          ? ""
                          : "border-1 border-solid border-muted-foreground"
                      }`}
                    >
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          className=" object-cover"
                        />
                      ) : (
                        <p className="text-xl font-light text-secondary-foreground">
                          {(user.displayName || "   ")
                            .substring(0, 2)
                            .toUpperCase()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <p className="text-secondary-foreground text-base group-hover:underline">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-muted-foreground group-hover:underline">
                        {user.username}
                      </p>
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
                    className="w-full text-center hover:underline bg-error text-white p-3 active:brightness-85 outline-error-border outline-1"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="mt-auto text-center bg-primary text-primary-foreground active:brightness-110 p-3 w-full"
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

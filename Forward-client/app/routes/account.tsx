import type { User } from "@/lib/userSlice";
import React, { useEffect, useRef } from "react";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PenIcon, PenOffIcon } from "lucide-react";
import { apiFetch } from "@/lib/utils";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";

function ThemeOption({
  themeName,
  themeBG,
  themePrimary,
  className,
  ...props
}: {
  themeName: NonNullable<User["preferences"]>["theme"];
  themeBG: string;
  themePrimary: string;
} & React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <div>
      <input
        aria-label={themeName + " theme"}
        type="radio"
        id={`theme_${themeName}`}
        className="peer hidden"
        name="theme"
        value={themeName}
      />
      <label
        htmlFor={`theme_${themeName}`}
        className={`peer-checked:outline-secondary-foreground block h-10 overflow-hidden rounded-xl outline-offset-4 peer-checked:outline-2 ${className}`}
        {...props}
      >
        <svg
          viewBox="0 0 100 100"
          width="40"
          height="40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id={`diag-split-${themeName}`}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="50%" stopColor={themeBG} />
              <stop offset="50%" stopColor={themePrimary} />
            </linearGradient>
          </defs>
          <rect
            width="100"
            height="100"
            fill={`url(#diag-split-${themeName})`}
          />
        </svg>
      </label>
    </div>
  );
}

export default function account() {
  const updateUser = useAuth().update;
  const user = useSelector((s: RootState) => s.user.user) as User;

  // Reactive
  const [formState, setFormState] = useState({
    profilePic: null as string | null,
    displayNameEdit: true,
    removedPicture: false,
    theme: user.preferences?.theme,
    textSize: user.preferences?.text_size,
  });

  const originalState = useRef({
    theme: user.preferences?.theme,
    textSize: user.preferences?.text_size,
    profilePicture: user.profile_picture,
    displayName: user.display_name,
    consent: user.consent,
  });

  useEffect(() => {
    updateUser({
      ...user,
      preferences: { theme: formState.theme, text_size: formState.textSize },
    });
  }, [formState.theme, formState.textSize]);

  const handleSubmit = async (e: any) => {
    e.preventDefault(); // Prevent the default form submission behavior
    const formData = new FormData(e.target as HTMLFormElement);

    /*
     * Because the user model does not have a nested preferences field, we
     * format it linearly to match, but keep the nesting on the client for
     * niceties.
     */
    const data = {
      profile_picture: formState.profilePic,
      display_name: formData.get("display_name"),
      consent: formData.has("consent"),
      theme: formState.theme,
      text_size: formState.textSize,
    };

    // Error out if the user didnt change anything, but submitted somehow
    if (JSON.stringify(originalState.current) === JSON.stringify(data)) {
      return toast.error("Please make a change to update account.");
    }

    // Send updated prefs to server and update from source of truth.
    try {
      const response = await apiFetch("users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Login error.");
      }

      updateUser({
        ...result.data.user /*, preferences: result.data.user.preferences*/,
      });
      toast.success("Successfully updated user information.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex w-screen grow items-center justify-center">
      <form
        encType="multipart/form-data"
        className="bg-foreground text-secondary-foreground border-foreground-border flex flex-col items-center justify-center rounded-3xl border-1 p-4 leading-none"
        onSubmit={handleSubmit}
      >
        <h1 className="w-full text-xl lg:text-center">Profile Overview</h1>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-row-reverse items-center justify-center gap-5 lg:flex-col lg:gap-2 lg:border-r lg:border-r-gray-200 lg:pr-3">
            <div className="flex flex-col lg:items-center lg:justify-center">
              <p className="text-secondary-foreground text-3xl lg:text-base">
                {user.display_name}
              </p>
              <p className="text-muted-foreground lg:text-xs">
                {user.username}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-30 w-30 items-center justify-center overflow-hidden rounded-full ${
                  formState.profilePic ||
                  (user.profile_picture && !formState.removedPicture)
                    ? ""
                    : "border-muted-foreground border-1 border-solid"
                }`}
              >
                {formState.profilePic ||
                (user.profile_picture && !formState.removedPicture) ? (
                  <img
                    src={formState.profilePic || user.profile_picture}
                    className="object-cover"
                  />
                ) : (
                  <p className="text-secondary-foreground text-5xl font-light">
                    {(user.display_name || "   ").substring(0, 2).toUpperCase()}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Popover>
                  <PopoverTrigger
                    type="button"
                    className="text-primary-foreground bg-primary outline-primary-border rounded-3xl p-1.5 text-sm outline-1 brightness-110 hover:cursor-pointer hover:brightness-120 active:brightness-100"
                  >
                    Change Picture
                  </PopoverTrigger>
                  <PopoverContent
                    className={`${
                      user?.preferences?.theme ||
                      "" + user?.preferences?.text_size ||
                      ""
                    } bg-foreground border-secondary-foreground w-fit flex flex-col items-center align-middle text-secondary-foreground`}
                  >
                    <h2 className="text-wrap w-fit">
                      Select new Profile Picture
                    </h2>
                    <div className=" grid grid-cols-3 justify-items-center items-center grid-rows-3 w-fit">
                      {Array(9)
                        .fill(0)
                        .map((_, i) => (
                          <PopoverClose
                            className="overflow-hidden h-15 rounded-full m-1"
                            onClick={() => {
                              setFormState({
                                ...formState,
                                profilePic: `/profile_pictures/${i + 1}.jpg`,
                              });
                            }}
                          >
                            <img
                              key={i}
                              src={`/profile_pictures/${i + 1}.jpg`}
                              className="h-full"
                            />
                          </PopoverClose>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <button
                  aria-label="Remove the current profile picture"
                  type="button"
                  className="text-primary-foreground !bg-error outline-error-border rounded-3xl p-1.5 text-sm outline-1 brightness-110 hover:brightness-120 active:brightness-100"
                  onClick={() => {
                    setFormState({ ...formState, profilePic: null });
                    setFormState({ ...formState, removedPicture: true });
                  }}
                >
                  Remove Picture
                </button>
              </div>
            </div>
          </div>
          <dl className="flex flex-col items-center space-y-7">
            <dt className="flex w-full flex-col">
              <label htmlFor="display_name" className="text-sm">
                Edit Display Name
              </label>
              <div className="relative flex w-full">
                <Input
                  aria-label="Edit Display Name"
                  id="display_name"
                  name="display_name"
                  className={`${
                    formState.displayNameEdit
                      ? "text-muted-foreground"
                      : "text-secondary-foreground"
                  } border-gray-700`}
                  inert={formState.displayNameEdit}
                  defaultValue={user.display_name}
                />
                <Button
                  aria-label="Allow edits to display name"
                  className="active:bg-accent absolute right-0"
                  type="button"
                  variant={"ghost"}
                  onClick={() => {
                    setFormState({
                      ...formState,
                      displayNameEdit: !formState.displayNameEdit,
                    });
                  }}
                >
                  {formState.displayNameEdit ? <PenIcon /> : <PenOffIcon />}
                </Button>
              </div>
            </dt>
            <dt className="items-top flex gap-2">
              <Checkbox
                id="consent"
                name="consent"
                defaultChecked={user.consent}
                className="!border-secondary-foreground !bg-transparent"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="consent"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Agree to participate in FORWARD research program.
                </label>
                <p className="text-muted-foreground text-sm">
                  You agree to the collection of anonymized data concerning how
                  you use this platform.
                </p>
              </div>
            </dt>
            <dt className="flex flex-col items-center gap-7 lg:flex-row lg:items-start">
              <fieldset className="flex h-full w-full flex-col items-center">
                <legend className="mb-1 h-5 text-center">Change theme:</legend>
                <div className="flex flex-row gap-3">
                  <ThemeOption
                    themeName="dark"
                    themeBG="var(--color-gray-800)"
                    themePrimary="var(--color-cyan-700)"
                    onClick={() => {
                      setFormState({ ...formState, theme: "dark" });
                    }}
                  />
                  <ThemeOption
                    themeName="light"
                    themeBG="var(--color-gray-200)"
                    themePrimary="var(--color-cyan-500)"
                    onClick={() => {
                      setFormState({ ...formState, theme: "light" });
                    }}
                  />
                  <ThemeOption
                    themeName="high-contrast"
                    themeBG="var(--color-black)"
                    themePrimary="var(--color-fuchsia-600)"
                    onClick={() => {
                      setFormState({ ...formState, theme: "high-contrast" });
                    }}
                  />
                </div>
              </fieldset>
              <fieldset className="flex w-[110%] flex-col items-center">
                <legend className="mb-5 h-5 text-center">
                  Change Font Size:
                </legend>
                <div className="relative flex flex-col items-center lg:mx-6">
                  <input
                    aria-label="Change text size"
                    style={{
                      appearance: "none",
                      width: "100%",
                      height: "4px",
                      background: "var(--secondary-foreground)", // Track color
                      borderRadius: "0px",
                      outline: "none",
                      cursor: "pointer",
                      zIndex: "11",
                      // Thumb styles
                      WebkitAppearance: "none",
                      MozAppearance: "none",
                    }}
                    type="range"
                    step={1}
                    min={0}
                    max={3}
                    value={
                      user.preferences?.text_size
                        ? ["txt-sm", "txt-base", "txt-lg", "txt-xl"].indexOf(
                            user.preferences.text_size,
                          )
                        : 1
                    }
                    onChange={(e) => {
                      setFormState({
                        ...formState,
                        textSize: ["txt-sm", "txt-base", "txt-lg", "txt-xl"][
                          parseInt(e.target.value, 10)
                        ] as "txt-sm" | "txt-base" | "txt-lg" | "txt-xl",
                      });
                    }}
                  />
                  <div className="text-secondary-foreground pointer-events-none absolute -top-[calc(0.5rem-2px)] z-10 flex w-[104%] justify-between text-[1rem] font-bold">
                    <p>|</p>
                    <p>|</p>
                    <p>|</p>
                    <p>|</p>
                  </div>
                </div>
                <style>
                  {`
                  input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 1.5rem;
                    height: 1.5rem;
                    background: white;
                    border-radius: 50%;
                    border: 2px solid var(--secondary-foreground);
                    cursor: pointer;
                    transform: scaleX(0.8);
                  }

                  input[type="range" i]::-webkit-slider-runnable-track {
                    transform: scaleX(1.2);
                  }
                         
                  input[type="range"]::-moz-range-thumb {
                    width: 1.5rem;
                    height: 1.5rem;
                    background: #cccccc;
                    border-radius: 50%;
                    border-color: black;
                    cursor: pointer;
                    transform: scaleX(0.8);
                  }
                `}
                </style>
              </fieldset>
            </dt>
            <dt className="mt-auto flex w-full gap-2">
              <Button
                aria-label="Submit changes"
                type="submit"
                className="button text-primary-foreground !bg-primary outline-primary-border w-full outline-1 brightness-110 hover:brightness-120 active:brightness-100"
                variant={"default"}
              >
                Save Changes
              </Button>
              <Button
                aria-label="Reset changes"
                type="reset"
                className="button text-primary-foreground !bg-error outline-error-border w-full outline-1 brightness-110 hover:brightness-120 active:brightness-100"
                variant={"default"}
                onClick={() => {
                  setFormState({
                    profilePic: null,
                    removedPicture: false,
                    displayNameEdit: true,
                    theme: originalState.current.theme,
                    textSize: originalState.current.textSize,
                  });
                  toast.success("Successfully reverted changes.");
                }}
              >
                Discard Changes
              </Button>
            </dt>
          </dl>
        </div>
      </form>
    </div>
  );
}

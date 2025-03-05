import type { User } from "@/lib/userSlice";
import React, { useEffect, useRef } from "react";
import type { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PenIcon, PenOffIcon } from "lucide-react";
import { apiFetch } from "@/lib/utils";
import { useAuth } from "@/lib/useAuth";
import { toast } from "sonner";

const ThemeOption = React.forwardRef<
  HTMLInputElement,
  {
    themeName: NonNullable<User["preferences"]>["theme"];
    themeBG: string;
    themePrimary: string;
  } & React.LabelHTMLAttributes<HTMLLabelElement>
>(({ themeName, themeBG, themePrimary, className, ...props }, ref) => {
  return (
    <div>
      <input
        ref={ref}
        type="radio"
        id={`theme_${themeName}`}
        className="peer hidden"
        name="theme"
        value={themeName}
      />
      <label
        htmlFor={`theme_${themeName}`}
        className={`block peer-checked:outline-secondary-foreground peer-checked:outline-2 outline-offset-4 rounded-xl h-10 overflow-hidden ${className}`}
        {...props}
      >
        <svg
          viewBox="0 0 100 100"
          width="40"
          height="40"
          xmlns="http://www.w3.org/2000/svg"
          className=" "
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
});

/**
 * HUGE TODO: SEND IMAGE FILE TO SERVER, NOT LOCAL BLOB URL
 */

async function cropImageToSquare(file: File | undefined): Promise<File | null> {
  if (!file) return null;
  const croppedBlob: Blob | null = await new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const size = Math.min(img.width, img.height); // Square size
      const canvas = document.createElement("canvas");
      [canvas.width, canvas.height] = [size, size];
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      // Crop from the center
      const [offsetX, offsetY] = [
        (img.width - size) / 2,
        (img.height - size) / 2,
      ];
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
      canvas.toBlob((blob) => resolve(blob), "image/png");
    };
    img.onerror = () => resolve(null);
  });
  // Return a png on success, null if else
  const croppedFile = croppedBlob
    ? new File([croppedBlob], file.name, {
        type: "image/png",
      })
    : null;
  return croppedFile;
}

export default function account() {
  const update = useAuth().update;
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.user.user) as User;
  const [profile_pic, setProfilePic] = useState<File | null>();
  const [displayNameEdit, setDisplayNameEdit] = useState(true);
  const [removedPicture, setRemovedPicture] = useState(false);

  // Theming Live-update - use ref stores pre-changes for discard/restu button
  const originalTheme = useRef(user.preferences?.theme);
  const [newTheme, setNewTheme] = useState<
    NonNullable<User["preferences"]>["theme"] | undefined
  >(originalTheme.current);

  // Text sizing live update
  const originalTxt = useRef(user.preferences?.text_size);
  const [newTxt, setNewTxt] = useState<
    NonNullable<User["preferences"]>["text_size"] | undefined
  >(originalTxt.current);

  // Update local user object to reflect theme changes
  useEffect(() => {
    dispatch({
      type: "user/setUser",
      payload: { ...user, preferences: { theme: newTheme, text_size: newTxt } },
    });
  }, [newTheme, newTxt]);

  const handleSubmit = async (e: any) => {
    e.preventDefault(); // Prevent the default form submission behavior
    const formData = new FormData(e.target);
    const data = {
      profile_picture:
        profile_pic || removedPicture
          ? profile_pic
            ? URL.createObjectURL(profile_pic)
            : null
          : user.profilePicture,
      display_name: formData.get("display_name"),
      ...(formData.get("consent") ? { consent: true } : { consent: false }),
      theme: newTheme,
      text_size: newTxt,
    };
    try {
      // Error out if the user didnt change anything, but submitted somehow
      if (
        user.profilePicture === data.profile_picture &&
        user.displayName === data.display_name &&
        user.consent === data.consent &&
        originalTheme.current === newTheme &&
        originalTxt.current == newTxt
      ) {
        throw new Error("Please make a change to update account.");
      }
      const response = await apiFetch("users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Login error.");
      }

      const _user: User = {
        id: result.data.user.id,
        username: result.data.user.username,
        displayName: result.data.user.display_name,
        facility_id: result.data.facility_id,
        profilePicture: result.data.user.profile_picture || undefined,
        consent: result.data.user.consent,
        preferences: {
          theme: result.data.user.preferences.theme,
          text_size: result.data.user.preferences.text_size,
        },
      };

      update(_user);
      toast.success("Successfully updated user information.");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center w-screen grow">
      <form
        encType="multipart/form-data"
        className="flex items-center flex-col bg-foreground text-secondary-foreground
        justify-center rounded-3xl p-4 leading-none border-foreground-border border-1"
        onSubmit={handleSubmit}
      >
        <h1 className="text-xl w-full lg:text-center">Profile Overview</h1>
        <div className="flex gap-3 flex-col lg:flex-row mt-4">
          <div className="flex flex-row-reverse gap-5 items-center justify-center lg:flex-col lg:gap-2 lg:border-r-gray-200 lg:border-r lg:pr-3">
            <div className="flex flex-col lg:items-center lg:justify-center">
              <p className="text-3xl lg:text-base text-secondary-foreground">
                {user.displayName}
              </p>
              <p className="text-muted-foreground lg:text-xs">
                {user.username}
              </p>
            </div>
            <div className="gap-1 flex flex-col items-center">
              <div
                className={`w-30 h-30 rounded-full overflow-hidden flex justify-center items-center ${
                  profile_pic || (user.profilePicture && !removedPicture)
                    ? ""
                    : "border-1 border-solid border-muted-foreground"
                }`}
              >
                {profile_pic || (user.profilePicture && !removedPicture) ? (
                  <img
                    src={
                      (profile_pic ? URL.createObjectURL(profile_pic) : null) ||
                      user.profilePicture
                    }
                    className=" object-cover"
                  />
                ) : (
                  <p className="text-5xl font-light text-secondary-foreground">
                    {(user.displayName || "   ").substring(0, 2).toUpperCase()}
                  </p>
                )}
              </div>
              <div className="flex-col flex gap-0.5">
                <label
                  htmlFor="pfp"
                  className="text-sm text-primary-foreground bg-primary brightness-110 hover:brightness-120
                  active:brightness-100 rounded-3xl p-1.5 hover:cursor-pointer outline-primary-border outline-1"
                >
                  Change Picture
                </label>
                <Input
                  type="file"
                  id="pfp"
                  multiple={false}
                  className="hidden"
                  onChange={(e) => {
                    cropImageToSquare(e.target.files?.[0]).then((file) => {
                      setProfilePic(file);
                    });
                  }}
                  accept=".png, .jpg, .jpeg"
                />
                <button
                  type="button"
                  className="text-sm text-primary-foreground !bg-error brightness-110 hover:brightness-120
                  active:brightness-100 rounded-3xl p-1.5 outline-error-border outline-1"
                  onClick={() => {
                    setProfilePic(null);
                    setRemovedPicture(true);
                  }}
                >
                  Remove Picture
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-7">
            <div className="flex flex-col w-full">
              <label htmlFor="display_name" className="text-sm">
                Edit Display Name
              </label>
              <div className="flex relative w-full">
                <Input
                  id="display_name"
                  name="display_name"
                  className={`${
                    displayNameEdit
                      ? "text-muted-foreground"
                      : "text-secondary-foreground"
                  } border-gray-700`}
                  inert={displayNameEdit}
                  defaultValue={user.displayName}
                />
                <Button
                  className="absolute right-0 active:bg-accent"
                  type="button"
                  variant={"ghost"}
                  onClick={() => {
                    setDisplayNameEdit(!displayNameEdit);
                  }}
                >
                  {displayNameEdit ? <PenIcon /> : <PenOffIcon />}
                </Button>
              </div>
            </div>
            <div className="flex items-top gap-2">
              <Checkbox
                id="consent"
                name="consent"
                defaultChecked={user.consent}
                className="!bg-transparent !border-secondary-foreground"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="consent"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Agree to participate in FORWARD research program.
                </label>
                <p className="text-sm text-muted-foreground">
                  You agree to the collection of anonymized data concerning how
                  you use this platform.
                </p>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-7 items-center lg:items-start">
              <fieldset className="flex flex-col items-center h-full w-full">
                <legend className="text-center h-5 mb-1">Change theme:</legend>
                <div className="flex flex-row gap-3">
                  <ThemeOption
                    themeName="dark"
                    themeBG="var(--color-gray-800)"
                    themePrimary="var(--color-cyan-700)"
                    onClick={() => {
                      setNewTheme("dark");
                    }}
                  />
                  <ThemeOption
                    themeName="light"
                    themeBG="var(--color-gray-200)"
                    themePrimary="var(--color-cyan-500)"
                    onClick={() => {
                      setNewTheme("light");
                    }}
                  />
                  <ThemeOption
                    themeName="high-contrast"
                    themeBG="var(--color-black)"
                    themePrimary="var(--color-fuchsia-600)"
                    onClick={() => {
                      setNewTheme("high-contrast");
                    }}
                  />
                </div>
              </fieldset>
              <fieldset className="flex flex-col items-center w-[110%]">
                <legend className="h-5 mb-5 text-center">
                  Change Font Size:
                </legend>
                <div className="relative flex flex-col items-center lg:mx-6">
                  <input
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
                            user.preferences.text_size
                          )
                        : 1
                    }
                    onChange={(e) => {
                      setNewTxt(
                        ["txt-sm", "txt-base", "txt-lg", "txt-xl"][
                          parseInt(e.target.value, 10)
                        ] as "txt-sm" | "txt-base" | "txt-lg" | "txt-xl"
                      );
                    }}
                  />
                  <div className="flex justify-between w-[104%] absolute -top-[calc(0.5rem-2px)] pointer-events-none text-[1rem] font-bold text-secondary-foreground z-10">
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
            </div>

            <div className="flex w-full mt-auto gap-2">
              <Button
                type="submit"
                className="button w-full text-primary-foreground !bg-primary brightness-110 hover:brightness-120 active:brightness-100
                outline-primary-border outline-1"
                variant={"default"}
              >
                Save Changes
              </Button>
              <Button
                type="reset"
                className="button w-full text-primary-foreground !bg-error brightness-110 hover:brightness-120 active:brightness-100
                outline-error-border outline-1"
                variant={"default"}
                onClick={() => {
                  setProfilePic(null);
                  setRemovedPicture(false);
                  setDisplayNameEdit(true);
                  setNewTheme(originalTheme.current);
                  setNewTxt(originalTxt.current);
                  toast.success("Successfully reverted changes.");
                }}
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

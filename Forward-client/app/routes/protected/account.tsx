import type { User } from "@/features/account/types";
import React, { useEffect, useRef } from "react";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PenIcon,
  PenOffIcon,
  Play,
  Rabbit,
  Square,
  Turtle,
} from "lucide-react";
import { apiFetch } from "@/utils/utils";
import { useAuth } from "@/features/account/hooks";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";
import { useSpeech } from "react-text-to-speech";
import { useVoices } from "react-text-to-speech";

function ThemeOption({
  themeName,
  themeBG,
  themePrimary,
  className,
  checked,
  ...props
}: {
  themeName: NonNullable<User["preferences"]>["theme"];
  themeBG: string;
  themePrimary: string;
  checked: boolean;
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
        defaultChecked={checked}
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

/**
 * This is could be cached instead of calculated once per tts...
 * @param voices
 * @returns same
 */
export function sortEngFirst(voices: SpeechSynthesisVoice[]) {
  return voices.slice().sort((a, b) => {
    const getRank = (voice: SpeechSynthesisVoice) => {
      const lower = voice.voiceURI.toLowerCase();
      if (lower.includes("states")) return 0;
      if (lower.includes("english")) return 1;
      return 2;
    };
    return getRank(a) - getRank(b);
  });
}

/**
 * This huge route should probably be refactored and compartementalized
 * @returns
 */
export default function account() {
  const updateUser = useAuth().update;
  const user = useSelector((s: RootState) => s.user.user) as User;

  //TTS Customs
  const { voices } = useVoices();
  const [voiceSpeed, setVoiceSpeed] = useState(
    user.preferences?.speech_speed || 1,
  );

  const sortedVoices = sortEngFirst(voices);
  const initialVoiceURIIndex = user.preferences?.speech_uri_index
    ? user.preferences.speech_uri_index
    : 0;
  const [voiceURIIndex, setVoiceURIIndex] = useState(initialVoiceURIIndex);

  const { Text, speechStatus, start, stop } = useSpeech({
    text: "The birch canoe slid on the smooth planks. Glue the sheet to the dark blue background!",
    highlightText: true,
    voiceURI: sortedVoices.at(voiceURIIndex)?.voiceURI || [],
    rate: voiceSpeed,
  });

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
    profile_picture: user.profile_picture,
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
      profile_picture: formState.removedPicture
        ? null
        : (formState.profilePic || user.profile_picture || "").trim() || null,
      display_name: formData.get("display_name"),
      consent: formData.has("consent"),
      theme: formState.theme,
      text_size: formState.textSize,
      speech_uri_index: voiceURIIndex,
      speech_speed: voiceSpeed,
    };

    // Error out if the user didnt change anything, but submitted somehow
    // BUG: these two dont have anything in common
    if (JSON.stringify(originalState.current) === JSON.stringify(data)) {
      return toast.error("Please make a change to update account.");
    }

    // Send updated prefs to server and update from source of truth.
    try {
      const response = await apiFetch("/users/me", {
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

  const clearLessonData = async () => {
    try {
      const response = await apiFetch(``, {
        method: "DELETE"
      });

      const result = await response.json();

      if (!response.ok){
        throw new Error(result.detail || "Reset Failed");
      }

      //add correct toast here later
      toast.success("Lesson progress rest successfully!")
    }
    catch (err: any){
      //add error toast here
      toast.error(err.message || "Failed to resest progress")
    }
  }

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
                className={`flex h-30 w-30 items-center justify-center overflow-hidden rounded-full ${!((formState.profilePic && !formState.removedPicture) || (user.profile_picture && !formState.removedPicture)) && "border-muted-foreground border-1 border-solid"}`}
              >
                {(formState.profilePic && !formState.removedPicture) ||
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
                    } bg-foreground border-secondary-foreground text-secondary-foreground flex w-fit flex-col items-center align-middle`}
                  >
                    <h2 className="w-fit text-wrap">
                      Select new Profile Picture
                    </h2>
                    <div className="grid w-fit grid-cols-3 grid-rows-3 items-center justify-items-center">
                      {Array(9)
                        .fill(0)
                        .map((_, i) => (
                          <PopoverClose
                            className="active:outline-secondary-foreground hover:outline-muted-foreground m-1 h-15 overflow-hidden rounded-full outline-offset-2 hover:outline-2 active:outline-2"
                            onClick={() => {
                              setFormState({
                                ...formState,
                                profilePic: `/profile_pictures/${i + 1}.jpg`,
                                removedPicture: false,
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
                {['student1', 'student2'].includes(user.username) && (
                  <Button
                    onClick={clearLessonData}
                  >
                    Clear Lesson Progress
                  </Button>
                )}
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
            <dt className="w-full">
              <p className="mb-5 w-full text-left">Customization</p>
              <div className="flex flex-col items-center gap-7 px-20 lg:flex-row lg:items-start">
                <fieldset className="flex h-full w-full flex-col items-center">
                  <legend className="mb-1 h-5 text-center">
                    Change theme:
                  </legend>
                  <div className="flex flex-row gap-3">
                    <ThemeOption
                      themeName="dark"
                      themeBG="var(--color-gray-800)"
                      themePrimary="var(--color-cyan-700)"
                      onClick={() => {
                        setFormState({ ...formState, theme: "dark" });
                      }}
                      checked={formState.theme === "dark"}
                    />
                    <ThemeOption
                      themeName="light"
                      themeBG="var(--color-gray-200)"
                      themePrimary="var(--color-cyan-500)"
                      onClick={() => {
                        setFormState({ ...formState, theme: "light" });
                      }}
                      checked={formState.theme === "light"}
                    />
                    <ThemeOption
                      themeName="high-contrast"
                      themeBG="var(--color-black)"
                      themePrimary="var(--color-fuchsia-600)"
                      onClick={() => {
                        setFormState({ ...formState, theme: "high-contrast" });
                      }}
                      checked={formState.theme === "high-contrast"}
                    />
                  </div>
                </fieldset>
                <fieldset className="flex w-[110%] flex-col items-center">
                  <legend className="mb-5 h-5 w-35 text-center">
                    Change Font Size:
                  </legend>
                  <div className="fontSizeInput relative flex flex-col items-center lg:mx-6">
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
                  .fontSizeInput input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 1.5rem;
                    height: 1.5rem;
                    background: white;
                    border-radius: 50%;
                    border: 2px solid var(--secondary-foreground);
                    cursor: pointer;
                    transform: scaleX(0.8);
                  }

                  .fontSizeInput input[type="range" i]::-webkit-slider-runnable-track {
                    transform: scaleX(1.2);
                  }
                         
                  .fontSizeInput input[type="range"]::-moz-range-thumb {
                    width: 1.5rem;
                    height: 1.5rem;
                    background: #cccccc;
                    border-radius: 50%;
                    border-color: black;
                    cursor: pointer;
                    transform: scaleX(0.8);
                  }
                  
                  input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 1.5rem;
                    height: 1.5rem;
                    background: white;
                    border-radius: 50%;
                    border: 2px solid var(--secondary-foreground);
                    cursor: pointer;
                  }

                  input[type="range"]::-moz-range-thumb {
                    width: 1.5rem;
                    height: 1.5rem;
                    background: #cccccc;
                    border-radius: 50%;
                    border-color: black;
                    cursor: pointer;
                  }
                `}
                  </style>
                </fieldset>
              </div>
            </dt>
            <dt className="w-full">
              <p className="mb-5 w-full text-left">Text to speech</p>
              <div className="flex flex-col items-center gap-10 px-20 lg:flex-row lg:items-start">
                <fieldset className="flex flex-col items-center gap-3">
                  <legend className="mb-3 w-full text-center">Voice</legend>
                  <select
                    id="voice"
                    value={voiceURIIndex}
                    onChange={(e) => setVoiceURIIndex(parseInt(e.target.value))}
                    className="bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-50 rounded-xl border px-3 py-2 text-base"
                  >
                    <option value="">Choose a voice</option>
                    {sortedVoices.map(({ voiceURI }, index) => (
                      <option key={voiceURI} value={index}>
                        {voiceURI}
                      </option>
                    ))}
                  </select>
                </fieldset>
                <fieldset className="flex w-full flex-col items-center">
                  <legend className="mb-6 w-full text-center">
                    Voice Speed
                  </legend>
                  <div className="flex items-center gap-2">
                    <Turtle />
                    <input
                      aria-label="Change text to speech speed"
                      className="w-35"
                      style={{
                        appearance: "none",
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
                      step={0.00001}
                      min={0.1}
                      max={3}
                      value={voiceSpeed}
                      onChange={(e) => {
                        setVoiceSpeed(parseFloat(e.target.value));
                      }}
                    />
                    <Rabbit />
                  </div>
                </fieldset>
              </div>
              <div className="flex flex-col items-center">
                <p className="mt-6 mb-3">Test Text to Speech</p>
                <div className="flex items-center gap-2">
                  {speechStatus === "stopped" || speechStatus == "paused" ? (
                    <Play
                      className="border-secondary-foreground size-10 cursor-pointer rounded-full border-2 p-2"
                      onClick={start}
                    />
                  ) : (
                    <Square
                      className="border-secondary-foreground size-10 cursor-pointer rounded-full border-2 p-2"
                      onClick={stop}
                    />
                  )}

                  <p className="bg-background border-secondary-border w-[30ch] rounded-3xl border-1 p-3 pl-5">
                    <Text />
                  </p>
                </div>
              </div>
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
                  setVoiceURIIndex(initialVoiceURIIndex);
                  setVoiceSpeed(user.preferences?.speech_speed || 1);
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

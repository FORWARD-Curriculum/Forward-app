import type { User } from "@/lib/userSlice";
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
  const user = useSelector((s: RootState) => s.user.user) as User;
  const [profile_pic, setProfilePic] = useState<File | null>();
  const [displayNameEdit, setDisplayNameEdit] = useState(true);
  const [removedPicture, setRemovedPicture] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault(); // Prevent the default form submission behavior
    const formData = new FormData(e.target);
    const data = {
      profile_picture: (profile_pic||removedPicture)
        ? (profile_pic?URL.createObjectURL(profile_pic):null)
        : user.profilePicture,
      display_name: formData.get("display_name"),
      ...(formData.get("consent") ? { consent: true } : { consent: false }),
    };
    try {
      // Error out if the user didnt change anything, but submitted somehow
      if (user.profilePicture === data.profile_picture&&
          user.displayName === data.display_name&&
          user.consent === data.consent
      ){
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
        className="flex items-center flex-col bg-white justify-center rounded-3xl p-4 leading-none "
        onSubmit={handleSubmit}
      >
        <h1 className="text-xl w-full lg:text-center">Profile Overview</h1>
        <div className="flex gap-3 flex-col lg:flex-row mt-4">
          <div className="flex flex-row-reverse gap-5 items-center justify-center lg:flex-col lg:gap-2 lg:border-r-gray-200 lg:border-r lg:pr-3">
            <div className="flex flex-col lg:items-center lg:justify-center">
              <p className="text-3xl lg:text-base">{user.displayName}</p>
              <p className="text-gray-500 lg:text-xs">{user.username}</p>
            </div>
            <div className="gap-1 flex flex-col items-center">
              <div
                className={`w-30 h-30 rounded-full overflow-hidden flex justify-center items-center ${
                  profile_pic || (user.profilePicture && !removedPicture)
                    ? ""
                    : "border-1 border-solid border-gray-700"
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
                  <p className="text-5xl font-light">
                    {(user.displayName || "   ").substring(0, 2).toUpperCase()}
                  </p>
                )}
              </div>
              <div className="flex-col flex gap-0.5">
                <label
                  htmlFor="pfp"
                  className="text-sm text-white bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 rounded-3xl p-1.5 hover:cursor-pointer"
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
                  className="text-sm bg-red-400 text-white hover:bg-red-300 active:bg-red-700 rounded-3xl p-1.5"
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
                    displayNameEdit ? "text-gray-500" : "text-black"
                  } border-gray-700`}
                  inert={displayNameEdit}
                  defaultValue={user.displayName}
                />
                <Button
                  className="absolute right-0"
                  type="button"
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

            <div className="flex w-full mt-auto">
              <Button
                type="submit"
                className="button w-full bg-cyan-500 hover:bg-cyan-400 text-white active:bg-cyan-600"
                variant={"outline"}
              >
                Save Changes
              </Button>
              <Button
                type="reset"
                className="button w-full bg-red-400 hover:bg-red-300 text-white active:bg-red-700 mt-auto"
                variant={"outline"}
                onClick={() => {
                  setProfilePic(null);
                  setRemovedPicture(false);
                  setDisplayNameEdit(true);
                  toast.success("Successfully reverted changes.")
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

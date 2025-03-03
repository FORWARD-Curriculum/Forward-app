import type { User } from "@/lib/userSlice";
import type { RootState } from "@/store";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenIcon, PenOffIcon } from "lucide-react";

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
  const user = useSelector((s: RootState) => s.user.user) as User;
  const [profile_pic, setProfilePic] = useState<File | null>();
  const [displayNameEdit, setDisplayNameEdit] = useState(true);

  const handleSubmit = async (e: any) => {
    e.preventDefault(); // Prevent the default form submission behavior
    const formData = new FormData(e.target);
    console.log(formData.get("display_name"));
  };

  return (
    <div className="">
      <form
        encType="multipart/form-data"
        className="flex items-center flex-col lg:flex-row bg-white gap-10 lg:bg-transparent justify-center w-screen gro h-full"
        onSubmit={handleSubmit}
      >
        <div className="lg:bg-white lg:rounded-3xl lg:w-fit lg:p-6 flex flex-col items-center">
          <h1 className="text-xl">Profile Overview</h1>
          <p>{user.displayName}</p>
          <div className="w-30 h-30 rounded-full border-1 border-solid border-gray-700 overflow-hidden flex justify-center items-center">
            {profile_pic || user.profilePicture ? (
              <img
                src={
                  (profile_pic ? URL.createObjectURL(profile_pic) : null) ||
                  user.profilePicture
                }
                className=" object-cover"
              />
            ) : (
              <p className="text-5xl font-light">
                {(user.displayName||"   ").substring(0, 2).toUpperCase()}
              </p>
            )}
          </div>
          <label htmlFor="pfp" className="mt-6">Change Picture</label>
          <Input
            type="file"
            id="pfp"
            multiple={false}
            className="w-30"
            onChange={(e) => {
              cropImageToSquare(e.target.files?.[0]).then((file) => {
                setProfilePic(file);
              });
            }}
            accept=".png, .jpg, .jpeg"
          />
        </div>
        <div className="lg:bg-white lg:rounded-3xl lg:w-fit lg:p-6 flex flex-col items-center">
          <label htmlFor="display_name">Display Name</label>
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
          <Button
            type="submit"
            className="button w-full bg-cyan-500 text-white active:bg-cyan-600"
            variant={"outline"}
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}

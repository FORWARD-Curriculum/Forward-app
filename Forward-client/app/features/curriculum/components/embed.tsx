import { useDispatch } from "react-redux";
import { useResponse } from "../hooks";
import { type Embed, type EmbedResponse } from "../types";
import type { AppDispatch } from "@/store";
import { saveCurrentResponseThunk } from "../slices/userLessonDataSlice";

export default function Embed({ embed }: { embed: Embed }) {
  const dispatch = useDispatch<AppDispatch>()
  const [response, setResponse] = useResponse<
    EmbedResponse,
    Embed
  >({
    activity: embed,
    trackTime: true,
    initialFields: { inputted_code: "", partial_response: embed.has_code },
  });
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <iframe
        src={embed.link}
        className="w-full aspect-[16/9]"
      />
      {embed.has_code && (
        <div>
          <p>Enter code to continue</p>
          <input
            value={response.inputted_code}
            className="border-secondary-foreground rounded-md border-2 p-2"
            onChange={(e) => {
              setResponse((o) => ({ ...o, inputted_code: e.target.value }));
            }}
          />
          <button className="text-primary-foreground bg-primary rounded-3xl p-2"
          onClick={()=>dispatch(saveCurrentResponseThunk())}>
            Submit code
          </button>
        </div>
      )}
    </div>
  );
}

import type {
  Identification,
  IdentificationResponse,
} from "@/features/curriculum/types";
import { useResponse } from "@/features/curriculum/hooks";
import type React from "react";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useEffect, useMemo, useState } from "react";


export default function Identification({
  identification,
}: {
  identification: Identification;
}) {
  const [response, setResponse] = useResponse<IdentificationResponse, Identification>({
    type: "Identification",
    activity: identification,
});
  const [numberClicked, setNumberClicked] = useState(response.partial_response?0:identification.minimum_correct);

  useEffect(()=>{
    setResponse(o=>({...o,partial_response: numberClicked < identification.minimum_correct}))
  },[numberClicked])

  // Memoize the Correct component to avoid re-creating it on every render
  const Correct = useMemo(() => {
    const Component: React.FC<React.HTMLAttributes<HTMLElement>> = ({
      children,
    }) => {
      const [clicked, setClicked] = useState(!response.partial_response);
      return (
        <span
          className={`${clicked ? "bg-yellow-400/80" : ""}`}
          onClick={() => {
            if (!clicked) setNumberClicked((o) => o + 1);
            setClicked(true);
          }}
        >
          {children}
        </span>
      );
    };
    return Component;
  }, []);

  return (
    <>
      <MarkdownTTS
        customComponents={{ correct: Correct}}
        controlsOrientation="horizontal"
        controlsClassName="flex flex-col"
        className="remark **:max-w-[100ch] !p-16 !pt-10"
      >
        {identification.content}
      </MarkdownTTS>
    </>
  );
}

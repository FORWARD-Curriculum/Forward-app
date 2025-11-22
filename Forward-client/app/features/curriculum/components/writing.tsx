import type { Writing, WritingResponse } from "@/features/curriculum/types";
import { useResponse } from "../hooks";
import MarkdownTTS from "@/components/ui/markdown-tts";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {debounce} from "@/utils/utils"

const mdPattern = /(\*\*|\n)/m;

const calcCount = (type: "char" | "word" | undefined, text: string) => {
  // if char its just str length, else split whitespace
  return type === "char"
    ? text.length
    : text.trim().length === 0
      ? 0
      : text.trim().split(/\s+/).length;
};

export function PromptArea({
  promptObj,
  responseMap,
  saveResp,
}: {
  promptObj: Writing["prompts"][0];
  responseMap: React.RefObject<
    Map<string, { resp: string; meets_minimum: boolean }>
  >;
  saveResp: () => void;
}) {
  const [textResponse, setTextResponse] = useState<string>(
    responseMap.current.get(promptObj.prompt)?.resp ?? "",
  );
  const [count, setCount] = useState<number>(
    calcCount(promptObj.min_type, textResponse),
  );
  const [mdDisplay] = useState(
    mdPattern.test(promptObj.prompt) ? "remark" : "",
  );

  const onType = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setTextResponse(text);
      const cCount = calcCount(promptObj.min_type, text);
      setCount(cCount);
      responseMap.current.set(promptObj.prompt, {
        resp: text,
        meets_minimum: cCount >= (promptObj.minimum ?? 0),
      });
      saveResp();
    },
    [setTextResponse, promptObj, responseMap, saveResp],
  );

  return (
    <div className="space-y-4">

      {promptObj.image && (
        <img 
          className="w-full max-w-md rounded-lg shadow-md"
          src={promptObj.image} 
          alt="Prompt visual" />
      )}
      <MarkdownTTS
        controlsClassName={`${mdDisplay} flex flex-col lg:flex-row-reverse grow justify-between`}
        controlsOrientation={"horizontal"}
      >
        {promptObj.prompt}
      </MarkdownTTS>
      <textarea
        className="field-sizing-content min-h-30 w-full max-w-full resize-y overflow-x-hidden rounded border border-gray-300 p-2 font-mono whitespace-pre-wrap"
        value={textResponse ?? ""}
        onChange={onType}
      />
      <div className="text-muted-foreground flex justify-end">
        {promptObj.minimum == 0 || promptObj.minimum == undefined ? (
          <span>Free Write!</span>
        ) : (
          <span>
            {count} / {promptObj?.minimum ?? 0}{" "}
            {promptObj.min_type === "char" ? "Characters" : "Words"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Writing({ writing }: { writing: Writing }) {
  const [realResponse, setRealResponse] = useResponse<WritingResponse, Writing>(
    {
      activity: writing,
      initialFields: {
        responses: writing.prompts.map((p) => ({
          prompt: p.prompt,
          response: "",
        })),
      },
    },
  );

  const debouncedSetRealResponse = useMemo(
    () =>
      debounce(
        (
          newResponses: WritingResponse["responses"],
          newAllMinsMet: boolean,
        ) => {
          setRealResponse((o) => ({
            ...o,
            responses: newResponses,
            partial_response:
              o.partial_response === false ? false : !newAllMinsMet,
          }));
        },
        500,
      ),
    [setRealResponse],
  );

  let responseMap = useRef(
    new Map<string, { resp: string; meets_minimum: boolean }>(
      realResponse.responses.map((o) => [
        o.prompt,
        { resp: o.response, meets_minimum: false },
      ]),
    ),
  );

  const saveResp = useCallback(() => {
    const rArray = Array.from(responseMap.current.entries());
    const newResponses: WritingResponse["responses"] = rArray.map((o) => ({
      prompt: o[0],
      response: o[1].resp,
    }));
    const allMinsMet = rArray.every((o) => o[1].meets_minimum);
    debouncedSetRealResponse(newResponses, allMinsMet);
  }, [debouncedSetRealResponse]);

  return (
    <div>
      {writing.prompts.map((po) => (
        <PromptArea
          key={po.prompt}
          promptObj={po}
          responseMap={responseMap}
          saveResp={saveResp}
        />
      ))}
    </div>
  );
}

import React, { useRef, useEffect } from "react";
import { useRemark } from "react-remarkify";
import { useSpeech, useVoices } from "react-text-to-speech";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import * as Popover from "./popover";
import { useSelector } from "react-redux";
import { type RootState } from "@/store";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "@/lib/utils";
import type { SpeechStatus } from "react-text-to-speech/types";
import { FileVolume, Play, Square } from "lucide-react";
import { sortEngFirst } from "@/routes/account";

export interface DefinitionProps extends React.HTMLAttributes<HTMLElement> {
  def?: string;
  node?: any;
}

export const Def: React.FC<DefinitionProps> = ({ def, children }) => {
  const user = useSelector((state: RootState) => state.user.user);
  return (
    <Popover.Popover>
      <Popover.PopoverTrigger className="text-accent underline">
        {children}
      </Popover.PopoverTrigger>
      <Popover.PopoverContent
        className={`${
          user?.preferences?.theme || ""
        } ${user?.preferences?.text_size || ""} bg-secondary text-secondary-foreground text-base`}
      >
        <MarkdownTTS className="flex flex-row-reverse items-end gap-2">
          <h1 className="text-xl font-bold">
            <span className="text-accent">
              Definition:<span className="text-[0px] opacity-0">.</span>
            </span>{" "}
            {typeof children == "string"
              ? children.at(0)?.toUpperCase() + children.substring(1)
              : children}
          </h1>
          <p>
            <span className="text-[0px] opacity-0">.</span>
            {def}
          </p>
        </MarkdownTTS>
      </Popover.PopoverContent>
    </Popover.Popover>
  );
};

export default function MarkdownTTS({
  controlsClassName,
  controlsOrientation = "vertical",
  children,
  className,
}: {
  controlsClassName?: ClassNameValue;
  className?: ClassNameValue;
  children: React.ReactNode;
  controlsOrientation?: "vertical" | "horizontal";
}) {
  const { voices } = useVoices();
  const renderedMarkdown = useRemark({
    markdown: typeof children == "string" ? children : "",
    rehypePlugins: [rehypeRaw],
    remarkPlugins: [remarkGfm],
    remarkToRehypeOptions: { allowDangerousHtml: true },
    rehypeReactOptions: {
      components: {
        def: Def,
      },
    },
  });
  const user = useSelector((state: RootState) => state.user.user);

  const speech = useSpeech({
    text: typeof children == "string" ? renderedMarkdown : children,
    highlightText: true,
    voiceURI: user?.preferences.speech_uri_index? sortEngFirst(voices).at(user?.preferences.speech_uri_index)?.voiceURI:"",
  });

  return (
    <div className={cn(className)}>
      <MarkdownTTSControls
        speech={speech}
        className={controlsClassName}
        orientation={controlsOrientation}
      />
      <TtsMDRenderer Text={speech.Text()} speechStatus={speech.speechStatus} />
    </div>
  );
}

export function MarkdownTTSControls({
  speech,
  className,
  orientation = "vertical",
}: {
  speech: ReturnType<typeof useSpeech>;
  className: ClassNameValue;
  orientation: "vertical" | "horizontal";
}) {
  useEffect(() => {
    console.log(speech.speechStatus, speech.isInQueue);
  }, [speech.speechStatus]);

  return (
    <div
      className={cn(
        className,
        `bg-background flex h-fit w-fit gap-2 rounded-full ${orientation == "vertical" ? "flex-col px-1 py-2" : "flex-row px-2 py-1"}`,
      )}
    >
      <FileVolume />
      {speech.speechStatus === "stopped" || speech.speechStatus == "paused" ? (
        <Play className="cursor-pointer" onClick={speech.start} />
      ) : (
        <Square className="cursor-pointer" onClick={speech.stop} />
      )}
    </div>
  );
}

function TtsMDRenderer({
  Text,
  speechStatus,
}: {
  Text: React.ReactNode;
  speechStatus: SpeechStatus;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contentRef.current) return;
    const detailsElems = contentRef.current.querySelectorAll("details");
    const summaryElems = contentRef.current.querySelectorAll("summary");

    detailsElems.forEach((details) => {
      if (speechStatus === "started") {
        // Force open and disable toggle
        details.setAttribute("open", "");
        details.ontoggle = () => {
          // Prevent any collapse by re-opening the element
          details.setAttribute("open", "");
        };
      } else {
        // Allow details to toggle normally again:
        details.ontoggle = null;
      }
    });

    summaryElems.forEach((summary) => {
      if (speechStatus === "started") {
        // Disable interactions on summary elements when speech is active.
        summary.style.pointerEvents = "none";
      } else {
        summary.style.pointerEvents = "auto";
      }
    });
  }, [speechStatus, contentRef, Text]);

  return (
    <div className="">
      {/* Wrap the rendered content in a ref container */}
      <div ref={contentRef}>{Text}</div>
    </div>
  );
}

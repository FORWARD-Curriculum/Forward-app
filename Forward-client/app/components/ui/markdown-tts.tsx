import React, { useRef, useEffect, type JSX, useState } from "react";
import { useRemark } from "react-remarkify";
import { visit } from "unist-util-visit";
import remarkDirective from "remark-directive";
import { useSpeech, useVoices } from "react-text-to-speech";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import * as Popover from "./popover";
import { useSelector } from "react-redux";
import { type RootState } from "@/store";
import type { ClassNameValue } from "tailwind-merge";
import { cn } from "@/utils/utils";
import type { SpeechStatus } from "react-text-to-speech/types";
import { FileVolume, Play, Square } from "lucide-react";
import { sortEngFirst } from "@/routes/protected/account";
import type { Components } from "hast-util-to-jsx-runtime";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
        <MarkdownTTS controlsClassName="flex gap-2">
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


function remarkCenterDirective() {
  return (tree: {type: string, children: any[]}) => {
    visit(tree, "containerDirective", (node) => {
      // Check if the directive name is 'center'
      if (node.name === "center") {
        // Ensure the node has a data property
        const data = node.data || (node.data = {});

        // Set the desired HTML tag name
        data.hName = "div";
        data.hProperties = { style: "text-align: center;" };

      }
    });
  };
}

function remarkColumnsDirective() {
  return (tree: { type: string; children: any[] }) => {
    visit(tree, "containerDirective", (node) => {
      const data = node.data || (node.data = {});
      if (node.name === "columns") {
        data.hName = "div";
        // Apply flex container styles
        data.hProperties = {
          style: "display: flex; gap: 1rem; flex-wrap: wrap;", // Added flex-wrap for responsiveness
        };
      } else if (node.name === "col") {
        data.hName = "div";
        // Apply flex item styles
        data.hProperties = {
          style: "flex: 1 1 0%; min-width: 0;", // Allow columns to grow/shrink, basis 0, prevent overflow
        };
      }
    });
  };
}


export default function MarkdownTTS({
  controlsClassName,
  controlsOrientation = "vertical",
  children,
  className,
  customComponents,
}: {
  controlsClassName?: ClassNameValue;
  className?: ClassNameValue;
  children: React.ReactNode;
  controlsOrientation?: "vertical" | "horizontal";
  customComponents?: Partial<Components>;
}) {
  const { voices } = useVoices();
  const renderedMarkdown = useRemark({
    markdown: typeof children == "string" ? children : "",
    rehypePlugins: [rehypeRaw],
    remarkPlugins: [remarkGfm, remarkDirective, remarkCenterDirective, remarkColumnsDirective],
    remarkToRehypeOptions: { allowDangerousHtml: true },
    rehypeReactOptions: {
      components: {
        def: Def,
        ...customComponents,
      },
    },
  });
  const user = useSelector((state: RootState) => state.user.user);

  const speech = useSpeech({
    text: typeof children == "string" ? renderedMarkdown : children,
    highlightText: true,
    rate: user?.preferences.speech_speed || 1,
    voiceURI: user?.preferences.speech_uri_index
      ? sortEngFirst(voices).at(user?.preferences.speech_uri_index)?.voiceURI
      : "",
  });

  return (
    <div className={cn(className)}>
      <div className={cn(controlsClassName)}>
        <MarkdownTTSControls
          speech={speech}
          orientation={controlsOrientation}
          customComponents={customComponents ? true : false}
        />
        <TtsMDRenderer
          Text={speech.Text()}
          speechStatus={speech.speechStatus}
        />
      </div>
    </div>
  );
}

export function MarkdownTTSControls({
  speech,
  className,
  orientation = "vertical",
  customComponents,
}: {
  speech: ReturnType<typeof useSpeech>;
  className?: ClassNameValue;
  orientation: "vertical" | "horizontal";
  customComponents: boolean;
}) {
  const [warned, setWarned] = useState(!customComponents);
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  // TODO: Pausing is not handled by library, at least as far as I can tell
  // useEffect(() => {console.log(warned,isWarningDialogOpen)},[warned,isWarningDialogOpen])
  return (
    <div
      className={cn(
        className,
        `remark bg-background flex h-fit w-fit gap-2 rounded-full ${orientation == "vertical" ? "flex-col px-1 py-2" : "flex-row px-2 py-1"}`,
      )}
    >
      <FileVolume />
      {speech.speechStatus === "stopped" || speech.speechStatus == "paused" ? (
        <Play
          className="cursor-pointer"
          onClick={() => {
            warned ? speech.start() : setIsWarningDialogOpen(true);
          }}
        />
      ) : (
        <Square className="cursor-pointer" onClick={speech.stop} />
      )}
      <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
        <DialogContent className="bg-secondary text-secondary-foreground border-1 border-secondary-border">
          <DialogHeader>
            <DialogTitle>Warning</DialogTitle>
            <DialogDescription>
              Any progress in the current activity will be lost if you start
              reading the text. Are you sure you want to continue with reading?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-evenly gap-5">
          <button
              className="bg-primary text-primary-foreground border-1 border-primary-border rounded px-4 py-2 w-full"
              onClick={() => {
                setWarned(true);
                setIsWarningDialogOpen(false);
                speech.start();
              }}
            >
              Yes
            </button>
            <button
              className="bg-error text-primary-foreground border-1 border-error-border rounded px-4 py-2 w-full"
              onClick={() => {
                setWarned(true);
                setIsWarningDialogOpen(false);
              }}
            >
              No
            </button>
          </div>
        </DialogContent>
      </Dialog>
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
      <div ref={contentRef} id="remark">{Text}</div>
    </div>
  );
}

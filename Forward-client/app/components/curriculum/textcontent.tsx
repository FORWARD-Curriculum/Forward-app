import type { TextContent } from "@/lib/lessonSlice";
import { useState, useRef, useEffect } from "react";
import { useRemark } from "react-remarkify";
import { useSpeech, useVoices } from "react-text-to-speech";
import { HiMiniStop, HiVolumeOff, HiVolumeUp } from "react-text-to-speech/icons";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { Def } from "../ui/definition";

function MarkdownText({ text }:{text: string}) {
  const { voices } = useVoices();
  const reactContent = useRemark({
    markdown: text,
    rehypePlugins: [rehypeRaw],
    remarkPlugins: [remarkGfm],
    remarkToRehypeOptions: { allowDangerousHtml: true },
    rehypeReactOptions:{
        components:{
            def: Def,
        }
    }
  });

  const { Text, speechStatus, start, pause, stop } = useSpeech({
    text: reactContent,
    highlightText: true,
    voiceURI: voices.at(101)?.voiceURI,
  });

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const detailsElems = contentRef.current.querySelectorAll("details");
    const summaryElems = contentRef.current.querySelectorAll("summary")

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
      <div className="flex space-x-4">
        <span role="button">
          {speechStatus !== "started" ? (
            <HiVolumeUp title="Start speech" onClick={start} />
          ) : (
            <HiVolumeOff title="Pause speech" onClick={pause} />
          )}
        </span>
        <span role="button">
          <HiMiniStop title="Stop speech" onClick={stop} />
        </span>
      </div>
      {/* Wrap the rendered content in a ref container */}
      <div ref={contentRef}>
        <Text />
      </div>
    </div>
  );
}


export default function TextContent({textContent}: {textContent: TextContent}) {
    return (
        <div className="markdown">
        <MarkdownText text={textContent.content}/>
        </div>
    );
}
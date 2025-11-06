import type {
  Twine as TwineType,
  TwineResponse,
} from "@/features/curriculum/types";
import { useResponse } from "@/features/curriculum/hooks";
import { useEffect, useState } from "react";
import type { p } from "node_modules/@react-router/dev/dist/routes-DHIOx0R9";
function escapeHTML(str: string) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
export default function Twine({ twine }: { twine: TwineType }) {
  const [response, setResponse] = useResponse<TwineResponse, TwineType>({
    type: "Twine",
    activity: twine,
    initialFields: {
      partial_response: true,
    },
  });

  const [iframeSrc, setIframeSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const imageRegex = /image:(https?:\/\/\S+)/g;
    const replacementPattern = escapeHTML(`
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin: -3em;
        margin-top: -1em;">
          <img src="$1" style="max-width: 30%;">
      </div>
      `);

    // Process the twine file content to replace the custom image syntax
    const processedHtml = twine.file?.replace(imageRegex, replacementPattern);

    // Create the Blob from the processed HTML
    const blob = new Blob([processedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setIframeSrc(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [twine.file]);

useEffect(() => {
  // End the activity when the Twine game ends
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === "twineEnd") {
      setResponse((prev) => ({ ...prev, partial_response: false }));
    }
  };

  window.addEventListener("message", handleMessage);

  return () => {
    window.removeEventListener("message", handleMessage);
  };
}, []);

  return (
    <iframe
      src={iframeSrc}
      className="min-h-160 rounded-2xl m-4"
      title="Twine Document"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
}
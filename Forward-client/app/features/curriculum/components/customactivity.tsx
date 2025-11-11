import type {
  CustomActivity as CustomActivityType,
  CustomActivityResponse,
} from "@/features/curriculum/types";
import { useResponse } from "@/features/curriculum/hooks";
import { useEffect, useMemo, useState } from "react";
function escapeHTML(str: string) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

const iframeResizeScript = `
  <script>
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const height = entries[0].target.scrollHeight;
        // Post a message to the parent window with the new height
        window.parent.postMessage({ type: 'iframeResize', height: height }, '*');
      }
    });
    resizeObserver.observe(document.body);
    window.addEventListener('load', () => {
      const initialHeight = document.body.scrollHeight;
      window.parent.postMessage({ type: 'iframeResize', height: initialHeight }, '*');
    });
  </script>
`;

export default function CustomActivity({
  custom_activity,
}: {
  custom_activity: CustomActivityType;
}) {
  const [_, setResponse] = useResponse<
    CustomActivityResponse,
    CustomActivityType
  >({
    type: "CustomActivity",
    activity: custom_activity,
    initialFields: {
      partial_response: true,
    },
  });

  const [patchedSrcDoc, setPatchedSrcDoc] = useState<string | undefined>(
    undefined,
  );

  const [iframeHeight, setIframeHeight] = useState<number | null>(null);

  const imageMap = useMemo(
    () => new Map(Object.entries(custom_activity.images)),
    [custom_activity.images],
  );

  useEffect(() => {
    fetch(custom_activity.document)
      .then((response) => response.text())
      .then((html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const images = doc.querySelectorAll("img");
        images.forEach((i) => {
          const src = i.getAttribute("src") || i.src;
          if (imageMap.has(src)) i.src = imageMap.get(src) as string;
        });
        doc.body.insertAdjacentHTML("beforeend", iframeResizeScript);
        setPatchedSrcDoc(doc.documentElement.innerHTML);
      })
      .catch((error) => {
        console.error("Error fetching or processing HTML:", error);
      });
  }, [custom_activity.document, custom_activity.images]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "iframeResize" && event.data.height) {
        setIframeHeight(event.data.height);
      }
      if (event.data?.type === "activityEnd") {
        setResponse((prev) => ({ ...prev, partial_response: false }));
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const iFrameLoaded: React.ReactEventHandler<HTMLIFrameElement> = (e) => {
    const iframe = e.target as HTMLIFrameElement;
    const sh = iframe.contentWindow?.document.body.scrollHeight;
    if (sh !== undefined) iframe.height = String(sh);
  };

  return (
    patchedSrcDoc && (
      <iframe
        srcDoc={patchedSrcDoc}
        style={{ height: iframeHeight ? `${iframeHeight}px` : "" }}
        className="m-4 min-h-160 rounded-2xl"
        title="Twine Document"
        onLoad={iFrameLoaded}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    )
  );
}

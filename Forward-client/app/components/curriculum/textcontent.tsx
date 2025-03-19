import type { TextContent } from "@/lib/lessonSlice";

export default function TextContent({textContent}: {textContent: TextContent}) {
    return (
        <div>
        <p>{textContent.content}</p>
        </div>
    );
}
import type { TextContent } from "@/lib/lessonSlice";
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function TextContent({textContent}: {textContent: TextContent}) {
    return (
        <div className="markdown">
        <Markdown rehypePlugins={[rehypeRaw]}>{textContent.content}</Markdown>
        </div>
    );
}
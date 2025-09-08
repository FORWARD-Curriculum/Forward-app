import type { FillInTheBlank, FillInTheBlankResponse } from "../types";
import { useResponse } from "../hooks";
import { useMemo } from "react";

interface FillInTheBlankProps {
    fillInTheBlank: FillInTheBlank;
}


export default function FillInTheBlank({fillInTheBlank}: FillInTheBlankProps){

    const parsedStuff = useMemo(() => {
        const optionsRegex = /<options([^>]*?)>(.*?)<\/options>/g;

        return fillInTheBlank.content.map(sentence =>{
            let rendered = sentence;

            rendered = rendered.replace(optionsRegex, (match, attributes, content) => {
                const options = content.split(',').map((s: string) => s.trim()).filter((s: string) => s);

                if (attributes.includes('keyword="true"')) {
                return '<input type="text" class="keyword-input" />'; 
                } else if (options.length > 0) {
                return '<select class="dropdown-input">...</select>'; 
                } else {
                return '<input type="text" class="freetext-input" />'; 
                }
            })

            return rendered
        })
    }, [fillInTheBlank.content]);


return (
    <div>
        <h2>{fillInTheBlank.title}</h2>
        {parsedStuff.map((renderedSentence, index) => (
            <div key={index}>
                {renderedSentence.split(/(<input[^>]*\/>|<select[^>]*>.*?<\/select>)/).map((part, partIndex) => {
                    if (part.includes('<input')) {
                        return <input key={partIndex} type="text" className="keyword-input" />;
                    } else if (part.includes('<select')) {
                        return <select key={partIndex} className="dropdown-input">...</select>;
                    } else {
                        return <span key={partIndex}>{part}</span>;
                    }
                })}
            </div>
        ))}
    </div>
)
}
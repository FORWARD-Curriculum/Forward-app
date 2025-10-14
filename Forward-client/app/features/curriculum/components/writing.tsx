import type { Writing, WritingResponse } from "@/features/curriculum/types";
import { useResponse } from "../hooks";

export default function Writing({writing}: {writing: Writing}) {

    const [response, setResponse] = useResponse<WritingResponse, Writing>({
        type: "Writing",
        activity: writing,
        initialFields: {
            responses: []
        }
    });


    return (
        <div>
        {writing.prompts.map((prompt, index) => (
            <div key={index} className="mb-4">
                <label className="block mb-2 font-bold">{prompt}</label>
                <textarea
                    className="w-full p-2 border border-gray-300 rounded whitespace-pre-wrap font-mono"
                    rows={4}
                    value={response.responses[index] || ""}
                    onChange={(e) => {
                        const newResponses = [...response.responses];
                        newResponses[index] = e.target.value;
                        setResponse((old) => ({
                            ...old,
                            responses: newResponses
                        }));
                    }}
                />
            </div>
        ))}
        </div>
    );
}
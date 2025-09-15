import type { FillInTheBlank, FillInTheBlankResponse } from "../types";
import { useResponse } from "../hooks";
import { useMemo, useState } from "react";

interface FillInTheBlankProps {
    fillInTheBlank: FillInTheBlank;
}

export default function FillInTheBlank({fillInTheBlank}: FillInTheBlankProps){

    // tracks amounts of options or blank inputs
    const totalBlanks = useMemo(() => {
        let count = 0;
        fillInTheBlank.content.forEach(sentence => {
            const matches = sentence.match(/options[^>]*?>.*?<\/options>/g);
            if (matches) count += matches.length;
        });
        return count;
    }, [fillInTheBlank.content]);

    const [userInputs, setUserInputs] = useState<string[]>(new Array(totalBlanks).fill("")); // Array size of blank user inputs
    const [validationResults, setValidationResults] = useState<("correct" | "incorrect" | null)[]>(new Array(totalBlanks).fill(null));
    const [lockedInputs, setLockedInputs] = useState<boolean[]>(new Array(totalBlanks).fill(false)); // Wish to lock messing with inputs when attempts run out

    //use response hoook, we cerate an array the size of the empty responses we have
    const[response, setResponse] = useResponse<FillInTheBlankResponse, FillInTheBlank>({
        type: "FillInTheBlank",
        activity: fillInTheBlank,
        initialFields: {
            submission: Array.from({ length: totalBlanks }, () => []),
            attempts_left: 3,
            partial_response: true,
        }
    });


    //variables to do with state management

    const { parsedSentences, optionsData } = useMemo(() => {
        const optionsRegex = /<options([^>]*?)>(.*?)<\/options>/g;
        const options: string[][] = []; // options are stored then given back when retriveing the correct jsx
        const answers: (string | string[] | null)[] = []; // the answers once parsed from the string will be stored here as comparison
        let optionCounter = 0;
        // should this be here
        let inputCounter = 0;
       
        const sentences = fillInTheBlank.content.map(sentence => {
            let rendered = sentence;
            rendered = rendered.replace(optionsRegex, (match, attributes, content) => {
                const opts = content.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                
                /** 
                 * this is a weird solution but basically I'm grabbing the data structure here
                 * 
                 * 
                 * "content": [  
                  "Cats are <options>an animal, a bird, a fish</options> that often are found in <options>homes, outdoor spaces</options>!", 
                  "The sky is <options keyword=\"true\">blue, clear, bright</options>",
                  "My favorite color is <options></options> and I like to eat <options></options> for breakfast."
                ]
                    parsing it and giving it an html structure associated since replace can only replace stuff with strings
                    storing the options
                    then in return doing another if else check and returning jsx depending on the html string found
                    maybe not the best solution
                 */
                
                if (attributes.includes('keyword="true"')) {
                    answers[inputCounter++] = opts;
                    return '<input type="text" class="keyword-input" />';
                } else if (opts.length > 0) {

                    // we have to parse out the * from the correct option in dropdowns
                    const correctOption = opts.find((opt: string) => opt.startsWith('*'));
                    answers[inputCounter++] = correctOption ? correctOption.subString(1) : null;

                    // remove *
                    const cleanOpts = opts.map((opt: string) => opt.startsWith('*') ? opt.substring(1) : opt);
                    options.push(cleanOpts);
                    return `<select class="dropdown-input" data-index="${optionCounter++}">...</select>`;
                } else {
                    answers[inputCounter++] = null // so any answer goes for this category
                    return '<input type="text" class="freetext-input" />';
                }
            });
            return rendered;
        });
       
        return {
            parsedSentences: sentences,
            optionsData: options,
            correctAnswers: answers
        };
    }, [fillInTheBlank.content]);


    const handleInputChange = (index: number, value: string) => {
        const newInputs = [...userInputs];
        newInputs[index] = value;
        setUserInputs(newInputs);
    }

    //test
    const handleCheck = () => {
        console.log("User inputs:", userInputs);

    };

    const handleReset = () => {
        setUserInputs(new Array(totalBlanks).fill(""));
        setValidationResults(new Array(totalBlanks).fill(null));
    };

   
    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold text-center mb-8">{fillInTheBlank.title}</h2>
            
        <div className="space-y-6">
            {(() => {
                let globalInputIndex = 0; // Move counter outside to persist across sentences
                
                return parsedSentences.map((renderedSentence, sentenceIndex) => {
                    const splitParts = renderedSentence.split(/(<input[^>]*\/>|<select[^>]*>.*?<\/select>)/);
                
                    return (
                        <div key={sentenceIndex} className="text-lg leading-relaxed text-center">
                            {splitParts.map((part, partIndex) => {
                                if (part.includes('<input')) {
                                    const currentIndex = globalInputIndex++; // ✅ Now this continues: 0,1,2,3,4...
                                    return (
                                        <input 
                                            key={partIndex} 
                                            type="text" 
                                            value={userInputs[currentIndex] || ''} // ✅ Connect to state
                                            onChange={(e) => handleInputChange(currentIndex, e.target.value)} // ✅ Handle changes
                                            disabled={lockedInputs[currentIndex]} // ✅ Add locking
                                            className="inline-block mx-1 px-3 py-2 border-2 border-muted rounded-lg focus:border-primary focus:outline-none bg-background min-w-[120px] text-center" 
                                        />
                                    );
                                }
                                else if (part.includes('<select')) {
                                    const currentIndex = globalInputIndex++; // ✅ Same global counter
                                    const indexMatch = part.match(/data-index="(\d+)"/);
                                    const optionsIndex = parseInt(indexMatch?.[1] || '0');
                                    const options = optionsData[optionsIndex] || [];
                            
                                    return (
                                        <select 
                                            key={partIndex} 
                                            value={userInputs[currentIndex] || ''} // ✅ Connect to state
                                            onChange={(e) => handleInputChange(currentIndex, e.target.value)} // ✅ Handle changes
                                            disabled={lockedInputs[currentIndex]} // ✅ Add locking
                                            className="inline-block mx-1 px-3 py-2 border-2 border-muted rounded-lg focus:border-primary focus:outline-none bg-background min-w-[120px] text-center"
                                        >
                                            <option value="">Choose...</option>
                                            {options.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    );
                                }
                                else {
                                    return <span key={partIndex}>{part}</span>;
                                }
                            })}
                        </div>
                    );
                });
            })()}
        </div>
            
            <div className="mt-12 flex justify-center gap-4">
                <button 
                    onClick={handleReset}
                    className="bg-accent text-secondary-foreground hover:bg-muted rounded-lg px-8 py-3 font-semibold shadow-sm border border-muted transition-colors">
                        Reset
                </button>
                <button 
                    onClick={handleCheck}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 py-3 font-semibold shadow-sm transition-colors">
                        Check Answers
                </button>
            </div>
        </div>
    );
}
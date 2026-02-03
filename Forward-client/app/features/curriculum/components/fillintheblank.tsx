import type { FillInTheBlank, FillInTheBlankResponse } from "../types";
import { useResponse } from "../hooks";
import { useMemo, useState, useEffect } from "react";
import FwdImage from "@/components/ui/fwdimage";

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

    //use response hoook, we cerate an array the size of the empty responses we have
    const[response, setResponse] = useResponse<FillInTheBlankResponse, FillInTheBlank>({
        activity: fillInTheBlank,
        initialFields: {
            submission: new Array(totalBlanks).fill(""),
            attempts_left: 3,
            partial_response: true,
        }
    });

    const [userInputs, setUserInputs] = useState<string[]>(new Array(totalBlanks).fill(""));


    // user input is first filled or checked from our useResponse hook
    // const [userInputs, setUserInputs] = useState<string[]>( response.submission.length > 0 ? response.submission :new Array(totalBlanks).fill("")); // Array size of blank user inputs
    const [validationResults, setValidationResults] = useState<("correct" | "incorrect" | null)[]>(new Array(totalBlanks).fill(null));
    const [lockedInputs, setLockedInputs] = useState<boolean[]>(new Array(totalBlanks).fill(false)); // Wish to lock messing with inputs when attempts run out


    //variables to do with state management

    const { parsedSentences, optionsData, correctAnswers } = useMemo(() => {
        const optionsRegex = /<options([^>]*?)>(.*?)<\/options>/g;
        const options: string[][] = []; // options are stored then given back when retriveing the correct jsx
        const answers: (string | string[] | null)[] = []; // the answers once parsed from the string will be stored here as comparison
        let optionCounter = 0;
        // should this be here
        let inputCounter = 0;
       
        const sentences = fillInTheBlank.content.map(sentence => {
            let rendered = sentence;
            rendered = rendered.replace(optionsRegex, (match, attributes, content) => {
                const delimiterText = content.replace(/,,/g, "@@PLACEHOLDER@@");
                const opts = delimiterText.split(',').map((s: string) => s.trim().replace(/@@PLACEHOLDER@@/g, ",")).filter((s: string) => s);
                
                /** 
                 * this is a weird solution but basically I'm grabbing the data structure here
                 * 
                 * 
                 * "content": [  
                  "Cats are <options>*an animal, a bird, a fish</options> that often are found in <options>*homes, outdoor spaces</options>!", 
                  "The sky is <options keyword=\"true\">blue, clear, bright</options>",
                  "My favorite color is <options></options> and I like to eat <options></options> for breakfast."
                ]
                    parsing it and giving it an html structure associated since replace can only replace stuff with strings
                    storing the options
                    then in return doing another if else check and returning jsx depending on the html string found
                    maybe not the best solution


                    Drop downs parse teh * in an answer as the corrcet answer
                    keywords will reference any of the options as a possible right answer
                    and empty options mean anything except a blank answer is accepted
                 */
                
                if (attributes.includes('keyword="true"')) {
                    answers[inputCounter++] = opts;
                    return '<input type="text" class="keyword-input" />';
                } else if (opts.length > 0) {

                    // we have to parse out the * from the correct option in dropdowns
                    const correctOption = opts.find((opt: string) => opt.startsWith('*'));
                    answers[inputCounter++] = correctOption ? correctOption.substring(1) : null;

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

    // Extract the validation logic into a reusable function
    const validateAnswers = (inputs: string[]): ("correct" | "incorrect" | null)[] => {
        const newValidationResults: ("correct" | "incorrect" | null)[] = new Array(totalBlanks).fill(null);
        
        inputs.forEach((userInput, index) => {
            const correctAnswer = correctAnswers[index];
            let isCorrect = false;
            
            if (correctAnswer === null) {
                isCorrect = userInput.trim() !== "";
            } else if (Array.isArray(correctAnswer)) {
                const trimmedInput = userInput.trim().toLowerCase();
                isCorrect = correctAnswer.some(keyword => 
                    keyword.toLowerCase() === trimmedInput
                );
            } else {
                isCorrect = userInput.trim() === correctAnswer.trim();
            }
            
            newValidationResults[index] = isCorrect ? "correct" : "incorrect";
        });
        
        return newValidationResults;
    };
    
    // when there is a refresh this is used to update values that were changed previously 
    useEffect(() => {
        if (response.submission && response.submission.length > 0){
            setUserInputs(response.submission);
            
            if (response.attempts_left <= 0){
                setLockedInputs(new Array(totalBlanks).fill(true));
                setValidationResults(validateAnswers(response.submission));
            }
        }
    }, [response.id, totalBlanks, correctAnswers]);

    const handleInputChange = (index: number, value: string) => {
        const newInputs = [...userInputs];
        newInputs[index] = value;
        setUserInputs(newInputs);
    }

    const handleCheck = () => {
        const newValidationResults = validateAnswers(userInputs);
        setValidationResults(newValidationResults);
        
        const allCorrect = !newValidationResults.includes("incorrect");
        
        setResponse(prev => ({
            ...prev,
            submission: userInputs,
            attempts_left: allCorrect ? 0 : prev.attempts_left - 1,
            partial_response: allCorrect ? false : prev.attempts_left - 1 > 0
        }));
        if (!allCorrect && response.attempts_left - 1 <= 0) {
            setLockedInputs(new Array(totalBlanks).fill(true));
        }
    };

    // not allowing the amount of tries to be rest to 3 when clicked, but the ui is updated
    // so all fields become empty
    const handleReset = () => {
        setUserInputs(new Array(totalBlanks).fill(""));
        setValidationResults(new Array(totalBlanks).fill(null));
        setLockedInputs(new Array(totalBlanks).fill(false));
        setResponse(prev => ({
            ...prev,
            submission: new Array(totalBlanks).fill(""),
            partial_response: true,
        }));
    };

    return (
        <div className="max-w-4xl mx-auto p-6">

            
            {fillInTheBlank.image && (
                <div className="mb-6 flex justify-center">
                <FwdImage image={fillInTheBlank.image} className="w-full max-w-lg mx-auto rounded-lg shadow-sm border border-muted object-cover"/>
                </div>
            )}
            
            <div className="space-y-6">
                {(() => {
                    let globalInputIndex = 0;
                    
                    return parsedSentences.map((renderedSentence, sentenceIndex) => {
                        const splitParts = renderedSentence.split(/(<input[^>]*\/>|<select[^>]*>.*?<\/select>)/);
                    
                        return (
                            <div key={sentenceIndex} className="flex flex-wrap items-center justify-start gap-2 text-lg leading-relaxed bg-foreground border border-muted rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
                                {splitParts.map((part, partIndex) => {
                                    if (part.includes('<input')) {
                                        const currentIndex = globalInputIndex++;
                                        return (
                                            <textarea 
                                                key={partIndex} 
                                                // type="text" 
                                                value={userInputs[currentIndex] || ''}
                                                onChange={(e) => handleInputChange(currentIndex, e.target.value)}
                                                disabled={lockedInputs[currentIndex]}
                                                className={`px-3 py-2 border-2 rounded-lg focus:outline-none bg-background min-w-[120px] text-center ${
                                                    validationResults[currentIndex] === 'correct' ? 'border-green-500 bg-green-50' : 
                                                    validationResults[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50' : 
                                                    'border-muted focus:border-primary'
                                                } resize-x h-12 overflow-y-clip whitespace-nowrap overflow-x-hidden field-sizing-content`}
                                                rows={1}
                                            />
                                        );
                                    }
                                    else if (part.includes('<select')) {
                                        const currentIndex = globalInputIndex++;
                                        const indexMatch = part.match(/data-index="(\d+)"/);
                                        const optionsIndex = parseInt(indexMatch?.[1] || '0');
                                        const options = optionsData[optionsIndex] || [];
                                
                                        return (
                                            <select 
                                                key={partIndex} 
                                                value={userInputs[currentIndex] || ''}
                                                onChange={(e) => handleInputChange(currentIndex, e.target.value)}
                                                disabled={lockedInputs[currentIndex]}
                                                className={`px-3 py-2 border-2 rounded-lg focus:outline-none bg-background min-w-[120px] text-center ${
                                                    validationResults[currentIndex] === 'correct' ? 'border-green-500 bg-green-50' : 
                                                    validationResults[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50' : 
                                                    'border-muted focus:border-primary'
                                                }`}
                                            >
                                                <option value="">Choose...</option>
                                                {options.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        );
                                    }
                                    else {
                                        return <span key={partIndex} className=" break-words">{part}</span>;
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
                    disabled={response.attempts_left <= 0}
                    className="bg-accent text-secondary-foreground hover:bg-muted rounded-lg px-8 py-3 font-semibold shadow-sm border border-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Reset
                </button>
                <button 
                    onClick={handleCheck}
                    disabled={response.attempts_left <= 0}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 py-3 font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Check Answers ({response.attempts_left}/3)
                </button>
            </div>
        </div>
    );
}
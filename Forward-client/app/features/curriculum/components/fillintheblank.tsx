import type { FillInTheBlank, FillInTheBlankResponse } from "../types";
import { useResponse } from "../hooks";
import { useMemo, useState, useEffect } from "react";

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
        type: "FillInTheBlank",
        activity: fillInTheBlank,
        initialFields: {
            submission: new Array(totalBlanks).fill(""),
            attempts_left: 3,
            partial_response: true,
        }
    });

    const [userInputs, setUserInputs] = useState<string[]>(new Array(totalBlanks).fill(""));

    useEffect(() => {
        if (response.submission && response.submission.length > 0){
            setUserInputs(response.submission);

            if (response.attempts_left <= 0){
                setLockedInputs(new Array(totalBlanks).fill(true));
            }
        }
    }, [response.id, totalBlanks]);

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
                const opts = content.split(',').map((s: string) => s.trim()).filter((s: string) => s);
                
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


    const handleInputChange = (index: number, value: string) => {
        const newInputs = [...userInputs];
        newInputs[index] = value;
        setUserInputs(newInputs);
    }

    const handleCheck = () => {
        const newValidationResults: ("correct" | "incorrect" | null)[] = [...validationResults];
        let allCorrect = true;

        // Loop through each user input
        userInputs.forEach((userInput, index) => {
            const correctAnswer = correctAnswers[index];
            let isCorrect = false;

            if (correctAnswer === null) {
                // Free text --> any answer is accepted
                isCorrect = userInput.trim() !== ""; // As long as they typed something
            } else if (Array.isArray(correctAnswer)) {
                // Keyword matchings
                const trimmedInput = userInput.trim().toLowerCase();
                isCorrect = correctAnswer.some(keyword => 
                    keyword.toLowerCase() === trimmedInput
                );
            } else {
                // Dropdown, exact match with the correct option (the one that had *)
                isCorrect = userInput.trim() === correctAnswer.trim();
            }

            newValidationResults[index] = isCorrect ? "correct" : "incorrect";
            if (!isCorrect) allCorrect = false;
        });

        // Update validation results
        setValidationResults(newValidationResults);

    
        setResponse(prev => ({
            ...prev,
            submission: userInputs,
            attempts_left: allCorrect ? 0 : prev.attempts_left - 1,
            partial_response: allCorrect ? false : prev.attempts_left - 1 > 0
        }));

        // If no attempts left, lock all inputs
        if (!allCorrect && response.attempts_left - 1 <= 0) {
            setLockedInputs(new Array(totalBlanks).fill(true));
        }
    };

    // Just resets all answers blank so the student can start fresh
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
                                    const currentIndex = globalInputIndex++;
                                    return (
                                        <input 
                                            key={partIndex} 
                                            type="text" 
                                            value={userInputs[currentIndex] || ''}
                                            onChange={(e) => handleInputChange(currentIndex, e.target.value)}
                                            disabled={lockedInputs[currentIndex]}
                                            className={`inline-block mx-1 px-3 py-2 border-2 rounded-lg focus:outline-none bg-background min-w-[120px] text-center ${
                                                validationResults[currentIndex] === 'correct' ? 'border-green-500 bg-green-50' : 
                                                validationResults[currentIndex] === 'incorrect' ? 'border-red-500 bg-red-50' : 
                                                'border-muted focus:border-primary'
                                            }`}
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
                                            className={`inline-block mx-1 px-3 py-2 border-2 rounded-lg focus:outline-none bg-background min-w-[120px] text-center ${
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
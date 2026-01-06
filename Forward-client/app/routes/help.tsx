import { Link } from "react-router";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion-faq";

export default function Help(){
    const user = useSelector((state: RootState) => state.user.user);
    
    return (
        <div className={`max-w-6xl mx-auto w-full px-6 py-5 text-secondary-foreground bg-foreground ${user?.preferences?.text_size || ""}`}>
            
            <img 
                src="/info-images/navigation.jpg" 
                alt="Navigation guide" 
                className="w-full max-w-2xl mx-auto rounded-lg my-6"
            />
            <h4 className="text-accent text-right">Help</h4>
            
            <h1 className="text-4xl font-black text-accent mb-6">Help & Navigation Guide</h1>
                
                <div className="space-y-4 w-full">
                   <Accordion type="multiple" className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-xl font-bold">
                        How do I start a lesson and know what I've finished?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                          <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            From your dashboard, choose a lesson to begin. Your progress bar to the right of the lesson list will show which lessons you've completed.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-xl font-bold">
                        Can I do the lessons in any order?
                        </AccordionTrigger>
                      <AccordionContent>
                       <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                         <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Yes! Lessons can be completed in any order.
                        </p>
                       </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                     <AccordionTrigger className="text-xl font-bold">
                        How do I move between pages?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                          <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Use the Save and Continue or Back buttons at the bottom of the page, or use the table of contents.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger className="text-xl font-bold">
                        Why are some pages unavailable in the table of contents?
                      </AccordionTrigger>
                      <AccordionContent>
                      <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Pages unlock only after you finish earlier pages. Complete the previous activity to open the next one.
                        </p>
                      </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                      <AccordionTrigger className="text-xl font-bold">
                        Can I go back to a lesson I've already completed?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Yes. You can review completed lessons at any time. Your answers are saved and can be viewed, but not changed. You can rewatch videos and reread content.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-6">
                     <AccordionTrigger className="text-xl font-bold">
                        Why can't I change my answers?
                      </AccordionTrigger>
                      <AccordionContent>
                       <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                         <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Once you submit an activity or use all allowed attempts, answers are locked. This helps you practice making thoughtful choices the first time.
                        </p>
                       </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-7">
                      <AccordionTrigger className="text-xl font-bold">
                        What if my answers disappear?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                          <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Your work saves when you click Save and Continue. If something doesn't save, tell your facilitator as soon as possible. On rare occasions, you may need to complete an activity again.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-8">
                      <AccordionTrigger className="text-xl font-bold">
                        Why doesn't the Save and Continue button show?
                        </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <div className="space-y-2">
                        <p className="text-base">
                            If the button is missing, there is still something to finish on the page. Check the activity type below:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-base ml-4">
                          <li><strong>Sliders:</strong> Move each slider at least once. If you want it at 0, move it away first, then back.</li>
                          <li><strong>Writing:</strong> Some writing pages require a minimum number of words or characters. Your count shows in the bottom right as you type.</li>
                          <li><strong>Quiz:</strong> Click Check Answer for every question. Use the dots or Prev/Next buttons to move through the quiz.</li>
                          <li><strong>Twine:</strong> You must reach an ending in the story before moving on. Keep reading and making choices.</li>
                          <li><strong>Video:</strong> You must watch the entire video before continuing.</li>
                          <li><strong>Slideshow:</strong> Some slides require you to stay on them for a short time so you can read the content.</li>
                          <li><strong>Identification:</strong> Follow the instructions and click the correct spots on the image.</li>
                        </ul>
                        </div>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-9">
                      <AccordionTrigger className="text-xl font-bold">
                        How do I see feedback on my answers?
                      </AccordionTrigger>
                      <AccordionContent>
                       <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                         <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            After submitting, look for pop-ups, highlights, or notes under the question. This is your feedback. Ask your facilitator if anything is unclear.
                        </p>
                       </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-10">
                      <AccordionTrigger className="text-xl font-bold">
                        How do I play videos?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                         <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Click the play button in the video window. If it doesn't start, refresh the page and try again.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-11">
                      <AccordionTrigger className="text-xl font-bold">
                        Why can't I skip ahead in videos?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Videos include important information. Watching the full video helps you understand the lesson before moving on.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-12">
                      <AccordionTrigger className="text-xl font-bold">
                        What if I can't hear the audio?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Check your volume and headphones. If audio still doesn't work, tell your facilitator.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-13">
                      <AccordionTrigger className="text-xl font-bold">
                        What if something won't load or isn't working right?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            First, refresh the page. If the problem continues, tell your facilitator. You can also report a bug by clicking the bug icon in the bottom right and describing what went wrong.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-14">
                      <AccordionTrigger className="text-xl font-bold">
                        I'm confused about the page I'm on. What am I supposed to do?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Read or listen to all the text on the page—it explains what to do. If you are still unsure, ask your facilitator.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-15">
                      <AccordionTrigger className="text-xl font-bold">
                        There's so much to read! Do I really have to read it all?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Yes, the content is important—but you don't have to read it all yourself. You can listen to the text by clicking the play button next to it.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>
                   </Accordion>
                </div>
        </div>
    );
}
import { Link } from "react-router";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion-faq";

export default function StudentFAQ(){
    const user = useSelector((state: RootState) => state.user.user);
    
    return (
        <div className={`max-w-6xl mx-auto w-full px-6 py-5 text-secondary-foreground bg-foreground ${user?.preferences?.text_size || ""}`}>

            <img 
                src="/info-images/faq.jpg" 
                alt="Young Adults chilling by a buildings curb" 
                className="w-full max-w-2xl mx-auto rounded-lg my-6"
            />
            <h4 className="text-accent text-right">Student FAQ</h4>
            
            <h1 className="text-4xl font-black text-accent mb-6">FORWARD Student FAQ</h1>
                
                <div className="space-y-4 w-full">
                   <Accordion type="multiple" className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-xl font-bold">
                        What is FORWARD?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                          <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            FORWARD is a set of lessons designed to help you plan for school, work, and life after your current program. 
                            You'll build skills for speaking up for yourself, making choices, and setting goals that matter to you.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-xl font-bold">
                        Do these lessons affect my placement or program?
                        </AccordionTrigger>
                      <AccordionContent>
                       <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                         <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            No. FORWARD does not change your placement, length of stay, or program level. It is only a learning tool to help you prepare for the future.
                        </p>
                       </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                     <AccordionTrigger className="text-xl font-bold">
                        Who sees my answers?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                          <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Most of the time, only you see your answers. If your facility is part of the FORWARD research project and you agreed to be in the study when you took the survey, 
                            then researchers at Arizona State University can see your answers. You can review that agreement <a href="/assent" className="text-accent hover:underline">here</a>. 
                            Your answers are used for learning and research.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger className="text-xl font-bold">
                        Why aren't there grades?
                      </AccordionTrigger>
                      <AccordionContent>
                      <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            FORWARD is not about scores or grades. It is about learning and growth. We want you to think honestly, try new ideas, and reflect—without worrying about getting something "wrong."
                        </p>
                      </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5">
                      <AccordionTrigger className="text-xl font-bold">
                        What if I don't know the answer to something?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            That's normal. These lessons are about learning, not perfection. Try your best and think about what makes sense for you. 
                            Many questions do not have right or wrong answers—they are about your thoughts and experiences. If an activity has correct answers, it will say so in the instructions.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-6">
                     <AccordionTrigger className="text-xl font-bold">
                        Why can't I complete activities unlimited times?
                      </AccordionTrigger>
                      <AccordionContent>
                       <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                         <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Some activities limit attempts so you can focus and give your best effort. The goal is to practice decision-making and problem-solving, 
                            not to repeat the same activity over and over.
                        </p>
                       </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-7">
                      <AccordionTrigger className="text-xl font-bold">
                        What if I make a mistake in an activity?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                          <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Mistakes are part of learning. You will still get feedback or chances to reflect, even if you can't redo the activity.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>
                   </Accordion>
                </div>

            <div className="border-t border-muted pt-8 mt-8">
                <div className="space-y-4 w-full">
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="item-8">
                      <AccordionTrigger className="text-xl font-bold">
                        Why do some questions ask about my future?
                        </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Your future matters. These questions help you think about what's important to you, what you want, and what steps can help you move forward when you leave this program.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-9">
                      <AccordionTrigger className="text-xl font-bold">
                        Can my answers help me in real life?
                      </AccordionTrigger>
                      <AccordionContent>
                       <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                         <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Yes. You can use what you write in FORWARD to talk with teachers, counselors, employers, or family members about your goals and what support you need.
                        </p>
                       </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-10">
                      <AccordionTrigger className="text-xl font-bold">
                        What if the lesson feels hard?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                         <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Some topics may feel new or challenging. Take your time, reread instructions, and ask your facilitator for help. No one expects you to already know everything.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-11">
                      <AccordionTrigger className="text-xl font-bold">
                        What if I want to learn more about a topic?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            Ask a trusted adult such as your facilitator, teacher, staff member, or parent. Your facilitator also has extra resources to support your learning. 
                            Asking questions is part of learning—and FORWARD encourages it.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
            </div>
        </div>
    );
}
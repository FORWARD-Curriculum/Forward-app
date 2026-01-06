import { Link } from "react-router";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function ResearchEvidence(){
    const user = useSelector((state: RootState) => state.user.user);
    return (
        <div className={`max-w-6xl mx-auto px-6 py-5 text-secondary-foreground bg-foreground ${user?.preferences?.text_size || ""}`}>
            <h4 className="text-accent text-right">Evidence Based</h4>
            
            <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                <h1 className="text-4xl font-black text-accent mb-6">Research & Evidence Based</h1>
                <span className="text-[0px] opacity-0">.</span>
                
                <img 
                    src="/info-images/research_and_evidence.jpg" 
                    alt="Research and Evidence" 
                    className="w-full max-w-2xl mx-auto rounded-lg my-6"
                />

                <p className="mb-6 text-base">
                    FORWARD is built using research and real evidence. This means the lessons are based on studies, data, and real experiences that show what helps students succeed. 
                    The activities are not based on guesses or opinions. They are designed using strategies that have been shown to work.
                </p>
                
                <p className="mb-6 text-base">
                    Researchers study skills such as planning, communication, decision-making, and goal setting. FORWARD uses this research to create lessons that connect to school, work, 
                    and everyday life. The focus is on building skills that support success during and after a program.
                </p>
                
                <p className="mb-6 text-base">
                    Research-based lessons help ensure that time is spent on meaningful learning. The activities are designed to support thinking, practice, and growth. 
                    Many students in similar programs have benefited from these types of strategies.
                </p>

                <p className="mb-6 text-base">
                    FORWARD is also part of an ongoing research process. Feedback from students, educators, and staff is used to improve lessons over time. 
                    This helps keep the program effective, clear, and supportive.
                </p>
            </MarkdownTTS>


            <div className="text-right mt-8">
                <Link to={"/"} className="bg-primary hover:brightness-90 text-primary-foreground px-4 py-2 rounded">
                    Back to Home
                </Link>
            </div>
        </div>
    )
}
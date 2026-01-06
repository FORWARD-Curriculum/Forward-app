import { Link } from "react-router";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

export default function UniversalDesign() {
    const user = useSelector((state: RootState) => state.user.user);
    
    return (
        <div className={`max-w-6xl mx-auto px-6 py-5 text-secondary-foreground bg-foreground ${user?.preferences?.text_size || ""}`}>
            <h4 className="text-accent text-right">About FORWARD</h4>
            
            <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                <h1 className="text-4xl font-black text-accent mb-6">Universal Design for Transition</h1>
                <span className="text-[0px] opacity-0">.</span>
                
                <img 
                    src="/info-images/land.jpg" 
                    alt="Landscape view" 
                    className="w-full max-w-2xl mx-auto rounded-lg my-6"
                />
                
                <p className="mb-6 text-base">
                    Universal Design for Transition means creating lessons that work for many different learners. Students have different strengths, needs, and goals, 
                    and FORWARD is designed to support a wide range of learning styles and experiences.
                </p>
                
                <p className="mb-6 text-base">
                    This approach includes clear instructions, simple language, and multiple ways to learn. Lessons may include reading, videos, interactive activities, 
                    and reflection. The program is designed so learning does not depend on just one method.
                </p>
                
                <p className="mb-6 text-base">
                    Transition focuses on preparing for life after a current program. This may include education, employment, training, or independent living. 
                    FORWARD supports this process by helping students practice skills that are useful for future planning and decision-making.
                </p>
                
                <p className="mb-8 text-base">
                    Universal Design for Transition works to reduce barriers to learning. Instead of expecting students to adjust to a single system, the program is 
                    designed to be flexible and supportive. This approach promotes confidence, access, and preparation for next steps.
                </p>
            </MarkdownTTS>
            
            <div className="text-right mt-8">
                <Link to={"/"} className="bg-primary hover:brightness-90 text-primary-foreground px-4 py-2 rounded">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}
import { Shield } from "lucide-react";
import MarkdownTTS from "@/components/ui/markdown-tts";

export default function Ferpa(){
    return(
        <div className="w-full bg-gradient-to-br from-accent/10 to-accent/5 min-h-screen">
            <div className="max-w-4xl mx-auto px-6 py-12">
                
                
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-4">
                        <Shield className="w-12 h-12 text-accent" />
                    </div>
                    <h1 className="text-5xl font-black text-secondary-foreground mb-4">
                        FERPA Statement
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Your privacy and data protection information
                    </p>
                </div>

                
                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                    <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4 mb-6">
                        <h2 className="text-3xl font-black mb-6">FORWARD FERPA Statement</h2>
                        <span className="text-[0px] opacity-0">.</span>
                        
                        <p className="mb-6">
                            The FORWARD program respects and protects the privacy of all student information shared during 
                            participation. Any educational records or personally identifiable information (PII) provided by students 
                            or collected through the FORWARD platform are handled in accordance with the <strong>Family Educational 
                            Rights and Privacy Act (FERPA)</strong>.
                        </p>

                        <div className="markdown mb-6">
                            <ul>
                                <li>Student information is used only to support educational planning, instruction, evaluation, and 
                                program improvement.</li>
                                
                                <li>Data shared with FORWARD is kept confidential and is accessible only to authorized school 
                                personnel, approved FORWARD researchers (as applicable under IRB), and individuals with a 
                                legitimate educational interest.</li>
                                
                                <li>No personally identifiable student information will ever be shared outside the school or research 
                                team without written consent from the student's parent/guardian (or the student, if legally able to 
                                provide consent), unless permitted by law under a FERPA exception.</li>
                                
                                <li>Any reports or publications resulting from program data will use aggregated or de-identified 
                                information so that individual students cannot be identified.</li>
                            </ul>
                        </div>

                        <p className="mb-0">
                            FORWARD is committed to creating a supportive, empowering learning environment—and keeping 
                            student information safe is a key part of that commitment.
                        </p>
                    </MarkdownTTS>
                </div>
            </div>
        </div>
    )
}
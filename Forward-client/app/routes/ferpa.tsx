import MarkdownTTS from "@/components/ui/markdown-tts";
import { Shield } from "lucide-react";

export default function Ferpa(){
    return(
        <div className="w-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-accent/5 relative overflow-hidden p-6">
      <div className="max-w-4xl mx-auto relative z-10">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-accent" />
          </div>
          <h1 className="text-5xl font-black text-transparent bg-gradient-to-r from-secondary-foreground via-secondary-foreground to-muted-foreground bg-clip-text leading-tight mb-4">
            FERPA Statement
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your privacy and data protection information
          </p>
        </div>

        <div className="bg-secondary/60 backdrop-blur-sm rounded-2xl border border-secondary-border shadow-lg hover:shadow-xl transition-all duration-300 p-8">
          <MarkdownTTS 
            controlsClassName="mb-6 flex gap-2"
            className="remark"
          >
            {`# FORWARD FERPA Statement

            The FORWARD program respects and protects the privacy of all student information shared during participation. Any educational records or personally identifiable information (PII) provided by students or collected through the FORWARD platform are handled in accordance with the **Family Educational Rights and Privacy Act (FERPA)**.

            - Student information is used only to support educational planning, instruction, evaluation, and program improvement.

            - Data shared with FORWARD is kept confidential and is accessible only to authorized school personnel, approved FORWARD researchers (as applicable under IRB), and individuals with a legitimate educational interest.

            - No personally identifiable student information will ever be shared outside the school or research team without written consent from the student's parent/guardian (or the student, if legally able to provide consent), unless permitted by law under a FERPA exception.

            - Any reports or publications resulting from program data will use aggregated or de-identified information so that individual students cannot be identified.

            FORWARD is committed to creating a supportive, empowering learning environment—and keeping student information safe is a key part of that commitment.`}
          </MarkdownTTS>
        </div>
      </div>
        </div>
    )
}
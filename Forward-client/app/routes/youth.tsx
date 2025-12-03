import { Link } from "react-router";
import MarkdownTTS from "@/components/ui/markdown-tts";

export default function youth(){
    return (
        <div className="max-w-6xl mx-auto px-6 py-5 text-secondary-foreground">
            <h4 className="text-accent text-right">For youth</h4>
            
            <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                <h1 className="text-4xl font-black text-accent mb-6">Welcome to FORWARD!</h1>
                <span className="text-[0px] opacity-0">.</span>
                <p className="mb-6">We're glad you're here. This website is all about helping you get ready for what's next — whether that's going back to school, getting a job, or living more on your own.</p>
                
                <p className="mb-8">
                    <strong>FORWARD</strong> stands for <strong>Facilitating Opportunities for Reentry, Workforce, and Academic Readiness for Youth with Disabilities in Juvenile Justice</strong> — but you don't need to remember all that. 
                    Just know that FORWARD is here to help you move forward in life with confidence and new skills.
                </p>
                
                <img 
                    src="/about_page/chilling.jpg" 
                    alt="Young Adults chilling by a buildings curb" 
                    className="w-full max-w-2xl mx-auto rounded-lg my-6"
                />
            </MarkdownTTS>

            {/* paragraph two */}
            <div className="border-t border-muted pt-8">
                <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                    <h3 className="text-2xl font-black mb-6">What is FORWARD?</h3>
                    <span className="text-[0px] opacity-0">.</span>

                    <p className="mb-6">
                        FORWARD is a web-based program made just for youth like you. It's designed to help you get ready for the big changes that can happen when leaving a program 
                        or becoming an adult — things like going to school, getting a job, or living on your own.
                    </p>

                    <p className="mb-4">You'll work through fun, interactive lessons about real-life topics. The lessons are built with your needs in mind, including:</p>

                    <div className="markdown mb-6">
                        <ul>
                            <li>Easy-to-read text</li>
                            <li>Videos with captions</li>
                            <li>Images with descriptions</li>
                            <li>Tools to read text out loud</li>
                            <li>Choices about how you want to learn</li>
                        </ul>
                    </div>
                    
                    <p className="mb-6">
                        You'll also get to decide what to learn first. Want to learn about money before college? Go for it. Curious about how to talk to a boss or teacher? 
                        You can start there. You're in charge of your learning.
                    </p>
                    
                    <img 
                        src="/about_page/happy_students.jpg" 
                        alt="Young Adults huddled, staring down happy" 
                        className="w-full max-w-2xl mx-auto rounded-lg my-6"
                    />
                </MarkdownTTS>
            </div>

            {/* section 3 */}
            <div className="border-t border-muted pt-8 mt-8">
                <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                    <h3 className="text-2xl font-black mb-6">What Will I Learn?</h3>
                    <span className="text-[0px] opacity-0">.</span>
                    
                    <p className="mb-4">There are <strong>five lessons</strong> in FORWARD right now:</p>

                    <div className="markdown mb-6">
                        <ol>
                            <li><strong>Going to College</strong> – Learn what it takes to apply and succeed in school after high school.</li>
                            <li><strong>Communication & Disclosure</strong> – Improve your communication skills and learn how to talk about hard or complicated topics with different people.</li>
                            <li><strong>Personal Finances</strong> – Learn about saving, spending, and other money related topics</li>
                            <li><strong>Self-Advocacy</strong> – Build the skills to speak up for yourself and your future.</li>
                            <li><strong>Soft Skills</strong> – Practice teamwork, problem solving, and showing up strong at school, work, or in your personal life.</li>
                        </ol>
                    </div>

                    <p className="mb-8">
                        Each lesson has activities like quizzes, games, choose-your-own-path stories, matching, video examples, and more. 
                        You'll get to explore topics your way and at your pace.
                    </p>
                    
                    <img 
                        src="/about_page/thumbs_up.jpg" 
                        alt="People smiling giving a thumbs up" 
                        className="w-full max-w-2xl mx-auto rounded-lg my-6"
                    />
                    </MarkdownTTS>
                </div>
            

            <div className="mt-8">
                <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                    <h3 className="text-2xl font-black mb-6">Why FORWARD?</h3>
                     <span className="text-[0px] opacity-0">.</span>
                    
                    <p className="mb-8">
                        We created FORWARD because we know you have big goals and a bright future. But we also know that transitions — like reentering your community, 
                        finishing school, or getting your first job — can be tough. FORWARD is here to make things a little easier by giving you the tools, knowledge, 
                        and support to reach your goals.
                    </p>
                    
                    <p className="mb-8">
                        Everything on this site is made to work for different learning styles, reading levels, and support needs. Whether you have a disability, 
                        are still figuring things out, or just want to be ready — FORWARD is for you.
                    </p>
                </MarkdownTTS>
            </div>

            <div className="text-right mt-8">
                <Link to={"/supportersOfYouth"} className="bg-primary hover:brightness-90 text-primary-foreground px-4 py-2 rounded">
                    Supporters of Youth
                </Link>
            </div>
        </div>
    )
}
import { Link } from "react-router";

export default function supportersOfYouth(){
    return (
        <div className="max-w-6xl mx-auto px-6 py-5">
            <h4 className="text-accent text-right">For supporters of youth</h4>
            
            <div>
                <h1 className="text-4xl font-black text-accent mb-6">About Forward</h1>
                <h4 className="mb-6">Facilitating Opportunities for Reentry, Workforce, and Academic Readiness for Youth with Disabilities in Juvenile Justice</h4>
                
                <p className="mb-8">FORWARD is a web-based transition curriculum designed to support youth with disabilities in juvenile justice and other alternative education settings as they prepare for life beyond high school. 
                    Whether you're a parent, caregiver, educator, mental health provider, probation officer, mentor, or other another type of youth supporter, your role in supporting young people during key transitions 
                    is essential — and FORWARD was developed with that in mind.
                </p>

                <img 
                    src="/about_page/student_staring_off.jpg" 
                    alt="Student looking thoughtfully into the distance" 
                    className="w-full max-w-2xl mx-auto rounded-lg my-6"
                />
            </div>

            {/* paragraph two */}
            <div className="border-t border-muted pt-8">
                <h3 className="text-2xl font-black mb-6">Why FORWARD?</h3>

                <p className="mb-6">  FORWARD builds on several existing, research-informed transition curricula (e.g., INSITE, RISE, RAISE, Merging Two Worlds) 
                    and was designed in response to persistent challenges observed in juvenile justice and alternative education settings. 
                    These include limited instructional time, variability in youth participation, and difficulties delivering the most relevant content 
                    before a young person exits a program.
                </p>

                <p className="mb-4">FORWARD addresses these issues by offering:</p>

                <div className="markdown mb-6">
                    <ul>
                        <li><b>Flexible, web-based content</b> that youth can access during and after placement</li>
                        <li><b>Lessons that stand alone</b>, allowing youth to begin with whichever topic is most relevant to them</li>
                        <li><b>Universal Design for Transition (UDT)</b> as a guiding framework to ensure cultural responsiveness, accessibility, and multiple means of engagement</li>
                        <li><b>Accessibility features</b> including text-to-speech, closed captions, visual supports, speech-to-text responses, and simplified language at a 5th grade reading level</li>
                    </ul>
                </div>
                
                <img 
                    src="/about_page/kids_huddled_up.jpg" 
                    alt="Students huddled up" 
                    className="w-full max-w-2xl mx-auto rounded-lg my-6"
                />
            </div>

            {/* section 3 */}
            <div className="border-t border-muted pt-8 mt-8">
                <h3 className="text-2xl font-black mb-6">What Does FORWARD Teach?</h3>
                
                <p className="mb-4">FORWARD helps youth develop practical knowledge and skills across three key areas of transition:</p>

                <div className="markdown mb-6">
                    <ul>
                        <li>Academic Readiness - Preparing for postsecondary education, including college, trade school, or GED programs</li>
                        <li>Workforce Readiness - Building job-seeking and workplace communication skills</li>
                        <li>Independent Living Readiness - Managing responsibilities like budgeting, housing, and transportation</li>
                    </ul>
                </div>

                <p className="mb-4">The curriculum includes five core lessons:</p>

                <div className="markdown mb-6">
                    <ol>
                        <li><b>Going to College</b></li>
                        <li><b>Disclosure and Appropriate Communication</b></li>
                        <li><b>Personal Finance Management</b></li>
                        <li><b>Self-Advocacy</b></li>
                        <li><b>Soft Skills Development</b></li>
                    </ol>
                </div>

                <p className="mb-8">
                    Each lesson includes written content, videos, and interactive activities such as quizzes, 
                    choose-your-path scenarios, simulations, and open-ended reflection. Lessons typically take 
                    45–60 minutes to complete, though students are encouraged to move at their own pace and explore 
                    deeply where they are most interested.Each lesson includes written content, videos, and interactive 
                    activities such as quizzes, choose-your-path scenarios, simulations, and open-ended reflection. Lessons 
                    typically take 45–60 minutes to complete, though students are encouraged to move at their own pace and 
                    explore deeply where they are most interested.
                </p>
            </div>

            <div className="mt-8">
                <h3 className="text-2xl font-black mb-6">Designed for Flexibility and Choice</h3>
                
                <p className="mb-8">
                    Many transition programs follow a set order of instruction, which can limit access to high-priority content 
                    when youth are facing unpredictable timelines. FORWARD intentionally removes the requirement to move through 
                    lessons sequentially. Youth can choose the topics that matter most to them and explore the rest as time allows. 
                    This design increases relevance, reduces frustration, and centers youth autonomy — all while preserving the benefits 
                    of identity development and self-reflection by embedding these themes across all lessons.
                </p>
            </div>

            <div className="mt-8">
                <h3 className="text-2xl font-black mb-6">Who Is It For?</h3>
                
                <p className="mb-8">
                    FORWARD was created for youth ages 14–21 with disabilities in juvenile justice or other alternative settings. However, 
                    the content may also benefit any young person preparing for transition, particularly those with low literacy levels or limited access to consistent instruction.
                    We encourage adults who support youth — including parents, foster parents, teachers, case managers, mentors, parole officers, and others — to explore the site, 
                    become familiar with the lessons, and engage in conversations about what youth are learning. Your support and encouragement play a powerful role in helping young 
                    people apply what they've learned to real-life decisions and opportunities.
                </p>
            </div>

            <div className="mt-8">
                <h3 className="text-2xl font-black mb-6">How can I help?</h3>
                
                <p>
                    In addition to becoming familiar with the lessons and site, you can review the facilitator guides that accompany each lesson. 
                    These are designed with your support in mind, offering specific activities, conversation starters, and other ideas for engaging 
                    youth and making connections that will enhance their learning. Facilitator guides can be accessed here. 
                </p>
            </div>

        <div className="text-right mt-8">
            <Link to={"/youth"} className="bg-primary hover:brightness-90 text-primary-foreground px-4 py-2 rounded">
                Youth
            </Link>
        </div>
        </div>
    )
}
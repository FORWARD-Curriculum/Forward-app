import { Link } from "react-router";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion-faq";

export default function Assent(){
    const user = useSelector((state: RootState) => state.user.user);
    
    return (
        <div className={`max-w-6xl mx-auto w-full px-6 py-5 text-secondary-foreground bg-foreground ${user?.preferences?.text_size || ""}`}>
            
            <h4 className="text-accent text-right">Research Participation</h4>
            
            <h1 className="text-4xl font-black text-accent mb-6">FORWARD Research Study Participation</h1>
            
            <p className="text-base mb-6">
                If your facility agreed to participate in FORWARD research, you were asked to sign an assent or consent form. This form was to agree that you were willing to be a part of a research study. The form you signed depended on your age. You can review the form below.
            </p>
                
                <div className="space-y-4 w-full">
                   <Accordion type="multiple" className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-xl font-bold">
                        Youth Assent Form (Ages 12-17)
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                          <span className="text-[0px] opacity-0">.</span>
                        <div className="space-y-4">
                        <p className="text-base">
                            My name is Annee Grayson. I am a student at Arizona State University and I am doing this study as part of my dissertation. I'm asking you to participate because I am trying to learn more about how youth prepare for school, work, and living on their own. The South Carolina Department of Juvenile Justice has given you permission to participate in this study.
                        </p>

                        <div>
                          <h3 className="text-lg font-bold mb-2">What You'll Do</h3>
                          <p className="text-base mb-2">If you agree, you will:</p>
                          <ul className="list-disc list-inside space-y-1 text-base ml-4">
                            <li>Fill out a short survey 3 times during the study</li>
                            <li>Complete 5 lessons on the FORWARD website. These lessons include reading, videos, and activities.</li>
                          </ul>
                          <p className="text-base mt-2">
                            The survey and lessons will ask about things like school, work, and skills for living on your own. Each survey will take about 20 minutes, and each lesson will take about an hour. You do not have to put your name on the survey, and you do not have to answer any questions that make you uncomfortable.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">What Information Will Be Collected and How It Will Be Used</h3>
                          <ul className="list-disc list-inside space-y-2 text-base ml-4">
                            <li>Each participating facility will create your FORWARD login using a special code made from letters and numbers—like parts of your name and your birth month and year. This code is what you'll use to log in and also what connects your surveys and lessons together. Your name and birthday will not be saved, and the research team will not have a list showing which code belongs to which student.</li>
                            <li>During the study, the FORWARD website will collect information about how you use the lessons—like how long you spend on pages, videos, and activities. Your teacher or staff member will also complete short checklists about how the lessons are going.</li>
                            <li>The information you give may be studied using computer programs at Arizona State University called artificial intelligence (AI). These programs help researchers find patterns in large amounts of information. If AI is used, your name and anything that could identify you will be removed first.</li>
                            <li>Everything you share will be kept private. We will not use your name, and nothing that could identify you will be shared. De-identified data collected as a part of the current study will be shared with others (e.g., investigators or industry partners) for future research purposes or other uses.</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">Thank-You to Your Program</h3>
                          <p className="text-base">
                            There is no direct payment for participating in this study. However, the participating facility may receive funds from the research team to host a group celebration (such as a pizza or ice cream party) after the project is completed. This event is intended as a thank-you to the site for taking part in the study, and individual participants will not receive personal compensation. Participation in the study or withdrawal from it will not affect whether a student is invited to attend the celebration.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">Your Choice to Participate</h3>
                          <p className="text-base mb-2">
                            You do not have to be in this study. No one will be upset if you decide not to take part. Even if you start the study, you can stop at any time. You may ask questions about the study at any time. Your choice to participate in this study will not effect the services or care you receive from your facility.
                          </p>
                          <p className="text-base">
                            If you decide to be in the study, I will not tell anyone else how you respond or what you do as part of the study. Even if staff, teachers, or others ask, I will not tell them about what you say or do.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">Questions</h3>
                          <p className="text-base">
                            If you have any questions about the study, you can contact me, Annee Grayson, at anjenks@asu.edu, or my advisor, Dr. Sarup Mathur, at sarup.mathur@asu.edu. If you have any questions about your rights as a subject/participant in this research, or if you feel you have been placed at risk, you can contact the Chair of the Human Subjects Institutional Review Board, through the ASU Office of Research Integrity and Assurance, at (480) 965-6788.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">Agreement</h3>
                          <p className="text-base mb-2">
                            Signing here means that you have read this form or have had it read to you and that you are willing to be in this study.
                          </p>
                          <p className="text-base">
                            Youth Signature: _________________________ Date: ____________
                          </p>
                        </div>
                        </div>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                      <AccordionTrigger className="text-xl font-bold">
                        Youth Consent Form (Ages 18-21)
                        </AccordionTrigger>
                      <AccordionContent>
                       <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                         <span className="text-[0px] opacity-0">.</span>
                        <div className="space-y-4">
                        <p className="text-base">
                            My name is Annee Grayson. I am a student at Arizona State University and I am doing this study as part of my dissertation. I'm asking you to participate because I am trying to learn more about how youth prepare for school, work, and living on their own. The South Carolina Department of Juvenile Justice has given permission for this study to take place.
                        </p>

                        <div>
                          <h3 className="text-lg font-bold mb-2">What You'll Do</h3>
                          <p className="text-base mb-2">If you agree to participate, you will:</p>
                          <ul className="list-disc list-inside space-y-1 text-base ml-4">
                            <li>Fill out a short survey 3 times during the study</li>
                            <li>Complete 5 lessons on the FORWARD website. These lessons include reading, videos, and activities.</li>
                          </ul>
                          <p className="text-base mt-2">
                            The surveys and lessons will ask about things like school, work, and skills for living on your own. Each survey will take about 20 minutes, and each lesson will take about an hour. You do not have to put your name on the survey, and you may skip any questions you do not want to answer.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">What Information Will Be Collected and How It Will Be Used</h3>
                          <ul className="list-disc list-inside space-y-2 text-base ml-4">
                            <li>Each participating facility will create your FORWARD login using a unique code made from letters and numbers (for example, parts of your name and your birth month and year). This code will serve as your username and will be used to connect your survey and lesson information. No names, birthdates, or identifying details will be shared with the research team, and no master list linking codes to individuals will exist.</li>
                            <li>During this study, the FORWARD website will also collect information about how you use the lessons—such as how long you spend on pages, videos, and activities. Staff or teachers at your facility will complete short checklists about how the lessons are going.</li>
                            <li>In addition to standard analysis, your survey and lesson responses may be analyzed using computer programs at Arizona State University called artificial intelligence (AI). These tools, provided through ASU's secure Sol supercomputer, help researchers find patterns in large amounts of information. All responses will be de-identified (your name and any identifying details removed) before any AI analysis is conducted.</li>
                            <li>All information you provide will be kept private and stored securely on ASU's cloud-based servers. Some information (without names) may be shared later with other qualified researchers for future studies that support education and transition research; however, no identifying information will ever be included.</li>
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">Thank-You to Your Program</h3>
                          <p className="text-base">
                            You will not get money or gift cards for being in this study. Your school or program might get money to have a party to celebrate finishing the project. This is a thank-you for everyone who helped. Whether or not you take part, or if you leave the program early, will not change whether you can go to the party if you are still there.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">Your Choice to Participate</h3>
                          <p className="text-base mb-2">
                            Your participation in this study is voluntary. You may choose not to participate, and no one will be upset if you decide not to take part. Even if you begin, you may stop at any time. You may also ask questions about the study at any time. Your choice to participate in this study will not effect the services or care you receive from your facility.
                          </p>
                          <p className="text-base">
                            If you decide to participate, your responses will be kept private. I will not share what you say or do with staff, teachers, or others. The information you provide will be kept confidential and de-identified, meaning your name or any identifying details will not be linked to your responses. De-identified data collected as a part of the current study will be shared with others (e.g., investigators or industry partners) for future research purposes or other uses.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">Questions</h3>
                          <p className="text-base">
                            If you have any questions about the study, you can contact me, Annee Grayson, at anjenks@asu.edu, or my advisor, Dr. Sarup Mathur, at sarup.mathur@asu.edu. If you have any questions about your rights as a subject/participant in this research, or if you feel you have been placed at risk, you can contact the Chair of the Human Subjects Institutional Review Board, through the ASU Office of Research Integrity and Assurance, at (480) 965-6788.
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold mb-2">Agreement</h3>
                          <p className="text-base mb-2">
                            Signing below means that you have read this form (or have had it read to you), that you understand the information, and that you agree to take part in this study.
                          </p>
                          <p className="text-base">
                            Participant Signature: _________________________ Date: ____________
                          </p>
                        </div>
                        </div>
                       </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                     <AccordionTrigger className="text-xl font-bold">
                        What if I didn't sign the form but now I want to join the study?
                      </AccordionTrigger>
                      <AccordionContent>
                        <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                          <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            If you want to join the study, you can begin by going to your user settings. Under your display name, check the box that says "Agree to participate in FORWARD research program." After navigating away from this page, you will be taken to a page to sign this form and take a survey.
                        </p>
                        </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                      <AccordionTrigger className="text-xl font-bold">
                        What if I signed the form but no longer want to be in the study?
                      </AccordionTrigger>
                      <AccordionContent>
                      <MarkdownTTS controlsClassName="flex flex-row-reverse items-start justify-between gap-4">
                        <span className="text-[0px] opacity-0">.</span>
                        <p className="text-base">
                            If you no longer want to be in the study, you can go to your user settings. Under your display name, uncheck the box that says "Agree to participate in FORWARD research program." Your data will no longer be collected.
                        </p>
                      </MarkdownTTS>
                      </AccordionContent>
                    </AccordionItem>
                   </Accordion>
                </div>
        </div>
    );
}
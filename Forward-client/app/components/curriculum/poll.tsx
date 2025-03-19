import type { Poll, PollQuestion } from "@/lib/lessonSlice";

export default function Writing({poll}: {poll: Poll}) {
    return (
        <div>
        <p>{poll.instructions}</p>
        <ul>{poll.questions.map((e)=>{return (<li>{e.question_text}</li>)})}</ul>
        </div>
    );
}
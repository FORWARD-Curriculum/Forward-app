import type { Poll, PollQuestion } from "@/lib/redux/lessonSlice";

export default function Writing({poll}: {poll: Poll}) {
    return (
        <div>
        <p>{poll.instructions}</p>
        <ul>{poll.questions.map((e)=>{return (<li>{JSON.stringify(e.options)}</li>)})}</ul>
        </div>
    );
}
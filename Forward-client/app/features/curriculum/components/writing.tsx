import type { Writing } from "@/features/curriculum/types";

export default function Writing({writing}: {writing: Writing}) {
    return (
        <div>
        <p>{writing.instructions}</p>
        <textarea/>
        </div>
    );
}
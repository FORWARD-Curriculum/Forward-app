import type { BaseActivity, Lesson, TextContent } from "@/lib/lessonSlice";
import type { Route } from "./+types/lesson";
import { apiFetch } from "@/lib/utils";
import { Outlet } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { type RootState } from "@/store";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const response = await apiFetch(`/lessons/${params.lessonId}/content`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (response.ok) {
    const json = await response.json();
    return json.data.lesson as Lesson;
  }
}

export function Activity({
  activity,
}: {
  activity: BaseActivity | TextContent | undefined;
}) {
  switch (activity?.type) {
    case "Writing":
      return <p>Writing </p>;
    case "Quiz":
      return <p>Quiz</p>;
    case "Poll":
      return <p>Poll</p>;
    case "TextContent":
      return <p>Text Content {activity.type}</p>;
    default:
      return <p>Invalid</p>;
  }
}

export default function Lesson({ loaderData }: Route.ComponentProps) {
  const dispatch = useDispatch();
  dispatch({ type: "lesson/setLesson", payload: loaderData });
  const lesson = useSelector((state: RootState) => state.lesson);

  return (
    <>
      {lesson.lesson?.activities.map((activity) => {
        return (
          <button className="hover:underline">
            {activity.order}.) {activity.title}
          </button>
        );
      })}
      <Activity activity={lesson.lesson?.activities[lesson.currentActivity]} />
      <button
        onClick={() => {
          dispatch({ type: "lesson/nextActivity" });
        }}
      >
        next activity
      </button>
    </>
  );
}

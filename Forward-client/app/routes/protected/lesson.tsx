import {
  type BaseActivity,
  type Lesson,
  type TextContent as TextContentType,
  type Poll as PollType,
  type Quiz as QuizType,
  type Writing as WritingType,
  type LessonResponse,
} from "@/features/curriculum/types";
import type { Route } from "./+types/lesson";
import { apiFetch } from "@/utils/utils";
import { useSelector, useDispatch } from "react-redux";
import store, { type RootState } from "@/store";
import { useEffect } from "react";
import TextContent from "@/features/curriculum/components/textcontent";
import Poll from "@/features/curriculum/components/poll";
import Quiz from "@/features/curriculum/components/quiz";
import Writing from "@/features/curriculum/components/writing";
import { useClient } from "@/hooks/useClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRightIcon, ArrowUpIcon } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  incrementHighestActivity,
  setResponse,
} from "@/features/curriculum/slices/userLessonDataSlice";
import { nextActivity, setActivity, setLesson } from "@/features/curriculum/slices/lessonSlice";

export async function clientLoader({
  params,
}: Route.ClientLoaderArgs): Promise<{
  lesson: Lesson;
  response: LessonResponse | null;
} | void> {
  // If lesson is cached, don't fetch
  if (store.getState().lesson.lesson?.id !== params.lessonId) {
    const response = await apiFetch(`/lesson/${params.lessonId}/content`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      const json = await response.json();
      return {
        lesson: json.data.lesson as Lesson,
        response: json.data.response as LessonResponse,
      };
    }
  }
}

clientLoader.prefetch = true;

export function Activity({
  activity,
}: {
  activity: BaseActivity | TextContentType | undefined;
}) {
  /* Generate a unique key based on the activity's identifier
  * IMPORTANT: The key also makes sure react discards components instead of reusing them on
  * navigation, which breaks how we handle responses.
  */
  const key = activity ? `${activity.type}-${activity.order}` : 'invalid';

  switch (activity?.type) {
    case "Writing":
      // Add the key prop
      return <Writing key={key} writing={activity as WritingType} />;
    case "Quiz":
      // Add the key prop
      return <Quiz key={key} quiz={activity as QuizType} />;
    case "Poll":
      // Add the key prop
      return <Poll key={key} poll={activity as PollType} />;
    case "TextContent":
      // Add the key prop
      return <TextContent key={key} textContent={activity} />;
    default:
      // Add the key prop
      return <p key={key}>Invalid</p>;
  }
}

export default function Lesson({ loaderData }: Route.ComponentProps) {
  const dispatch = useDispatch();
  const client = useClient();
  const { hash } = useLocation();
  const lesson = useSelector((state: RootState) => state.lesson);
  const response = useSelector((state: RootState) => state.response);
  const activity = lesson.lesson?.activities[lesson.current_activity - 1];
  const [showsScrolBtn, setShowScrolBtn] = useState(false);

  // Mount/Unmount
  useEffect(() => {
    const handleButtonVisibility = () => {
      window.pageYOffset > 500 ? setShowScrolBtn(true) : setShowScrolBtn(false);
    };
    window.addEventListener("scroll", handleButtonVisibility);
    
    // Deregisters event listener and destroys interval
    return () => {
      window.removeEventListener("scroll", handleButtonVisibility);
    };
  }, []);


  // We only want to update the lesson slice when the data loads, no other time
  useEffect(() => {
    if (loaderData) {
      {
        document.title = loaderData.lesson.title + " | FORWARD";
        if (loaderData.lesson.id != lesson.lesson?.id) {
          dispatch(setLesson(loaderData.lesson));
          dispatch(
            setActivity(
              hash.length > 0
                ? parseInt(hash.substring(1).split("/").at(0) || "1")
                : 1,
            ),
          );
          if (loaderData.response) dispatch(setResponse({...loaderData.response, time_spent: Date.now()}));
        }
      }
    }
  }, [loaderData]);

  
  return (
    <div className="m-4 flex w-full flex-col items-center gap-4 lg:m-24 lg:flex-row lg:items-start lg:gap-8">
      <div className="flex flex-col lg:h-full">
        <Accordion
          type="single"
          collapsible
          orientation={
            client.windowDimensions.width >= 1024 ? "horizontal" : "vertical"
          }
        >
          <AccordionItem value="1">
            <AccordionTrigger className="bg-secondary border-secondary-border text-secondary-foreground data-[state=open]:border-b-muted-foreground/50 rounded-t-3xl border-1 p-4 duration-50 data-[state=closed]:rounded-3xl data-[state=closed]:delay-300 data-[state=open]:rounded-b-none data-[state=open]:border-b-1">
              <h1 className="text-lg font-bold text-nowrap">
                {lesson.lesson?.title}: Table of Contents
              </h1>
            </AccordionTrigger>
            <AccordionContent className="bg-secondary text-secondary-foreground border-secondary-border overflow-hidden rounded-b-3xl border-1 border-t-0 pb-0 text-nowrap">
              <div className="flex flex-col">
                {lesson.lesson?.activities.map((activityIndex) => {
                  return (
                    <button
                      disabled={activityIndex.order > response.highest_activity}
                      key={activityIndex.order}
                      className={`${activityIndex.order === lesson.current_activity ? "bg-accent/40" : ""} disabled:text-foreground disabled:bg-muted flex h-10 w-full flex-row items-center disabled:!cursor-not-allowed disabled:no-underline ${activity?.order && activity.order < 3 ? "!text-gray" : ""} justify-between px-8 font-bold last:rounded-b-3xl hover:underline active:backdrop-brightness-90`}
                      onClick={() => {
                        dispatch(setActivity(activityIndex.order));
                        history.replaceState(
                          null,
                          "",
                          `#${activityIndex.order}`,
                        );
                      }}
                    >
                      <p>{activityIndex.order}.</p>
                      <p>{activityIndex.title}</p>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {client.windowDimensions.width >= 1024 && (
          <button
            id="scrolToTop"
            className={`group bg-primary relative mt-auto flex size-12 items-center justify-center rounded-full transition-opacity ${showsScrolBtn ? "opacity-100" : "opacity-0"}`}
            onClick={() => {
              window.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth",
              });
            }}
          >
            <ArrowUpIcon className="!text-primary-foreground size-8" />
            <p className="text-secondary-foreground absolute top-[120%] text-nowrap opacity-0 transition-opacity group-hover:opacity-100">
              Back to top
            </p>
          </button>
        )}
      </div>

      <div className="bg-secondary border-secondary-border text-secondary-foreground flex min-h-min w-full flex-col rounded-3xl border-1 p-4">
        <h1 className="text-2xl font-bold">
          <span className="text-accent">
            {
              {
                Writing: "Writing",
                Quiz: "Quiz",
                TextContent: "Info",
                Poll: "Poll",
                Default: "Activity",
              }[activity?.type || "Default"]
            }
            :{" "}
          </span>
          {activity?.title}
        </h1>
        <Activity activity={activity} />
        <div className="mt-auto flex">
          <Link
            prefetch="intent"
            to={"#" + (lesson.current_activity + 1)}
            className="bg-primary text-primary-foreground ml-auto inline-flex gap-2 rounded-md p-2"
            onClick={() => {
              dispatch(nextActivity());
              dispatch(incrementHighestActivity());
            }}
          >
            Save and Continue
            <ArrowRightIcon className="!text-primary-foreground" />
          </Link>
        </div>
      </div>
    </div>
  );
}

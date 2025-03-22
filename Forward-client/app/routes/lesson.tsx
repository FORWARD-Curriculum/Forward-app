import type {
  BaseActivity,
  Lesson,
  TextContent as TextContentType,
  Poll as PollType,
  Quiz as QuizType,
  Writing as WritingType,
} from "@/lib/lessonSlice";
import type { Route } from "./+types/lesson";
import { apiFetch } from "@/lib/utils";
import { useSelector, useDispatch } from "react-redux";
import { type RootState } from "@/store";
import { useEffect } from "react";
import TextContent from "@/components/curriculum/textcontent";
import Poll from "@/components/curriculum/poll";
import Quiz from "@/components/curriculum/quiz";
import Writing from "@/components/curriculum/writing";
import { useClient } from "@/lib/useClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRightIcon, ArrowUpIcon } from "lucide-react";
import { useState } from "react";

export async function clientLoader({
  params,
}: Route.ClientLoaderArgs): Promise<Lesson | void> {
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
  activity: BaseActivity | TextContentType | undefined;
}) {
  switch (activity?.type) {
    case "Writing":
      return <Writing writing={activity as WritingType} />;
    case "Quiz":
      return <Quiz quiz={activity as QuizType} />;
    case "Poll":
      return <Poll poll={activity as PollType} />;
    case "TextContent":
      return <TextContent textContent={activity} />;
    default:
      return <p>Invalid</p>;
  }
}

export default function Lesson({ loaderData }: Route.ComponentProps) {
  const dispatch = useDispatch();
  const client = useClient();
  useEffect(() => {
    if (loaderData) {dispatch({ type: "lesson/setLesson", payload: loaderData });
    dispatch({ type: "lesson/setActivity", payload: 1 })};
  }, [loaderData, dispatch]);

  const lesson = useSelector((state: RootState) => state.lesson);
  const activity = lesson.lesson?.activities[lesson.currentActivity - 1];
  const [showsScrolBtn, setShowScrolBtn] = useState(false);

  // scr button "hook"
  useEffect(() => {
    const handleButtonVisibility = () => {
      window.pageYOffset > 500 ? setShowScrolBtn(true) : setShowScrolBtn(false);
    };
    window.addEventListener("scroll", handleButtonVisibility);
    return () => {
      window.addEventListener("scroll", handleButtonVisibility);
    };
  }, []);

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
            <AccordionTrigger className="bg-secondary border-secondary-border text-secondary-foreground data-[state=open]:border-b-muted-foreground/50 rounded-t-3xl border-1 p-4 duration-50 data-[state=closed]:rounded-3xl data-[state=closed]:delay-300 data-[state=open]:border-b-1 data-[state=open]:rounded-b-none">
              <h1 className="text-lg font-bold text-nowrap">
                {lesson.lesson?.title}: Table of Contents
              </h1>
            </AccordionTrigger>
            <AccordionContent className="bg-secondary text-secondary-foreground overflow-hidden rounded-b-3xl pb-0 text-nowrap border-secondary-border border-1 border-t-0">
              <div className="flex flex-col">
                {lesson.lesson?.activities.map((activityIndex) => {
                  return (
                    <button
                      className={`${activityIndex.order === lesson.currentActivity ? "bg-accent/40" : ""} flex h-10 w-full flex-row items-center justify-between px-8 font-bold last:rounded-b-3xl hover:underline active:backdrop-brightness-90`}
                      onClick={() =>
                        dispatch({
                          type: "lesson/setActivity",
                          payload: activityIndex.order,
                        })
                      }
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
            className={`group relative rounded-full bg-primary size-12 items-center justify-center flex mt-auto transition-opacity ${showsScrolBtn ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => {
              window.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth",
              });
            }}
          >
          <ArrowUpIcon className="!text-primary-foreground size-8"/>
          <p className="absolute text-nowrap top-[120%] opacity-0 group-hover:opacity-100 transition-opacity text-secondary-foreground">Back to top</p>
          </button>
        )}
      </div>

      <div className="bg-secondary border-secondary-border border-1 text-secondary-foreground flex min-h-min w-full flex-col rounded-3xl p-4">
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
          <button
            className="bg-primary text-primary-foreground ml-auto inline-flex gap-2 rounded-md p-2"
            onClick={() => {
              dispatch({ type: "lesson/nextActivity" });
            }}
          >
            Save and Continue
            <ArrowRightIcon className="!text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

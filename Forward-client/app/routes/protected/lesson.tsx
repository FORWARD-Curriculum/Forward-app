import {
  type BaseActivity,
  type Lesson,
  type LessonResponse,
  type ActivityManager,
  ActivityTypeDisplayNames,
} from "@/features/curriculum/types";
import type { Route } from "./+types/lesson";
import { apiFetch } from "@/utils/utils";
import { useSelector, useDispatch } from "react-redux";
import store, { type RootState } from "@/store";
import { act, useEffect } from "react";
import TextContent from "@/features/curriculum/components/textcontent";
import Poll from "@/features/curriculum/components/poll";
import Quiz from "@/features/curriculum/components/quiz";
import Twine from "@/features/curriculum/components/twine";
import Writing from "@/features/curriculum/components/writing";
import Identification from "@/features/curriculum/components/identification";
import Embed from "@/features/curriculum/components/embed";
import ConceptMap from "@/features/curriculum/components/conceptmap";
import DndMatch from "@/features/curriculum/components/dndmatch";
import FillInTheBlank from "@/features/curriculum/components/fillintheblank";
import { useClient } from "@/hooks/useClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRightIcon, ArrowUpIcon } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router";
import {
  incrementHighestActivity,
  setResponse,
} from "@/features/curriculum/slices/userLessonDataSlice";
import {
  nextActivity,
  setActivity,
  setLesson,
} from "@/features/curriculum/slices/lessonSlice";
import LikertScale from "@/features/curriculum/components/likertscale";
import Video from "@/features/curriculum/components/video";
import confetti from 'canvas-confetti';

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

export function Activity({ activity }: { activity: BaseActivity }) {
  /* Generate a unique key based on the activity's identifier
   * IMPORTANT: The key also makes sure react discards components instead of reusing them on
   * navigation, which breaks how we handle responses.
   */
  const key = activity ? `${activity.type}-${activity.order}` : "invalid";

  switch (activity.type) {
    case "Writing":
      return (
        <Writing
          key={key}
          writing={activity as ActivityManager["Writing"][0]}
        />
      );
    case "Quiz":
      return <Quiz key={key} quiz={activity as ActivityManager["Quiz"][0]} />;
    case "Poll":
      return <Poll key={key} poll={activity as ActivityManager["Poll"][0]} />;
    case "TextContent":
      return (
        <TextContent
          key={key}
          textContent={activity as ActivityManager["TextContent"][0]}
        />
      );
    case "Identification":
      return (
        <Identification
          key={key}
          identification={activity as ActivityManager["Identification"][0]}
        />
      );
    case "ConceptMap":
      return (
        <ConceptMap
          key={key}
          conceptmap={activity as ActivityManager["ConceptMap"][0]}
        />
      );
    case "Embed":
      return (
        <Embed key={key} embed={activity as ActivityManager["Embed"][0]} />
      );
    case "LikertScale":
      return (
        <LikertScale
          key={key}
          likertScale={activity as ActivityManager["LikertScale"][0]}
        />
      );
    case "DndMatch":
      return <DndMatch key={key} dndmatch={activity as ActivityManager["DndMatch"][0]}/>
    case "FillInTheBlank":
      return <FillInTheBlank key={key} fillInTheBlank={activity as ActivityManager["FillInTheBlank"][0]}/>
    case "Video":
      return <Video key={key} video={activity as ActivityManager["Video"][0]} />;
    case "Twine":
      return <Twine key={key} twine={activity as ActivityManager["Twine"][0]} />;
    // No default case needed, as all types are handled
    default:
      return <p>Out of bounds</p>;
  }
}

export default function Lesson({ loaderData }: Route.ComponentProps) {
  const dispatch = useDispatch();
  const client = useClient();
  const { hash } = useLocation();
  const lesson = useSelector((state: RootState) => state.lesson);
  const response = useSelector((state: RootState) => state.response);
  const user = useSelector((state: RootState) => state.user.user);
  const activity = lesson.lesson?.activities[lesson.current_activity - 1];
  const length = lesson.lesson?.activities.length;
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
          if (loaderData.response)
            dispatch(
              setResponse({ ...loaderData.response, time_spent: Date.now() }),
            );
        }
      }
    }
  }, [loaderData]);

  const handleLessonComplete = () => {
    confetti({
      particleCount: 550,
      spread: 80,
      origin: { y: 0.6 }, 
      startVelocity: 60,    
      scalar: 1.2,
      ticks: 200 
    });

    setTimeout(() =>{
      confetti({
        particleCount: 250,
        angle: 60,
        spread: 90,
        origin: { x: 0.2, y: 0.7},
        startVelocity: 30,
        scalar: 0.8
      });
      confetti({
        particleCount: 250,
        angle: 120,
        spread: 90,
        origin: { x: 0.8, y: 0.7},
        startVelocity: 30,
        scalar: 0.8
      });

    }, 150)
  }

  return (
    <div className="m-4 flex w-full flex-col items-center gap-4 lg:m-24 lg:mt-14 lg:flex-row lg:items-start lg:gap-8">
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
                      // FIXME for now, we are not using the response to disable the button
                      disabled={user ? (activityIndex.order > response.highest_activity) : false}
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
            {ActivityTypeDisplayNames[activity?.type || "Default"]}:{" "}
          </span>
          {activity?.title}
        </h1>
        {activity?.instructions && <p className="mb-6 font-light italic">{activity.instructions}</p>}
        {activity && <Activity activity={activity} />}
        <div className="mt-auto flex">
          <button
            disabled={user ? (response.current_response?.partial_response || undefined) : false}
            className="bg-primary text-primary-foreground ml-auto inline-flex gap-2 rounded-md p-2 disabled:hidden"
            onClick={() => {
              if (lesson.current_activity === length){
                handleLessonComplete();
              }
              else{
                dispatch(nextActivity());
                dispatch(incrementHighestActivity());
                history.replaceState(
                    null,
                    "",
                    "#" + (lesson.current_activity + 1),
                  );
              } 
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

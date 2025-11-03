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
import Slideshow from "@/features/curriculum/components/slideshow";
import { useClient } from "@/hooks/useClient";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRightIcon,
  ArrowUpIcon,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
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
import MarkdownTTS from "@/components/ui/markdown-tts";

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
      return (
        <DndMatch
          key={key}
          dndmatch={activity as ActivityManager["DndMatch"][0]}
        />
      );
    case "FillInTheBlank":
      return (
        <FillInTheBlank
          key={key}
          fillInTheBlank={activity as ActivityManager["FillInTheBlank"][0]}
        />
      );
    case "Video":
      return (
        <Video key={key} video={activity as ActivityManager["Video"][0]} />
      );
    case "Twine":
      return (
        <Twine key={key} twine={activity as ActivityManager["Twine"][0]} />
      );
    case "Slideshow":
      return (
        <Slideshow key={key} slideshow={activity as ActivityManager["Slideshow"][0]}/>
      );
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
  const activity = lesson.lesson?.activities[lesson.current_activity - 1];
  const [showsScrolBtn, setShowScrolBtn] = useState(false);
  const [showFullToc, setShowFullToc] = useState(false);

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

  return (
    <div className="m-4 mr-8 lg:ml-24 lg:mb-12 lg:mt-7 flex w-full flex-col items-center gap-4 lg:gap-8 lg:flex-row lg:items-start max-w-screen">
      <div className="flex flex-col lg:h-full">
        <Accordion
          type="single"
          collapsible
          orientation={
            client.windowDimensions.width >= 1024 ? "horizontal" : "vertical"
          }
        >
          <AccordionItem value="1" className="transition-transform duration-100 ease-in-out data-[state=open]:lg:translate-x-0 data-[state=open]:translate-x-6.5">
            <AccordionTrigger className="bg-secondary border-secondary-border text-secondary-foreground data-[state=open]:border-b-muted-foreground/50 relative rounded-t-3xl border-1 p-4 duration-50 data-[state=closed]:rounded-3xl data-[state=closed]:delay-300 data-[state=open]:rounded-b-none data-[state=open]:border-b-1">
              <button
                className={`bg-foreground absolute top-2.75 -left-15 rounded-full border-secondary-border p-2 border-1 transition-transform duration-100 ease-in-out group-data-[state=closed]:scale-0 hover:scale-110 hover:duration-75`}
                onClick={(e) => {
                  e.stopPropagation(), setShowFullToc(!showFullToc);
                }}
                title="Toggle full Table of Contents"
              >
                {showFullToc ? <ChevronsDownUp /> : <ChevronsUpDown />}
              </button>
              <h1
                title={`${lesson.lesson?.title}: Table of Contents`}
                className="lg:w-[30ch] w-[20ch] overflow-hidden text-lg font-bold text-nowrap overflow-ellipsis hover:underline"
              >
                {lesson.lesson?.title}: Table of Contents
              </h1>
            </AccordionTrigger>
            <AccordionContent className="bg-secondary text-secondary-foreground border-secondary-border overflow-hidden rounded-b-3xl border-1 border-t-0 pb-0 text-nowrap">
              <div className="flex flex-col overflow-y-auto ">
                {(showFullToc
                  ? lesson.lesson?.activities || []
                  : [...(lesson.lesson?.activities || [])].splice(
                      lesson.current_activity < 6
                        ? 0
                        : lesson.current_activity + 6 > lesson.lesson!.activities.length
                        ? lesson.lesson!.activities.length - 12
                        : lesson.current_activity - 6,
                      12,
                    )
                ).map((activityIndex) => {
                  return (
                    <button
                      // FIXME: for now, we are not using the response to disable the button
                      title={`${activityIndex.order}. ${activityIndex.title}`}
                      // disabled={activityIndex.order > response.highest_activity}
                      key={activityIndex.order}
                      className={`${activityIndex.order === lesson.current_activity ? "bg-accent/40" : ""} group disabled:text-foreground disabled:bg-muted flex h-10 w-full flex-row items-center disabled:!cursor-not-allowed disabled:no-underline ${activity?.order && activity.order < 3 ? "!text-gray" : ""} justify-between px-8 font-bold last:rounded-b-3xl hover:underline active:backdrop-brightness-90`}
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
                      <span className="ml-auto lg:w-[35ch] w-[20ch]  overflow-hidden **:text-right">
                        <p
                          className={
                            activityIndex.title.length > 45
                              ? "group-hover:hidden"
                              : ""
                          }
                        >
                          {activityIndex.title.trunc(45)}
                        </p>
                        {activityIndex.title.length > 45 && (
                          <p className="group-hover:animate-marquee hidden items-center whitespace-nowrap group-hover:block">
                            {activityIndex.title} {activityIndex.title}
                          </p>
                        )}
                      </span>
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

      <div className="bg-secondary border-secondary-border text-secondary-foreground flex min-h-min w-full flex-col min-w-0 rounded-3xl border-1 p-4">
        <h1 className="text-2xl font-bold">
          <span className="text-accent">
            {ActivityTypeDisplayNames[activity?.type || "Default"]}:{" "}
          </span>
          {activity?.title}
        </h1>
        {activity?.instructions && (
          <MarkdownTTS
            className="mb-6 font-light italic"
            controlsClassName="flex flex-row-reverse justify-between"
            controlsOrientation="horizontal"
          >
            {activity.instructions}
          </MarkdownTTS>
        )}
        {activity && <Activity activity={activity} />}
        <div className="mt-auto flex">
          <button
            //FIXME: allows going forward even if activity is incomplete
            /*disabled={response.current_response?.partial_response || undefined}*/
            className="bg-primary text-primary-foreground ml-auto inline-flex gap-2 rounded-md p-2 disabled:hidden"
            onClick={() => {
              dispatch(nextActivity());
              dispatch(incrementHighestActivity());
              history.replaceState(
                null,
                "",
                "#" + (lesson.current_activity + 1),
              );
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

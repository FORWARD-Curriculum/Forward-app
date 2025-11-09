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
import { act, useEffect, useCallback, memo } from "react";
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
import { useIsMobile } from "@/hooks/useClient";
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
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
        <Slideshow
          key={key}
          slideshow={activity as ActivityManager["Slideshow"][0]}
        />
      );
    // No default case needed, as all types are handled
    default:
      return <p>Out of bounds</p>;
  }
}

const ScrollToTopButton= memo(()=> {
  const [showsScrollBtn, setShowsScrollBtn] = useState(false);

  useEffect(() => {
    const handleButtonVisibility = () => {
      // Show button when scrolled down more than 500px
      window.pageYOffset > 500
        ? setShowsScrollBtn(true)
        : setShowsScrollBtn(false);
    };

    window.addEventListener("scroll", handleButtonVisibility);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("scroll", handleButtonVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      id="scrollToTop"
      className={`group bg-primary relative mt-auto flex size-12 items-center justify-center rounded-full transition-opacity ${showsScrollBtn ? "opacity-100" : "opacity-0"}`}
      onClick={scrollToTop}
    >
      <ArrowUpIcon className="!text-primary-foreground size-8" />
      <p className="text-secondary-foreground absolute top-[120%] text-nowrap opacity-0 transition-opacity group-hover:opacity-100">
        Back to top
      </p>
    </button>
  );
})

export function TableOfContents() {
  const dispatch = useDispatch();
  const isMobile  = useIsMobile();
  const [showFullToc, setShowFullToc] = useState(false);
  const activities = useSelector((state: RootState) => state.lesson.lesson?.activities);
const current_activity = useSelector((state: RootState) => state.lesson.current_activity);
  const lesson_title = useSelector(
    (state: RootState) => state.lesson.lesson?.title,
  );
  const highest_activity = useSelector(
    (state: RootState) => state.response.highest_activity,
  );
  const user = useSelector((state: RootState) => state.user.user);
  const activity = useSelector(
    (state: RootState) =>
      state.lesson.lesson?.activities[state.lesson.current_activity - 1],
  );

  return (
    <div className="flex flex-col lg:h-full">
      <Accordion
        type="single"
        collapsible
        orientation={!isMobile ? "horizontal" : "vertical"}
      >
        <AccordionItem
          value="1"
          className="transition-transform duration-100 ease-in-out data-[state=open]:translate-x-6.5 data-[state=open]:lg:translate-x-0"
        >
          <AccordionTrigger className="bg-secondary border-secondary-border text-secondary-foreground data-[state=open]:border-b-muted-foreground/50 relative rounded-t-3xl border-1 p-4 duration-50 data-[state=closed]:rounded-3xl data-[state=closed]:delay-300 data-[state=open]:rounded-b-none data-[state=open]:border-b-1">
            <span
    role="button"
    tabIndex={0}
    aria-label="Toggle full Table of Contents"
    className="bg-foreground border-secondary-border absolute top-2.75 -left-15 rounded-full border-1 p-2 transition-transform duration-100 ease-in-out group-data-[state=closed]:scale-0 hover:scale-110 hover:duration-75"
    onClick={(e) => {
      e.stopPropagation();
      setShowFullToc((v) => !v);
    }}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        setShowFullToc((v) => !v);
      }
    }}
    title="Toggle full Table of Contents"
  >
    {showFullToc ? <ChevronsDownUp /> : <ChevronsUpDown />}
  </span>
            <h1
              title={`${lesson_title}: Table of Contents`}
              className="w-[20ch] overflow-hidden text-lg font-bold text-nowrap overflow-ellipsis hover:underline lg:w-[30ch]"
            >
              {lesson_title}: Table of Contents
            </h1>
          </AccordionTrigger>
          <AccordionContent className="bg-secondary text-secondary-foreground border-secondary-border overflow-hidden rounded-b-3xl border-1 border-t-0 pb-0 text-nowrap">
            <div className="flex flex-col overflow-y-auto">
              {(showFullToc
                ? activities || []
                : [...(activities || [])].splice(
                    current_activity < 6
                      ? 0
                      : current_activity + 6 >
                          activities!.length
                        ? activities!.length - 12
                        : current_activity - 6,
                    12,
                  )
              ).map((activityIndex) => {
                return (
                  <button
                    // FIXME: for now, we are not using the response to disable the button
                    title={`${activityIndex.order}. ${activityIndex.title}`}
                    disabled={
                      user ? activityIndex.order > highest_activity : false
                    }
                    key={activityIndex.order}
                    className={`${activityIndex.order === current_activity ? "bg-accent/40" : ""} group disabled:text-foreground disabled:bg-muted flex h-10 w-full flex-row items-center disabled:!cursor-not-allowed disabled:no-underline ${activity?.order && activity.order < 3 ? "!text-gray" : ""} justify-between px-8 font-bold last:rounded-b-3xl hover:underline active:backdrop-brightness-90`}
                    onClick={() => {
                      dispatch(setActivity(activityIndex.order));
                      history.replaceState(null, "", `#${activityIndex.order}`);
                    }}
                  >
                    <p>{activityIndex.order}.</p>
                    <span className="ml-auto w-[20ch] overflow-hidden **:text-right lg:w-[35ch]">
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
      {!isMobile && <ScrollToTopButton />}
    </div>
  );
}

export function NextActivity() {
  const dispatch = useDispatch();
  const [showComplete, setShowComplete] = useState(false);
  const user = useSelector((state: RootState) => state.user.user);
  const current_activity = useSelector(
    (state: RootState) => state.lesson.current_activity,
  );
  const highest_activity = useSelector(
    (state: RootState) => state.response.highest_activity,
  );
  const current_partial_response = useSelector(
    (state: RootState) => state.response.current_response?.partial_response,
  );
  const lessonLength = useSelector(
    (state: RootState) => state.lesson.lesson?.activities.length ?? 0,
  );
  const isMobile = useIsMobile();

  const handleLessonComplete = useCallback(() => {
    setShowComplete(true);
    confetti({
      particleCount: 550,
      spread: 80,
      origin: { y: 0.6 },
      startVelocity: 60,
      scalar: 1.2,
      ticks: 200,
    });

    setTimeout(() => {
      confetti({
        particleCount: 350,
        angle: 60,
        spread: 90,
        origin: { x: 0.2, y: 0.7 },
        startVelocity: 30,
        scalar: 0.8,
      });
      confetti({
        particleCount: 350,
        angle: 120,
        spread: 90,
        origin: { x: 1.1, y: 0.7 },
        startVelocity: 30,
        scalar: 0.8,
      });
    }, 150);
  }, []);
  return (
    <div className="mt-4 flex lg:mt-auto">
      <button
        disabled={user ? current_partial_response || undefined : false}
        className="bg-primary text-primary-foreground ml-auto inline-flex gap-2 rounded-md p-2 disabled:hidden"
        onClick={() => {
          if (isMobile) {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }
          if (current_activity === lessonLength) {
            handleLessonComplete();
          } else {
            dispatch(nextActivity());
            if (current_activity === highest_activity) {
              dispatch(incrementHighestActivity());
            }
            history.replaceState(null, "", "#" + (current_activity + 1));
          }
        }}
      >
        Save and Continue
        <ArrowRightIcon className="!text-primary-foreground" />
      </button>
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="bg-secondary border-secondary-border">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🎉 Lesson Complete! 🎉
            </DialogTitle>
            <DialogDescription className="text-center">
              Great job! You've finished the lesson!
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <button
              className="bg-primary text-primary-foreground w-full rounded-lg p-3"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              Back to Dashboard
            </button>
            <button
              className="hover:bg-muted w-full rounded-lg p-2"
              onClick={() => setShowComplete(false)}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Lesson({ loaderData }: Route.ComponentProps) {
  const dispatch = useDispatch();

  const { hash } = useLocation();
  const activity = useSelector(
    (state: RootState) =>
      state.lesson.lesson?.activities[state.lesson.current_activity - 1],
  );
  const lesson_id = useSelector((state: RootState) => state.lesson.lesson?.id);

  // We only want to update the lesson slice when the data loads, no other time
  useEffect(() => {
    if (loaderData) {
      {
        document.title = loaderData.lesson.title + " | FORWARD";
        if (loaderData.lesson.id != lesson_id) {
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
    <div className="m-4 lg:mr-8 flex w-full max-w-screen flex-col items-center gap-4 lg:mt-7 lg:mb-12 lg:ml-24 lg:flex-row lg:items-start lg:gap-8">
      <TableOfContents />
      <div className="bg-secondary border-secondary-border text-secondary-foreground flex min-h-min w-full min-w-0 flex-col rounded-3xl border-1 p-4">
        <h1 className="text-2xl font-bold">
          <span className="text-accent">
            {ActivityTypeDisplayNames[activity?.type || "Default"]}:{" "}
          </span>
          {activity?.title}
        </h1>
        {activity?.instructions && (
          <MarkdownTTS
            className="mb-6 font-light italic"
            controlsClassName="flex flex-col mt-2 lg:mt-0 lg:flex-row-reverse justify-between"
            controlsOrientation="horizontal"
          >
            {activity.instructions}
          </MarkdownTTS>
        )}
        {activity?.instructions_image && (
          <img
            className="mb-4 h-auto max-h-100 w-auto max-w-full rounded-xl object-contain"
            src={activity.instructions_image}
            alt=""
          ></img>
        )}
        {activity && <Activity activity={activity} />}
        <NextActivity />
      </div>
    </div>
  );
}

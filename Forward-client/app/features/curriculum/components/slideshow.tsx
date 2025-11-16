import type {
  Slideshow as SlideshowType,
  SlideshowResponse,
} from "@/features/curriculum/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import MarkdownTTS from "@/components/ui/markdown-tts";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ArrowRight, Circle, Lock } from "lucide-react";
import { useResponse } from "../hooks";
import { useIsMobile } from "@/hooks/useClient";
import { srcsetOf } from "@/utils/utils";
import CircularProgress from "@/components/ui/cprogress";

function NextSlide({
  goNext,
  highestSlideCompleted,
  ref,
  timeToWait,
  paused,
  className,
}: {
  goNext: () => void;
  timeToWait: number;
  paused: boolean;
  ref: React.Ref<unknown>;
  highestSlideCompleted: () => void;
  className?: string;
}) {
  const [remainingTime, setRemainingTime] = useState(timeToWait);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const highestSlideCompletedRef = useRef(highestSlideCompleted);
  useEffect(() => {
    highestSlideCompletedRef.current = highestSlideCompleted;
  }, [highestSlideCompleted]);

  const tick = useCallback(() => {
    setRemainingTime((prevRemainingTime) => {
      if (prevRemainingTime > 0.040) {
        return prevRemainingTime - 0.033;
      } else {
        highestSlideCompletedRef.current(); // Call the latest version of the function
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return 0;
      }
    });
  }, []);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      if (timerRef.current === null) {
        timerRef.current = setInterval(tick, 33);
      }
    }
  }, [paused, tick]);

  useImperativeHandle(ref, () => {
    return {
      resetTimer() {
        setRemainingTime(timeToWait);
      },
    };
  });

  const progressPct = ((timeToWait - remainingTime) / timeToWait) * 100;
  const isLocked = progressPct < 100;

  return (
    <button
      disabled={!paused && isLocked}
      onClick={() => goNext()}
      className={"disabled:pointer-events-none " + className}
    >
      {/* {remainingTime } */}
      <CircularProgress
        percentage={isLocked ? progressPct : 100}
        color={
          progressPct >= 100 || progressPct == 0
            ? "transparent"
            : "var(--accent)"
        }
        size={52}
        showTrack={false}
      >
        {!paused ? (
          <MemoizedLock className="bg-primary hover:bg-accent border-primary-border hover:border-accent flex items-center justify-center rounded-full border-1 p-[7px] active:brightness-90 lg:p-2" />
        ) : (
          <MemoizedArrowRight className="bg-primary hover:bg-accent border-primary-border hover:border-accent flex items-center justify-center rounded-full border-1 p-[7px] active:brightness-90 lg:p-2" />
        )}
      </CircularProgress>
    </button>
  );
}

// This is stupid but we wont spend time re-rendering these icons every time the timer ticks
const MemoizedLock = React.memo(({ className }: { className: string }) => (
  <div className={className}>
    <Lock stroke="var(--primary-foreground)" strokeWidth={4} size={16} />
  </div>
));
const MemoizedArrowRight = React.memo(
  ({ className }: { className: string }) => (
    <div className={className}>
      <ArrowRight
        stroke="var(--primary-foreground)"
        strokeWidth={4}
        size={16}
      />
    </div>
  ),
);

export default function Slideshow({ slideshow }: { slideshow: SlideshowType }) {
  const [api, setApi] = useState<CarouselApi>();
  const isMobile = useIsMobile(1610);

  //slide 0 is first
  const [response, setResponse] = useResponse<SlideshowResponse, SlideshowType>(
    {
      activity: slideshow,
      initialFields: {
        partial_response: slideshow.force_wait != 0,
        highest_slide: slideshow.force_wait == 0 ? -1 : 0,
      },
    },
  );

  const [highestSlideUnlocked, setHighestSlideUnlocked] = useState(
    response.highest_slide >= 0 ? response.highest_slide : 0,
  );

  const [current, setCurrent] = useState(
    response.highest_slide >= 0 ? response.highest_slide : 0,
  );

  const countdownRefMethods = useRef<{ resetTimer: () => void }>(null);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());

    const onSelect = () => {
      const newSlideIndex = api.selectedScrollSnap();
      setCurrent(newSlideIndex);

      if (slideshow.force_wait > 0 && newSlideIndex > response.highest_slide) {
        countdownRefMethods.current?.resetTimer();
        setResponse((prev) => {
          const next = Math.min(
            prev.highest_slide + 1,
            slideshow.slides.length,
          );
          return {
            ...prev,
            highest_slide: next,
          };
        });
      }
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api, response.highest_slide]);

  const highestSlideCompleted = useCallback(() => {
    setHighestSlideUnlocked((prev) => {
      const next = Math.min(prev + 1, slideshow.slides.length);
      return next;
    });
    if (slideshow.autoplay && slideshow.force_wait !== 0 && api) {
      /* SUPER hacky fix:
      * we have to do this because the carousel's internal state lags behind when autoplaying
      * and setHighestSlideUnlocked is async
      */
      setTimeout(() => api.scrollNext(), 100);
    }
    if (current === slideshow.slides.length - 1) {
      setResponse((prev) => ({
        ...prev,
        highest_slide: slideshow.slides.length,
        partial_response: false,
      }));
    }
  }, [slideshow.slides.length, current, slideshow.autoplay, api]);

  return (
    <div className="mt-10 flex w-full flex-col-reverse items-center gap-2 lg:mt-4 lg:flex-col">
      {slideshow.autoplay &&  slideshow.force_wait != 0 &&<span className="text-muted-foreground italic">autoplay is enabled for this slideshow</span>}
      <Carousel
        setApi={setApi}
        className="w-full max-w-xs md:max-w-2xl lg:max-w-4xl"
        // The below disables dragging on force wait, but because we are slicing the slides array to only unlocked slides,
        // it is not nessecary. Leaving it commented out for now in case we want to revisit this behavior.
        opts={
          {
            watchDrag: !slideshow.autoplay || slideshow.force_wait == 0,
          }
        }
      >
        <CarouselContent>
          {(slideshow.force_wait == 0 || slideshow.autoplay
            ? slideshow.slides
            : slideshow.slides.slice(0, highestSlideUnlocked + 1)
          ).map((example, index) => (
            <CarouselItem
              key={index}
              className="flex flex-col items-center justify-center gap-4"
            >
              {example.image && (
                <img
                  src={example.image.thumbnail}
                  srcSet={srcsetOf(example.image)}
                  sizes="(max-width: 1020px) 82vw, 31vw"
                  alt=""
                  className="max-h-100 w-auto rounded-3xl shadow-md"
                />
              )}

              <MarkdownTTS controlsClassName="flex flex-row-reverse gap-2">
                {example.content}
              </MarkdownTTS>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious
          className={isMobile ? "absolute -top-5.5 left-16" : ""}
        />

        {slideshow.force_wait == 0 ||
        response.highest_slide > slideshow.slides.length - 1 ? (
          <CarouselNext
            className={isMobile ? "absolute -top-5.5 right-16" : ""}
          />
        ) : (
          <NextSlide
            goNext={api ? api.scrollNext : () => {}}
            timeToWait={slideshow.force_wait}
            paused={highestSlideUnlocked !== current}
            ref={countdownRefMethods}
            highestSlideCompleted={highestSlideCompleted}
            className={
              isMobile
                ? "absolute -top-12 right-16"
                : "absolute top-1/2 -right-[6px] translate-x-full -translate-y-1/2"
            }
          />
        )}
      </Carousel>

      {/* Dots (desktop only) */}
      <div className="hidden lg:flex">
        {Array.from({ length: slideshow.slides.length }, (_, index) => (
          <button
            disabled={
              !(slideshow.force_wait == 0 || index <= highestSlideUnlocked)
            }
            key={index}
            onClick={() => api?.scrollTo(index)}
            className="cursor-pointer disabled:!cursor-not-allowed"
            aria-label={`Go to slide ${index}`}
          >
            <Circle
              fill={
                index !== current
                  ? slideshow.force_wait == 0 || index <= highestSlideUnlocked
                    ? "var(--success)"
                    : "transparent"
                  : "var(--accent)"
              }
              strokeWidth={1}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

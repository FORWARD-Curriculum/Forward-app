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
import {
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
  className
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
      if (prevRemainingTime > 0.017) {
        return prevRemainingTime - 0.016;
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
        timerRef.current = setInterval(tick, 16);
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
    <button disabled={!paused && isLocked} onClick={() => goNext()} className={"hover:brightness-110 "+className}>
      <CircularProgress
        percentage={isLocked ? progressPct : 100}
        color="var(--accent)"
        size={40}
      >
        {!paused ? (
          <Lock stroke={"var(--secondary-foreground)"} strokeWidth={3} size={16} />
        ) : (
          <ArrowRight
            stroke={"var(--secondary-foreground)"}
            strokeWidth={4}
            size={16}
          />
        )}
      </CircularProgress>
    </button>
  );
}

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

      // console.log({ newSlideIndex, highest_slide: response.highest_slide });

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
    console.log({ current, length: slideshow.slides.length });
    if (current === slideshow.slides.length - 1) {
      setResponse((prev) => ({
        ...prev,
        highest_slide: slideshow.slides.length,
        partial_response: false,
      }));
    }
  }, [slideshow.slides.length, current]);

  return (
    <div className="mt-10 flex w-full flex-col-reverse items-center gap-2 lg:mt-4 lg:flex-col">
      <Carousel
        setApi={setApi}
        className="w-full max-w-xs md:max-w-2xl lg:max-w-4xl"
        // The below disables dragging on force wait, but because we are slicing the slides array to only unlocked slides,
        // it is not nessecary. Leaving it commented out for now in case we want to revisit this behavior.
        opts={{
          // watchDrag: slideshow.force_wait == 0 || highestSlideUnlocked > slideshow.slides.length - 1,
        }}
      >
        <CarouselContent>
          {(slideshow.force_wait == 0 ? slideshow.slides : slideshow.slides.slice(0,highestSlideUnlocked+1)).map((example, index) => (
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

        {slideshow.force_wait == 0 || response.highest_slide > slideshow.slides.length - 1 ? (
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
            className={isMobile ? "absolute -top-10.5 right-16" : "-right-4 absolute top-1/2 -translate-y-1/2 translate-x-full"}
          />
        )}
      </Carousel>

      {/* Dots (desktop only) */}
      <div className="hidden lg:flex">
        {Array.from({ length: slideshow.slides.length }, (_, index) => (
          <button
            disabled={slideshow.force_wait != 0 && index > highestSlideUnlocked}
            key={index}
            onClick={() => api?.scrollTo(index)}
            className="cursor-pointer disabled:cursor-not-allowed"
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

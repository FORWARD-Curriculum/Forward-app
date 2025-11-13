import type { Slideshow as SlideshowType, SlideshowResponse } from "@/features/curriculum/types";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useEffect, useState } from "react";
import { Circle } from "lucide-react";
import { useResponse } from "../hooks";
import { useIsMobile } from "@/hooks/useClient";
import { srcsetOf } from "@/utils/utils";

export default function Slideshow({ slideshow }: { slideshow: SlideshowType }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const isMobile = useIsMobile(1610);

  useResponse<SlideshowResponse, SlideshowType>({
    activity: slideshow,
    initialFields: {
      partial_response: false,
    },
  });

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="flex w-full flex-col-reverse items-center lg:flex-col mt-10 lg:mt-4 gap-2">
            <Carousel setApi={setApi} className="w-full max-w-xs md:max-w-2xl lg:max-w-4xl ">
        <CarouselContent>
          {slideshow.slides.map((example, index) => (
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
        <CarouselPrevious className={isMobile?"-top-5.5 left-16 absolute":""}  />
        <CarouselNext className={isMobile?"-top-5.5 right-16 absolute":""}/>
      </Carousel>
      {/* Dots (desktop only) */}
      <div className="hidden lg:flex">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className="cursor-pointer"
            aria-label={`Go to slide ${index + 1}`}
          >
            <Circle
              fill={
                index + 1 !== current
                  ? "var(--secondary-foreground)"
                  : "var(--background)"
              }
              strokeWidth={1}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
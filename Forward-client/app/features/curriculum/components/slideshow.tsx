import type { Slideshow, SlideshowResponse } from "@/features/curriculum/types";
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

export default function Slideshow({ slideshow }: { slideshow: Slideshow }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useResponse<SlideshowResponse, Slideshow>({
    activity: slideshow,
    type: "Slideshow",
    trackTime: true,
    initialFields:{
        partial_response: false
    }
  })

  useEffect(() => {
    if (!api) {
      return;
    }
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);
  return (
    <div
      className="flex flex-col-reverse lg:flex-col lg:items-end items-center"
    >
      <div className="lg:flex hidden">
        {Array.from({ length: count }, (_, index) => (
          <button
            onClick={() => api?.scrollTo(index)}
            className="cursor-pointer"
          >
            <Circle
              fill={
                index + 1 != current
                  ? "var(--secondary-foreground)"
                  : "var(--background)"
              }
            //   stroke="transparent"
              strokeWidth={1}
            />
          </button>
        ))}
      </div>
      <Carousel
        setApi={setApi}
        className="flex lg:aspect-video lg:!max-h-min items-center lg:px-12"
      >
        <CarouselContent className="lg:aspect-video">
          {slideshow.slides.map((example, index) => (
            <CarouselItem className="flex flex-col items-center lg:justify-center gap-4">
              {example.image && (
                <img
                  src={example.image}
                  className="lg:max-h-3/4 lg:max-w-auto rounded-3xl shadow-md"
                />
              )}

              <MarkdownTTS controlsClassName="flex flex-row-reverse gap-2">
                {`:::center\n # ${example.content}\n:::`}
              </MarkdownTTS>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-1 lg:top-[inherit] top-105" />
        <CarouselNext className="absolute right-1 lg:top-[inherit] top-105" />
      </Carousel>
    </div>
  );
}

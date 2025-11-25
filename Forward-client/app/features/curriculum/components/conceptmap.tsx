import { Skeleton } from "@/components/ui/skeleton";
import { type ConceptMapResponse, type ConceptMap } from "../types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import MarkdownTTS from "@/components/ui/markdown-tts";
import { useResponse } from "../hooks";
import { useIsMobile } from "@/hooks/useClient";
import { MousePointerClick, Pointer } from "lucide-react";
import { srcsetOf } from "@/utils/utils";
import FwdImage from "@/components/ui/fwdimage";

export default function ConceptMap({ conceptmap }: { conceptmap: ConceptMap }) {
  useResponse<ConceptMapResponse, ConceptMap>({
    activity: conceptmap,
    initialFields: { partial_response: false },
  });
  const isMobile = useIsMobile();

  return (
    <div>
      <MarkdownTTS controlsClassName="flex gap-2">
        {conceptmap.content}
      </MarkdownTTS>
      <div className="my-10 flex flex-col items-start justify-evenly gap-12 lg:flex-row lg:gap-4 ">
        {conceptmap.concepts.map((concept, index) => (
          <div
            key={index}
            className="flex w-full grow flex-col items-center gap-6"
          >
            <Popover>
              <PopoverTrigger asChild className={`${concept.examples.length>0 ?"cursor-pointer":" pointer-events-none cursor-default"}`}>
                {concept.image ? (
                  <div
                    className={
                      "relative active:brightness-95 " +
                      (isMobile
                        ? "active:scale-98"
                        : "")
                    }
                  >
                    <FwdImage image={concept.image} className="aspect-square w-full rounded-3xl shadow-md" disableInteractive />
                    {concept.examples.length<1 ? "":isMobile ?
                    <Pointer
                      className="absolute bottom-3 left-3 text-white drop-shadow-[0px_0px_2px_rgba(0,0,0,1)] filter"
                      color="white"
                    />:<MousePointerClick className="absolute bottom-3 left-3 text-white drop-shadow-[0px_0px_2px_rgba(0,0,0,1)] filter"
                    color="white"/>}
                  </div>
                ) : (
                  <Skeleton className="aspect-square w-full" />
                )}
              </PopoverTrigger>
              {concept.examples.length>0 &&
              <PopoverContent
                side="top"
                align="center"
                sideOffset={-200}
                className=" duration-75 bg-foreground flex w-100 flex-col items-center text-secondary-foreground"
              >
                <h2 className="text-lg font-semibold">Examples</h2>
                <Carousel className="w-full">
                  <CarouselContent>
                    {concept.examples.map((example, index) => (
                      <CarouselItem
                        key={index}
                        className="flex flex-col items-center justify-center gap-4"
                      >
                        <FwdImage image={example.image} sizes="25vh" className="aspect-square w-60 rounded-3xl shadow-md" />
                        <MarkdownTTS controlsClassName="flex gap-2" className=" [&_h1]:font-semibold [&_h1]:text-lg">{`:::center\n # ${example.name}\n:::\n\n${example.description}`}
                        </MarkdownTTS>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-1" />
                  <CarouselNext className="absolute right-1" />
                </Carousel>
              </PopoverContent>}
            </Popover>
            <MarkdownTTS controlsClassName="flex gap-2" className=" [&_h1]:font-semibold [&_h1]:text-lg">{`:::center\n # ${concept.title}\n:::\n\n${concept.description}`}
            </MarkdownTTS>
          </div>
        ))}
      </div>
    </div>
  );
}

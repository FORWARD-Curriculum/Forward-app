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
import { useClient } from "@/hooks/useClient";
import { Pointer } from "lucide-react";

export default function ConceptMap({ conceptmap }: { conceptmap: ConceptMap }) {
  useResponse<ConceptMapResponse, ConceptMap>({
    type: "ConceptMap",
    activity: conceptmap,
    initialFields: { partial_response: false },
  });
  const client = useClient();

  return (
    <div className="concept-map">
      <MarkdownTTS controlsClassName="flex gap-2">
        {conceptmap.content}
      </MarkdownTTS>
      <div className="my-10 flex flex-col items-start justify-evenly gap-12 lg:flex-row lg:gap-4">
        {conceptmap.concepts.map((concept, index) => (
          <div
            key={index}
            className="flex w-full grow flex-col items-center gap-6"
          >
            <Popover>
              <PopoverTrigger asChild className="cursor-pointer">
                {concept.image ? (
                  <div
                    className={
                      "relative active:brightness-95 " +
                      (client.isMobile
                        ? "active:scale-98"
                        : "")
                    }
                  >
                    <img
                      src={concept.image}
                      className="aspect-square w-full rounded-3xl shadow-md"
                    />
                    {client.isMobile &&
                    <Pointer
                      className="absolute bottom-3 left-3 text-white drop-shadow-[0px_0px_2px_rgba(0,0,0,1)] filter"
                      color="white"
                    />}
                  </div>
                ) : (
                  <Skeleton className="aspect-square w-full" />
                )}
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="center"
                sideOffset={-200}
                className=" duration-75 bg-foreground flex w-100 flex-col items-center"
              >
                <h2 className="text-lg font-semibold">Examples</h2>
                <Carousel className="w-full">
                  <CarouselContent>
                    {concept.examples.map((example, index) => (
                      <CarouselItem
                        key={index}
                        className="flex flex-col items-center justify-center gap-4"
                      >
                        {example.image ? (
                          <img
                            src={example.image}
                            className="aspect-square w-60 rounded-3xl shadow-md"
                          />
                        ) : (
                          <Skeleton className="aspect-square w-full" />
                        )}
                        <MarkdownTTS controlsClassName="flex gap-2" className=" [&_h1]:font-semibold [&_h1]:text-lg">{`:::center\n # ${example.name}\n:::\n\n${example.description}`}
                        </MarkdownTTS>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-1" />
                  <CarouselNext className="absolute right-1" />
                </Carousel>
              </PopoverContent>
            </Popover>
            <MarkdownTTS controlsClassName="flex gap-2" className=" [&_h1]:font-semibold [&_h1]:text-lg">{`:::center\n # ${concept.title}\n:::\n\n${concept.description}`}
            </MarkdownTTS>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import type { ConceptMap } from "../types";
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

export default function ConceptMap({ conceptmap }: { conceptmap: ConceptMap }) {
  return (
    <div className="concept-map">
      <MarkdownTTS controlsClassName="flex gap-2">{conceptmap.content}</MarkdownTTS>
      <div className="my-10 flex flex-row items-end justify-evenly gap-4">
        {conceptmap.concepts.map((concept, index) => (
          <div key={index} className="flex w-full grow flex-col items-center gap-6">
            <Popover>
              <PopoverTrigger asChild className="cursor-pointer">
                {
                  concept.image ? <img src={concept.image}  className="aspect-square w-full rounded-3xl shadow-md" /> :  <Skeleton className="aspect-square w-full" />
                }
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="center"
                sideOffset={-200}
                className="bg-foreground w-100 flex flex-col items-center"
              >
                <h2 className="font-semibold text-lg">Examples</h2>
                <Carousel className="w-full">
                  <CarouselContent>
                    {concept.examples.map((example, index) => (
                      <CarouselItem key={index} className="flex flex-col items-center justify-center gap-4">
                        {example.image ? (
                          <img src={example.image} className="aspect-square w-60 rounded-3xl shadow-md" />
                        ) : (
                          <Skeleton className="aspect-square w-full" />
                        )}
                        <h3 className="text-lg font-semibold">{example.name}</h3>
                        <MarkdownTTS controlsClassName="flex gap-2">{example.description}</MarkdownTTS>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-1"/>
                  <CarouselNext className="absolute right-1"/>
                </Carousel>
              </PopoverContent>
            </Popover>

            <h3 className="text-lg font-semibold">{concept.title}</h3>
            <MarkdownTTS controlsClassName="flex gap-2">{concept.description}</MarkdownTTS>
          </div>
        ))}
      </div>
    </div>
  );
}

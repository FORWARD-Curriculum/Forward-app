import type {
  Identification,
  IdentificationResponse,
} from "@/features/curriculum/types";
import { useResponse } from "@/features/curriculum/hooks";
import { useCallback, useMemo, useState } from "react";
// import { DialogTrigger, Dialog, DialogContent } from "@radix-ui/react-dialog";
import {
  DialogTrigger,
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/useClient";
import { CircleX, Pointer } from "lucide-react";
import { srcsetOf } from "@/utils/utils";

/**
 * Converts an area array to a stable string key.
 * @example areaToKey([0.1, 0.2, 0.3, 0.4]) === "0.1,0.2,0.3,0.4"
 */
const areaToKey = (area: number[]) => area.join(",");

function Box({
  box,
  className,
  clickedMap,
  dimsMap,
  handleClick,
  isDialog = false,
}: {
  box: Identification["content"][0];
  className?: string;
  clickedMap: Map<string, boolean>;
  dimsMap: Map<string, { widthPct: number; heightPct: number }>;
  handleClick: (area: [number, number, number, number]) => void;
  isDialog?: boolean;
}) {
  return (
    <div
      className={`relative ${isDialog ? "w-fit" : (className ?? "")} shadow-lg`}
    >
      <img
        src={isDialog ? box.image.original : box.image.thumbnail}
        srcSet={isDialog ? undefined : srcsetOf(box.image)}
        sizes={isDialog ? "100vw":"76vw"}
        className={`block h-auto ${isDialog ? "max-w-[300vw]" : "w-full"}`}
        alt=""
      />
      <div className="absolute inset-0">
        {box.areas?.map((a) => {
          const key = areaToKey(a);
          return (
            <div
              key={key}
              className={`absolute ${
                clickedMap.get(key)
                  ? "border-3 border-yellow-300 bg-yellow-300/40"
                  : box.hints
                    ? "cursor-pointer"
                    : ""
              }`}
              onClick={() => handleClick(a)}
              style={{
                width: `${dimsMap.get(key)?.widthPct ?? 0}%`,
                height: `${dimsMap.get(key)?.heightPct ?? 0}%`,
                left: `${a[0]}%`,
                top: `${a[1]}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function IdentificationItem({
  box,
  incrementIdentified,
  className,
  isMobile,
}: {
  box: Identification["content"][0];
  incrementIdentified: () => void;
  className?: string;
  isMobile?: boolean;
}) {
  const [clickedMap, setClickedMap] = useState<Map<string, boolean>>(
    new Map(box.areas?.map((c) => [areaToKey(c), false])),
  );

  const dimsMap = useMemo(
    () =>
      new Map<string, { widthPct: number; heightPct: number }>(
        box.areas?.map((c) => [
          areaToKey(c),
          {
            widthPct: Math.abs(c[2] - c[0]),
            heightPct: Math.abs(c[3] - c[1]),
          },
        ]),
      ),
    [box],
  );

  const handleClick = useCallback(
    (area: [number, number, number, number]) => {
      const key = areaToKey(area);
      if (clickedMap.get(key)) return;
      setClickedMap((old) => {
        const next = new Map(old);
        next.set(key, true);
        return next;
      });
      incrementIdentified();
    },
    [incrementIdentified],
  );

  return isMobile ? (
    <Dialog>
      <DialogTrigger className="relative">
        <Box
          box={box}
          className={className}
          clickedMap={clickedMap}
          dimsMap={dimsMap}
          handleClick={handleClick}
        />
        <Pointer
                      className="absolute bottom-3 left-3 text-white drop-shadow-[0px_0px_2px_rgba(0,0,0,1)] filter"
                      color="white"
                    />
      </DialogTrigger>
      <DialogContent
        className="h-screen w-screen max-w-none gap-0 p-0"
        aria-describedby={undefined}
        hideCloseIcon
      >
        <DialogClose
          asChild
          className="fixed right-5 z-[99999999999] p-1"
          style={{
            bottom:
              CSS?.supports?.("bottom", "env(safe-area-inset-bottom)")
                ? "calc(env(safe-area-inset-bottom) + 20px)"
                : "20px",
          }}
        >
          <CircleX size={60} className="bg-secondary rounded-full active:bg-muted active:shadow-xs shadow-lg" />
        </DialogClose>
        <DialogTitle />
        <div className="h-screen w-screen overflow-auto">
          <Box
            box={box}
            className={className}
            clickedMap={clickedMap}
            dimsMap={dimsMap}
            handleClick={handleClick}
            isDialog
          />
        </div>
      </DialogContent>
    </Dialog>
  ) : (
    <Box
      box={box}
      className={className}
      clickedMap={clickedMap}
      dimsMap={dimsMap}
      handleClick={handleClick}
    />
  );
}

export default function Identification({
  identification,
}: {
  identification: Identification;
}) {
  const [response, setResponse] = useResponse<
    IdentificationResponse,
    Identification
  >({
    activity: identification,
    initialFields: {
      identified: 0,
      partial_response: true,
    },
  });

  const totalIdents = useMemo(
    () =>
      identification.content.reduce(
        (total, box) => total + (box.areas?.length || 0),
        0,
      ),
    [identification.content],
  );

  const isMobile = useIsMobile(1200);

  const incrementIdentified = useCallback(() => {
    const newIdentified = response.identified + 1;
    if (newIdentified <= totalIdents) {
      setResponse((prev) => ({
        ...prev,
        identified: newIdentified,
        partial_response:
          prev.partial_response === false ?
            false :
            newIdentified < (identification.minimum_correct || totalIdents),
      }));
    }
  }, [response, identification.minimum_correct]);

  return (
    <div className="mb-4 flex flex-col items-center gap-6 p-4">
      {identification.content.map((box) => (
        <IdentificationItem
          box={box}
          incrementIdentified={incrementIdentified}
          isMobile={isMobile}
        />
      ))}
      <span className=" text-muted-foreground">{response.identified} / {identification.minimum_correct || totalIdents} areas identified</span>
    </div>
  );
}

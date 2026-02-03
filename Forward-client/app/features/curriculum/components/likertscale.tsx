import type React from "react";
import { useRef, useCallback } from "react";
import type { LikertScale, LikertScaleResponse } from "../types";
import { useResponse } from "../hooks";

export default function LikertScale({
  likertScale,
}: {
  likertScale: LikertScale;
}) {
  const debounceTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const [response, setResponse] = useResponse<LikertScaleResponse, LikertScale>(
    {
      activity: likertScale,
      initialFields: {
        content: {
          selection: new Array(likertScale.content.length).fill(null),
          explanation: null,
        },
      },
    },
  );

  const handleExplainChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse((old) => ({
      ...old,
      content: {
        ...old.content,
        explanation: e.target.value,
      },
    }));
  };

  const handleRangeInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>, index: number): void => {
      const el = e.currentTarget;
      const minVal = Number(el.min) || 0;
      const maxVal = Number(el.max) || 1;
      const val = Number(el.value);
      const isContinuous = el.step === "any";

      const pct = ((val - minVal) / (maxVal - minVal)) * 100;
      el.style.setProperty("--progress", `${pct}%`);

      const updateState = () => {
        setResponse((old) => {
          const newSelection = [...old.content.selection];
          newSelection[index] = val;
          const all_answered = newSelection.every(v=>v!==null);
          return {
            ...old,
            content: {
              ...old.content,
              selection: newSelection,
            },
            partial_response: !all_answered,
          };
        });
      };

      if (isContinuous) {
        if (debounceTimers.current[index]) {
          clearTimeout(debounceTimers.current[index]);
        }
        debounceTimers.current[index] = setTimeout(updateState, 250);
      } else {
        updateState();
      }
    },
    [setResponse],
  );

  return (
    <div className="likert-scale mb-6">
      <div className="flex flex-col gap-6 px-4 md:px-10">
        {likertScale.content.map((item, index) => {
          const scale = item.scale;
          const n = scale.length;
          const min = 0;
          const max = Math.max(0, n - 1);
          const step = likertScale.content[index].continuous ? "any" : 1;
          const defaultValue = response.content.selection[index] ?? 0;
          const initialPercent =
            max > min ? ((defaultValue - min) / (max - min)) * 100 : 0;

          const progressStyle = {
            ["--progress" as any]: `${initialPercent}%`,
          } as React.CSSProperties;

          const rangeId = `likert-scale-${likertScale.id}-${index}`;

          return (
            <div
              key={index}
              className="group bg-background/70 space-y-4 rounded-3xl border border-gray-200/60 px-10 pt-3 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
              role="group"
              aria-labelledby={`${rangeId}-label`}
            >
              <span
                id={`${rangeId}-label`}
                className="text-fg flex items-center gap-2 text-lg font-semibold tracking-tight"
              >
                <p className="bg-accent text-secondary flex aspect-square w-8 min-w-8 items-center justify-center rounded-full">
                  {index + 1}
                </p>
                {item.statement}
              </span>

              <div className="mt-2 px-1 md:px-2">
                <input
                  id={rangeId}
                  type="range"
                  list={rangeId}
                  min={min}
                  max={max}
                  step={step}
                  defaultValue={defaultValue}
                  onInput={(e) => handleRangeInput(e, index)}
                  className="likert-range mx-1 w-[calc(100%-0.5rem)] cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
                  style={{
                    ...progressStyle,
                    ["--track-h" as any]: "0.75rem",
                    ["--thumb" as any]: "1.75rem",
                  }}
                  aria-valuemin={min}
                  aria-valuemax={max}
                  aria-valuenow={defaultValue}
                />

                <div className="relative pt-8">
                  <div className="pointer-events-none absolute top-2 right-1 left-1">
                    {scale.map((option, i) => {
                      const pct = n > 1 ? (i / (n - 1)) * 98 + 0.95 : 0;
                      return (
                        <span
                          key={i}
                          className="1w absolute max-w-2 -translate-x-1/2 text-center text-xs/5 lg:max-w-48 lg:text-xs"
                          style={{ left: `${pct}%` }}
                        >
                          {option}
                        </span>
                      );
                    })}
                  </div>

                  <datalist id={rangeId}>
                    {scale.map((_, i) => (
                      <option key={i} value={i} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          );
        })}
        <textarea
          placeholder="Explain your choice"
          className="bg-background/70 text-fg mt-2 w-full resize-y rounded-xl border border-gray-200 p-3 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          value={response.content.explanation || ""}
          onChange={handleExplainChange}
        />
      </div>
    </div>
  );
}
import type React from "react";
import type { LikertScale, LikertScaleResponse } from "../types";
import { useResponse } from "../hooks";

export default function LikertScale({
  likertScale,
}: {
  likertScale: LikertScale;
}) {
  // State intentionally omitted per instructions
  const [response, setResponse] = useResponse<LikertScaleResponse,LikertScale>({
    type: "LikertScale",
    activity: likertScale,
    initialFields: {content: new Array(likertScale.content.length).fill({})},
  });

  return (
    <div className="likert-scale mb-6">
      <p className="mb-6 text-sm">{likertScale.instructions}</p>

      <div className="flex flex-col gap-6 px-4 md:px-10">
        {likertScale.content.map((item, index) => {
          const scale = item.scale;
          const n = scale.length;
          const min = 0;
          const max = Math.max(0, n - 1);
          const step = 1;
          const defaultValue = Math.round((min + max) / 2);
          const initialPercent =
            max > min ? ((defaultValue - min) / (max - min)) * 100 : 0;

          const progressStyle = {
            ["--progress" as any]: `${initialPercent}%`,
          } as React.CSSProperties;

          const handleRangeInput = (
            e: React.FormEvent<HTMLInputElement>, index: number
          ): void => {
            const el = e.currentTarget;
            const minVal = Number(el.min) || 0;
            const maxVal = Number(el.max) || 1;
            const val = Number(el.value);
            const pct = ((val - minVal) / (maxVal - minVal)) * 100;
            el.style.setProperty("--progress", `${pct}%`);

            setResponse((old)=>{
                const newResp = [...old.content];
                newResp[index] = {
                    ...newResp[index],
                    selection: val,
                };
                return {
                    ...old,
                    content: newResp,
                };
            })
          };

          const handleExplainChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
            setResponse((old)=>{
                const newResp = [...old.content];
                newResp[index] = {
                    ...newResp[index],
                    explaination: e.target.value,
                };
                return {
                    ...old,
                    content: newResp,
                };
            })
          };

          const rangeId = `likert-scale-${likertScale.id}-${index}`;

          return (
            <div
              key={index}
              className="group bg-background/70 space-y-4 rounded-3xl border border-gray-200/60 px-10 py-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
              role="group"
              aria-labelledby={`${rangeId}-label`}
            >
              <span
                id={`${rangeId}-label`}
                className="text-fg flex items-center gap-2 text-lg font-semibold tracking-tight"
              >
                <p className="bg-accent text-secondary flex aspect-square w-8 items-center justify-center rounded-full">
                  {index + 1}
                </p>
                {item.statement}
              </span>

              {/* Slider */}
              <div className="mt-2 px-1 md:px-2">
                <input
                  id={rangeId}
                  type="range"
                  list={rangeId}
                  min={min}
                  max={max}
                  step={step}
                  defaultValue={defaultValue}
                  onInput={(e)=>handleRangeInput(e,index)}
                  className="likert-range mx-1 w-[calc(100%-0.5rem)] cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
                  style={{
                    ...progressStyle,
                    ["--track-h" as any]: "0.75rem", // track thickness (8px)
                    ["--thumb" as any]: "1.75rem", // thumb size (20px)
                  }}
                  aria-valuemin={min}
                  aria-valuemax={max}
                  aria-valuenow={defaultValue}
                />

                <div className="relative pt-8">
                  {/* Labels container */}
                  <div className="pointer-events-none absolute top-2 right-1 left-1">
                    {scale.map((option, i) => {
                      const pct = n > 1 ? ((i / (n - 1)) * 98) + 0.95 : 0;
                      return (
                        <span
                          key={i}
                          className="1w absolute lg:max-w-15 max-w-2 -translate-x-1/2 text-center lg:text-xs text-xs/5"
                          style={{ left: `${pct}%` }}
                        >
                          {option}
                        </span>
                      );
                    })}
                  </div>

                  {/* Datalist (native ticks where supported) */}
                  <datalist id={rangeId}>
                    {scale.map((_, i) => (
                      <option key={i} value={i} />
                    ))}
                  </datalist>
                </div>
              </div>

              {item.explain && (
                <textarea
                  placeholder="Explain your choice"
                  className="bg-background/70 text-fg mt-2 w-full resize-y rounded-xl border border-gray-200 p-3 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    value={response.content[index]?.explaination || ""}
                    onChange={(e) => handleExplainChange(e, index)}

                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from "react";

const cleanPercentage = (percentage: number) => {
  const isNegativeOrNaN = !Number.isFinite(+percentage) || percentage < 0;
  const isTooHigh = percentage > 100;
  return isNegativeOrNaN ? 0 : isTooHigh ? 100 : +percentage;
};

const Circle = ({
  color,
  percentage,
  size = 200,
}: {
  percentage?: number;
  color?: string;
  size: number;
}) => {
  const r = size * 0.35;
  const circ = 2 * Math.PI * r;
  if (!percentage) percentage = 0;
  const strokePct = ((100 - percentage) * circ) / 100;
  return (
    <circle
      r={r}
      cx={size / 2}
      cy={size / 2}
      fill="transparent"
      stroke={strokePct !== circ ? color || "var(--accent, currentColor)" : ""}
      strokeWidth={size * 0.1}
      strokeDasharray={circ}
      strokeDashoffset={percentage ? strokePct : 0}
    ></circle>
  );
};

export default function CircularProgress({
  percentage,
  color,
  size = 200,
  children,
  className,
}: {
  percentage: number;
  color: string;
  size: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const pct = cleanPercentage(percentage);
  return (
    <svg width={size} height={size} className={className}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <Circle size={size} color="lightgrey" />
        <Circle size={size} color={color} percentage={pct} />
      </g>
      {children && (
        <foreignObject x={0} y={0} width={size} height={size}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            {children}
          </div>
        </foreignObject>
      )}
    </svg>
  );
};
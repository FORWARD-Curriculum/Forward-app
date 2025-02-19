import React from 'react';

const cleanPercentage = (percentage: number) => {
  const isNegativeOrNaN = !Number.isFinite(+percentage) || percentage < 0;
  const isTooHigh = percentage > 100;
  return isNegativeOrNaN ? 0 : isTooHigh ? 100 : +percentage;
};

const Circle = ({ color, percentage, size = 200 }: { percentage?: number; color?: string; size: number }) => {
  const r = size * 0.35; // Make radius relative to size
  const circ = 2 * Math.PI * r;
  if (!percentage) percentage = 0;
  const strokePct = ((100 - percentage) * circ) / 100;
  return (
    <circle
      r={r}
      cx={size / 2}
      cy={size / 2}
      fill="transparent"
      stroke={strokePct !== circ ? color : ""}
      strokeWidth={size * 0.1} // Make stroke width relative to size
      strokeDasharray={circ}
      strokeDashoffset={percentage ? strokePct : 0}
    ></circle>
  );
};

const Text = ({ percentage, size = 200 }: { percentage: number; size: number }) => {
  return (
    <text
      x="50%"
      y="50%"
      dominantBaseline="central"
      textAnchor="middle"
      fontSize={`${size * 0.15}px`} // Make font size relative to container size
    >
      {percentage.toFixed(0)}%
    </text>
  );
};
/**
 * A circle who's border represents something's progress
 * @param {number} percentage - 0-100
 * @returns 
 */
const Pie = ({ percentage, color, size = 200 }: { percentage: number; color: string; size: number }) => {
  const pct = cleanPercentage(percentage);
  return (
    <svg width={size} height={size}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <Circle size={size} color="lightgrey" />
        <Circle size={size} color={color} percentage={pct} />
      </g>
      <Text percentage={pct} size={size} />
    </svg>
  );
};

export default Pie;
"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { AssessmentDelta } from "@/lib/assessment/types";
import { loadFramework } from "@/lib/framework/config";

interface RadarChartProps {
  delta: AssessmentDelta | null;
}

export function AssessmentRadarChart({ delta }: RadarChartProps) {
  const config = loadFramework();

  const data = config.dimensions.map((dim) => ({
    dimension: dim.name.split(" ").slice(0, 2).join("\n"),
    fullName: dim.name,
    score: delta?.dimensions[dim.id]?.score ?? 0,
    fullMark: 5,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="rgba(139, 92, 246, 0.15)" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#a1a1aa", fontSize: 10 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 5]}
          tick={{ fill: "#71717a", fontSize: 9 }}
          tickCount={6}
        />
        <Radar
          name="Maturity"
          dataKey="score"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}

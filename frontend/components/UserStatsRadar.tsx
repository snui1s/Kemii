import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Sparkles } from "lucide-react";

interface UserStatsRadarProps {
  name: string;
  chartData: any[];
  config: { color: string };
}

export default function UserStatsRadar({
  name,
  chartData,
  config,
}: UserStatsRadarProps) {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
        <Sparkles size={20} className="opacity-50" />
        <span className="text-xs">No Stats Data</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
        <PolarGrid stroke="#94a3b8" strokeOpacity={0.2} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fill: "#64748b",
            fontSize: 9,
            fontWeight: "bold",
          }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 50]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name={name}
          dataKey="A"
          stroke={config.color}
          strokeWidth={2}
          fill={config.color}
          fillOpacity={0.4}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

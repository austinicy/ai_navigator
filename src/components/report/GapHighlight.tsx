import { AlertCircle } from "lucide-react";

interface GapHighlightProps {
  dimensionName: string;
  score: number;
  gaps: string[];
}

export function GapHighlight({ dimensionName, score, gaps }: GapHighlightProps) {
  return (
    <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <AlertCircle className="size-4 text-red-400 shrink-0" />
        <span className="text-sm font-semibold text-foreground">{dimensionName}</span>
        <span className="text-xs text-red-400 ml-auto">{score.toFixed(1)}/5.0</span>
      </div>
      <ul className="space-y-0.5">
        {gaps.map((gap, i) => (
          <li key={i} className="text-xs text-muted-foreground pl-6">
            • {gap}
          </li>
        ))}
      </ul>
    </div>
  );
}

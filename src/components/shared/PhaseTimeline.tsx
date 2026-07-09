import { RoadmapPhase } from "@/lib/roadmap/types";

interface PhaseTimelineProps {
  phases: RoadmapPhase[];
  activePhase?: number;
}

export function PhaseTimeline({ phases, activePhase }: PhaseTimelineProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {phases.map((phase, i) => (
        <div key={phase.id} className="flex items-center gap-2 flex-1">
          <div
            className={`flex-1 rounded-lg border p-3 transition-all ${
              i === activePhase
                ? "border-violet-500/60 bg-violet-500/10"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-violet-400">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-xs font-semibold text-foreground">{phase.name}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{phase.timeframe}</p>
          </div>
          {i < phases.length - 1 && (
            <div className="text-muted-foreground shrink-0">→</div>
          )}
        </div>
      ))}
    </div>
  );
}

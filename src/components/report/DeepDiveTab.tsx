import { FileText, MessageSquare, AlertTriangle } from "lucide-react";
import { AssessmentDelta } from "@/lib/assessment/types";
import { loadFramework } from "@/lib/framework/config";
import { getDimensionLevel } from "@/lib/assessment/scoring";

interface DeepDiveTabProps {
  delta: AssessmentDelta;
}

export function DeepDiveTab({ delta }: DeepDiveTabProps) {
  const config = loadFramework(delta.frameworkVersion);

  return (
    <div className="space-y-6">
      {config.dimensions.map((dim) => {
        const assessment = delta.dimensions[dim.id];
        if (!assessment || assessment.score === 0) return null;
        const level = getDimensionLevel(assessment.score);

        return (
          <div key={dim.id} className="border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">{dim.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Level {level.level}: {level.name}
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">{assessment.score.toFixed(1)}</div>
            </div>

            <div className="h-2 bg-muted/50 rounded-full overflow-hidden mb-4">
              <div
                className="h-full gradient-primary rounded-full"
                style={{ width: `${(assessment.score / 5) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Evidence</h4>
                <ul className="space-y-1">
                  {assessment.evidence.slice(0, 5).map((e) => (
                    <li key={e.id} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5">
                        {e.source === "document" ? (
                          <FileText className="size-3" />
                        ) : (
                          <MessageSquare className="size-3" />
                        )}
                      </span>
                      <span>{e.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Identified Gaps</h4>
                <ul className="space-y-1">
                  {assessment.gaps.map((gap, i) => (
                    <li key={i} className="text-xs text-red-400/80 flex items-start gap-1.5">
                      <AlertTriangle className="size-3 shrink-0 mt-0.5" />
                      <span>{gap}</span>
                    </li>
                  ))}
                  {assessment.gaps.length === 0 && (
                    <li className="text-xs text-emerald-400">No gaps identified</li>
                  )}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Criterion Scores</h4>
              <div className="grid grid-cols-3 gap-2">
                {dim.criteria.map((c) => {
                  const cScore = assessment.criterionScores[c.id];
                  return (
                    <div key={c.id} className="text-center rounded bg-muted/30 p-1.5">
                      <div className="text-[10px] text-muted-foreground truncate">{c.name}</div>
                      <div className="text-sm font-semibold text-foreground">
                        {cScore !== undefined ? cScore : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

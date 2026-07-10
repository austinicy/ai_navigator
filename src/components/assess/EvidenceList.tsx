import { FileText, MessageSquare } from "lucide-react";
import { AssessmentDelta } from "@/lib/assessment/types";

interface EvidenceListProps {
  delta: AssessmentDelta | null;
}

export function EvidenceList({ delta }: EvidenceListProps) {
  if (!delta) return null;

  const allEvidence = Object.values(delta.dimensions).flatMap((d) => d.evidence);
  const recent = allEvidence.slice(-5);

  return (
    <div className="border border-border rounded-lg p-3">
      <h3 className="text-xs font-semibold text-foreground mb-2">
        Recent Evidence
      </h3>
      <div className="space-y-1.5">
        {recent.map((e) => (
          <div key={e.id} className="flex items-start gap-2">
            <span className="text-[10px] text-muted-foreground shrink-0">
              {e.source === "document" ? (
                <FileText className="size-3" />
              ) : (
                <MessageSquare className="size-3" />
              )}
            </span>
            <span className="text-[11px] text-muted-foreground line-clamp-1">
              {e.text}
            </span>
          </div>
        ))}
        {recent.length === 0 && (
          <p className="text-[11px] text-muted-foreground/50 italic">
            No evidence collected yet
          </p>
        )}
      </div>
    </div>
  );
}

import { FileText, Radio, CheckCircle2, Hourglass } from "lucide-react";
import { AssessmentDelta } from "@/lib/assessment/types";

interface StatusBarProps {
  delta: AssessmentDelta | null;
  documentCount: number;
}

export function StatusBar({ delta, documentCount }: StatusBarProps) {
  const signals = delta?.signalsCollected ?? 0;
  const assessed = delta?.dimensionsAssessed ?? 0;
  const remaining = delta?.dimensionsRemaining ?? 7;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
      <div className="flex gap-4">
        <span className="inline-flex items-center gap-1"><Radio className="size-3" /> {signals} signals</span>
        <span className="inline-flex items-center gap-1"><FileText className="size-3" /> {documentCount} docs</span>
      </div>
      <div className="flex gap-4">
        <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3" /> {assessed}/7 assessed</span>
        {remaining > 0 && <span className="inline-flex items-center gap-1"><Hourglass className="size-3" /> {remaining} remaining</span>}
      </div>
    </div>
  );
}

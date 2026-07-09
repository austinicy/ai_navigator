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
        <span>📡 {signals} signals</span>
        <span>📄 {documentCount} docs</span>
      </div>
      <div className="flex gap-4">
        <span>✅ {assessed}/7 assessed</span>
        {remaining > 0 && <span>⏳ {remaining} remaining</span>}
      </div>
    </div>
  );
}

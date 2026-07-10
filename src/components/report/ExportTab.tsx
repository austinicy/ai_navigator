"use client";

import { useState } from "react";
import { Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientCard } from "@/components/shared/GradientCard";
import { AssessmentDelta } from "@/lib/assessment/types";
import { loadFramework } from "@/lib/framework/config";
import { calculateOverallScore, getDimensionLevel } from "@/lib/assessment/scoring";

interface ExportTabProps {
  delta: AssessmentDelta;
  orgName: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function ExportTab({ delta, orgName }: ExportTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const config = loadFramework();
  const overallScore = calculateOverallScore(delta.dimensions, config);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Use browser print-to-PDF for hackathon simplicity
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      const dimensionRows = config.dimensions
        .map((dim) => {
          const assessment = delta.dimensions[dim.id];
          const score = assessment?.score ?? 0;
          const level = getDimensionLevel(score);
          const gaps = assessment?.gaps.join(", ") ?? "None";
          const evidence = assessment?.evidence.map((e) => e.text).join("; ") ?? "N/A";
          return `
            <tr>
              <td style="padding:8px;border:1px solid #333;font-weight:600">${dim.name}</td>
              <td style="padding:8px;border:1px solid #333;text-align:center">${score.toFixed(1)} / 5.0</td>
              <td style="padding:8px;border:1px solid #333;text-align:center">Level ${level.level}: ${level.name}</td>
              <td style="padding:8px;border:1px solid #333;font-size:12px">${escapeHtml(gaps)}</td>
            </tr>`;
        })
        .join("");

      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Digital Transformation Report - ${escapeHtml(orgName)}</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0a0a; color: #fafafa; margin: 40px; }
    h1 { color: #2563eb; font-size: 28px; }
    h2 { color: #a1a1aa; font-size: 16px; margin-top: 30px; }
    .score { font-size: 48px; font-weight: bold; color: #2563eb; }
    .ai-score { font-size: 36px; font-weight: bold; color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th { background: #1a1a1a; padding: 8px; border: 1px solid #333; text-align: left; font-size: 12px; color: #a1a1aa; }
    .meta { color: #71717a; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>AI Transformation Navigator</h1>
  <p style="color:#a1a1aa;font-size:14px">Digital Transformation & AI Maturity Assessment Report</p>

  <div style="display:flex;gap:60px;margin:30px 0">
    <div>
      <p style="color:#71717a;font-size:12px">DIGITAL MATURITY SCORE</p>
      <p class="score">${overallScore.toFixed(1)}</p>
      <p style="color:#71717a;font-size:12px">out of 5.0</p>
    </div>
    <div>
      <p style="color:#71717a;font-size:12px">AI READINESS SCORE</p>
      <p class="ai-score">${delta.aiReadiness.score}</p>
      <p style="color:#71717a;font-size:12px">out of 100</p>
    </div>
  </div>

  <h2>Dimension Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Dimension</th>
        <th style="text-align:center">Score</th>
        <th style="text-align:center">Level</th>
        <th>Key Gaps</th>
      </tr>
    </thead>
    <tbody>${dimensionRows}</tbody>
  </table>

  <p class="meta">
    Organization: ${escapeHtml(orgName)} | Generated: ${new Date().toLocaleDateString()} |
    Framework: AI Transformation Navigator v${delta.frameworkVersion} |
    Grounded in: McKinsey DQ, Deloitte, MIT/Capgemini, Gartner, Microsoft MLOps, AWS ML Lens, Accenture, BCG, IDC, appliedAI, PwC, Google, Forrester, Adobe
  </p>
</body>
</html>`;

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center py-12">
      <GradientCard className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Export Report</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a print-ready PDF report for stakeholders
        </p>
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          className="gradient-primary text-white px-8"
        >
          {isGenerating ? (
            "Generating..."
          ) : (
            <span className="inline-flex items-center gap-2">
              <Download className="size-4" />
              Download PDF Report
            </span>
          )}
        </Button>
      </GradientCard>

      <div className="text-left space-y-3 mt-8">
        <h4 className="text-sm font-semibold text-foreground">Report includes:</h4>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li className="flex items-start gap-1.5"><Check className="size-3 text-primary shrink-0 mt-0.5" /> Overall Digital Maturity Score ({overallScore.toFixed(1)}/5.0)</li>
          <li className="flex items-start gap-1.5"><Check className="size-3 text-primary shrink-0 mt-0.5" /> AI Readiness Score ({delta.aiReadiness.score}/100)</li>
          <li className="flex items-start gap-1.5"><Check className="size-3 text-primary shrink-0 mt-0.5" /> 7-dimension breakdown with levels and gaps</li>
          <li className="flex items-start gap-1.5"><Check className="size-3 text-primary shrink-0 mt-0.5" /> Evidence-based scoring with sources</li>
          <li className="flex items-start gap-1.5"><Check className="size-3 text-primary shrink-0 mt-0.5" /> Framework provenance ({Object.keys(config.referenceFrameworks).length} reference models)</li>
        </ul>
      </div>
    </div>
  );
}

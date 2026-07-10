// src/components/methodology/__tests__/ScoreSimulator.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScoreSimulator } from "../ScoreSimulator";

describe("ScoreSimulator", () => {
  it("renders a slider for each strategy criterion", () => {
    render(<ScoreSimulator />);
    // strategy has 4 criteria: digital_vision, executive_sponsorship, investment_commitment, governance_structure
    expect(screen.getByLabelText(/Digital & AI Vision/i)).toBeTruthy();
    expect(screen.getByLabelText(/Executive Sponsorship/i)).toBeTruthy();
    expect(screen.getByLabelText(/Investment Commitment/i)).toBeTruthy();
    expect(screen.getByLabelText(/Transformation Governance/i)).toBeTruthy();
  });

  it("updates the dimension score when a slider changes", () => {
    render(<ScoreSimulator />);
    const scoreBefore = screen.getByTestId("dim-score").textContent;
    const slider = screen.getByLabelText(/Digital & AI Vision/i) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "5" } });
    const scoreAfter = screen.getByTestId("dim-score").textContent;
    expect(scoreAfter).not.toEqual(scoreBefore);
  });

  it("computes a score in the 1–5 range", () => {
    render(<ScoreSimulator />);
    // set all sliders to 5
    const sliders = screen.getAllByRole("slider");
    for (const s of sliders) fireEvent.change(s, { target: { value: "5" } });
    const score = parseFloat(screen.getByTestId("dim-score").textContent ?? "0");
    expect(score).toBeGreaterThan(4.9);
    expect(score).toBeLessThanOrEqual(5);
  });
});

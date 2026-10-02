/**
 * @jest-environment jsdom
 */
/**
 * The AI result renderer must turn arbitrary endpoint payloads into readable
 * UI — never a raw JSON dump.
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { AIResultView } from "@/components/ai/AIResultView";

describe("AIResultView", () => {
  it("renders a translation payload as labelled text, not JSON", () => {
    const payload = {
      success: true,
      original: "Your appointment is confirmed.",
      translation: "Su cita está confirmada.",
      targetLanguage: "Spanish",
      detectedSourceLanguage: "English",
    };

    const { container } = render(<AIResultView data={payload} />);

    expect(screen.getByText("Su cita está confirmada.")).toBeTruthy();
    expect(screen.getByText("Target language")).toBeTruthy();
    expect(screen.getByText("Spanish")).toBeTruthy();
    // No raw JSON disclosure in the rendered markup.
    expect(container.querySelector("pre")).toBeNull();
    expect(container.textContent).not.toContain('"success"');
    expect(container.textContent).not.toContain('"translation"');
  });

  it("renders scores as percentages and string lists as items", () => {
    const payload = {
      riskScore: 0.82,
      riskLevel: "high",
      recommendations: ["Send a reminder", "Offer rescheduling"],
    };

    const { container } = render(<AIResultView data={payload} />);

    expect(screen.getByText("82%")).toBeTruthy();
    expect(screen.getByText("Send a reminder")).toBeTruthy();
    expect(screen.getByText("Offer rescheduling")).toBeTruthy();
    expect(container.querySelector("pre")).toBeNull();
  });

  it("unwraps a lone data envelope", () => {
    render(<AIResultView data={{ success: true, data: { summary: "Highly positive feedback from clients." } }} />);
    expect(screen.getByText("Highly positive feedback from clients.")).toBeTruthy();
  });

  it("renders error payloads as a message", () => {
    render(<AIResultView data={{ error: "no business context" }} />);
    expect(screen.getByText("no business context")).toBeTruthy();
  });

  it("handles empty and primitive payloads without crashing", () => {
    render(<AIResultView data={null} />);
    expect(screen.getByText("No result returned.")).toBeTruthy();
    render(<AIResultView data="Just a sentence." />);
    expect(screen.getByText("Just a sentence.")).toBeTruthy();
  });
});

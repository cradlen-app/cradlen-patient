import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GestationRing } from "./GestationRing";

/** The second <circle> is the progress arc; its dash array encodes the fraction. */
function progressDash(container: HTMLElement) {
  const circles = container.querySelectorAll("circle");
  return circles[1].getAttribute("stroke-dasharray") ?? "";
}

describe("GestationRing", () => {
  it("exposes an accessible label and the current/total counts", () => {
    render(<GestationRing current={12} total={40} unit="wks" />);
    expect(screen.getByRole("img", { name: "12 / 40 wks" })).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("/ 40 wks")).toBeInTheDocument();
  });

  it("draws an empty arc at zero progress", () => {
    const { container } = render(<GestationRing current={0} total={40} unit="wks" />);
    // dash length is the first number; 0 progress → starts with "0 ".
    expect(progressDash(container).startsWith("0 ")).toBe(true);
  });

  it("clamps progress to a full arc when current exceeds total", () => {
    const { container } = render(<GestationRing current={50} total={40} unit="wks" />);
    const [dash, gap] = progressDash(container).split(" ").map(Number);
    // Full ring: the whole circumference is dashed, no gap.
    expect(gap).toBeCloseTo(0, 5);
    expect(dash).toBeGreaterThan(0);
  });

  it("guards against a zero total (no division by zero)", () => {
    const { container } = render(<GestationRing current={5} total={0} unit="wks" />);
    expect(progressDash(container).startsWith("0 ")).toBe(true);
  });
});

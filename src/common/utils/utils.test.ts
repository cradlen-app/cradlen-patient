import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("supports conditional object syntax (clsx)", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });

  it("resolves conflicting Tailwind utilities, last wins (tailwind-merge)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("merges logical RTL spacing utilities without clobbering unrelated ones", () => {
    // ps-* and pe-* are independent axes; both should survive.
    expect(cn("ps-7", "pe-8")).toBe("ps-7 pe-8");
  });

  it("flattens array inputs", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("returns an empty string when given nothing truthy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

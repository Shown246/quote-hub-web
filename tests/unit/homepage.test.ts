import { describe, it, expect, vi } from "vitest";
import HomePage from "@/app/page";
import * as nextNavigation from "next/navigation";

describe("Root Homepage (PRD §29, §39)", () => {
  it("redirects root path to default /feed/for-you", () => {
    const redirectSpy = vi.spyOn(nextNavigation, "redirect").mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    expect(() => HomePage()).toThrow("NEXT_REDIRECT");
    expect(redirectSpy).toHaveBeenCalledWith("/feed/for-you");
  });
});

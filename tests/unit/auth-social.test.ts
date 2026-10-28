import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signInSocial } from "@/lib/auth-client";

describe("Google social sign-in", () => {
  const assign = vi.fn();
  const fetchMock = vi.fn();
  const origin = "https://quote-hub-web.vercel.app";
  const googleUrl = "https://accounts.google.com/o/oauth2/v2/auth?state=test-state";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_API_URL", origin);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", { location: { origin, assign } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("posts credentials to the API proxy before navigating to Google", async () => {
    fetchMock.mockResolvedValue(Response.json({ url: googleUrl, redirect: false }));
    await signInSocial();

    expect(fetchMock).toHaveBeenCalledWith(`${origin}/api/auth/sign-in/social`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google", callbackURL: origin, disableRedirect: true }),
    });
    expect(assign).toHaveBeenCalledWith(googleUrl);
  });

  it("supports a separate API origin", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com/");
    fetchMock.mockResolvedValue(Response.json({ url: googleUrl }));
    await signInSocial("google");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/auth/sign-in/social", expect.anything()
    );
    expect(assign).toHaveBeenCalledWith(googleUrl);
  });

  it("propagates API errors without navigating away", async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: "Google provider is not configured" }, { status: 400 }));
    await expect(signInSocial()).rejects.toThrow("Google provider is not configured");
    expect(assign).not.toHaveBeenCalled();
  });

  it("rejects a response without an authorization URL", async () => {
    fetchMock.mockResolvedValue(Response.json({}));
    await expect(signInSocial()).rejects.toThrow("Google sign-in could not be started");
    expect(assign).not.toHaveBeenCalled();
  });

  it("propagates network failures without navigating away", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(signInSocial()).rejects.toThrow("Failed to fetch");
    expect(assign).not.toHaveBeenCalled();
  });

  it("does not start sign-in outside the browser", async () => {
    vi.stubGlobal("window", undefined);
    await signInSocial();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

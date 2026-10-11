import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MetricsCards } from "@/components/admin/metrics-cards";

describe("MetricsCards", () => {
  it("renders platform metric numbers accurately", () => {
    const metric = {
      registeredUsers: 1250,
      activeUsers: 480,
      quotesCreated: 72,
      likesCreated: 512,
      repostsCreated: 88,
      bookmarksCreated: 140,
      followsCreated: 95,
    };

    render(<MetricsCards metric={metric} />);
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("480")).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
  });
});

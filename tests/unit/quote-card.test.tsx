import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuoteCard } from "@/components/quotes/quote-card";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function renderWithClient(ui: React.ReactElement) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("QuoteCard Attribution Invariants", () => {
  const baseQuote = {
    id: "q-1",
    userId: "u-author",
    text: "Simplicity is prerequisite for reliability.",
    likeCount: 10,
    repostCount: 2,
    createdAt: "2026-03-01T10:00:00.000Z",
    themeKey: "classic-serif",
    user: {
      id: "u-author",
      username: "dijkstra",
      displayName: "Edsger Dijkstra",
      profileImageUrl: null,
    },
  };

  it("renders original quote with poster as author and original badge", () => {
    const originalQuote = { ...baseQuote, isOriginal: true, authorName: null };
    renderWithClient(<QuoteCard quote={originalQuote} presentationMode="card" currentUserId="u-viewer" />);
    expect(screen.getByText("Simplicity is prerequisite for reliability.")).toBeInTheDocument();
    expect(screen.getByText(/Edsger Dijkstra/i)).toBeInTheDocument();
    expect(screen.getByText(/Original/i)).toBeInTheDocument();
  });

  it("renders non-original quote with manual author attribution and poster note", () => {
    const attributedQuote = { ...baseQuote, isOriginal: false, authorName: "Edsger W. Dijkstra" };
    renderWithClient(<QuoteCard quote={attributedQuote} presentationMode="card" currentUserId="u-viewer" />);
    expect(screen.getByText("― Edsger W. Dijkstra")).toBeInTheDocument();
    expect(screen.getByText(/Posted by @dijkstra/i)).toBeInTheDocument();
  });

  it("renders non-original quote with null author cleanly without author line", () => {
    const unattributedQuote = { ...baseQuote, isOriginal: false, authorName: null };
    renderWithClient(<QuoteCard quote={unattributedQuote} presentationMode="card" currentUserId="u-viewer" />);
    expect(screen.queryByText(/―/)).not.toBeInTheDocument();
    expect(screen.getByText(/Posted by @dijkstra/i)).toBeInTheDocument();
  });
});

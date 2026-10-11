import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryProvider } from "@/components/providers/query-provider";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

describe("Base UI Primitives", () => {
  it("renders Button with proper variant styling and disabled state", () => {
    render(<Button disabled>Click Me</Button>);
    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeDisabled();
  });

  it("renders Button with different variants and sizes", () => {
    const { rerender } = render(<Button variant="outline" size="sm">Outline</Button>);
    expect(screen.getByRole("button", { name: /outline/i })).toBeInTheDocument();

    rerender(<Button variant="destructive" size="lg">Delete</Button>);
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();

    rerender(<Button variant="ghost" size="md">Ghost</Button>);
    expect(screen.getByRole("button", { name: /ghost/i })).toBeInTheDocument();
  });

  it("renders Badge component with text and variants", () => {
    const { rerender } = render(<Badge>Original</Badge>);
    expect(screen.getByText("Original")).toBeInTheDocument();

    rerender(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText("Secondary")).toBeInTheDocument();
  });

  it("renders Input component correctly", () => {
    render(<Input placeholder="Enter username" disabled />);
    const input = screen.getByPlaceholderText("Enter username");
    expect(input).toBeDisabled();
  });

  it("renders Textarea component correctly", () => {
    render(<Textarea placeholder="Enter quote..." rows={4} />);
    const textarea = screen.getByPlaceholderText("Enter quote...");
    expect(textarea).toBeInTheDocument();
  });

  it("renders Avatar component with image and fallback", () => {
    render(
      <Avatar>
        <AvatarImage src="/avatar.png" alt="User Avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByAltText("User Avatar")).toBeInTheDocument();
  });

  it("verifies Avatar layout classes prevent side-by-side squishing", () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="/avatar.png" alt="User Avatar" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass(
      "relative",
      "flex",
      "h-10",
      "w-10",
      "shrink-0",
      "overflow-hidden",
      "rounded-full"
    );

    const fallback = screen.getByText("JD");
    expect(fallback).toHaveClass(
      "absolute",
      "inset-0",
      "flex",
      "items-center",
      "justify-center"
    );

    const image = screen.getByAltText("User Avatar");
    expect(image).toHaveClass(
      "relative",
      "z-10",
      "aspect-square",
      "h-full",
      "w-full",
      "object-cover"
    );
  });

  it("renders Avatar shorthand with src and fallback props without layout distortion", () => {
    const { container } = render(
      <Avatar src="/avatar.png" alt="Shorthand Avatar" fallback="SH" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass(
      "relative",
      "flex",
      "h-10",
      "w-10",
      "shrink-0",
      "overflow-hidden",
      "rounded-full"
    );

    const fallback = screen.getByText("SH");
    expect(fallback).toHaveClass("absolute", "inset-0");

    const img = screen.getByAltText("Shorthand Avatar");
    expect(img).toBeInTheDocument();
  });

  it("renders Skeleton component with base styling", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass("animate-pulse");
    expect(skeleton).toHaveClass("bg-muted");
  });

  it("combines class names with cn utility correctly", () => {
    const result = cn("text-red-500", false && "hidden", "p-4", "text-blue-500");
    expect(result).toBe("p-4 text-blue-500");
  });

  it("renders children wrapped inside QueryProvider without crashing and sets default options", () => {
    function QueryConsumer() {
      const client = useQueryClient();
      const defaultOptions = client.getDefaultOptions();
      return (
        <div>
          <span>Query Child</span>
          <span data-testid="stale-time">{String(defaultOptions.queries?.staleTime)}</span>
          <span data-testid="retry">{String(defaultOptions.queries?.retry)}</span>
        </div>
      );
    }

    render(
      <QueryProvider>
        <QueryConsumer />
      </QueryProvider>
    );

    expect(screen.getByText("Query Child")).toBeInTheDocument();
    expect(screen.getByTestId("stale-time")).toHaveTextContent("60000");
    expect(screen.getByTestId("retry")).toHaveTextContent("1");
  });
});

"use client";

import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { SocialActionResponse } from "@/types/api";

const fallbackClient = new QueryClient();

export function useBookmarkMutation(
  quoteId: string,
  initialData?: { bookmarked?: boolean }
) {
  let client: QueryClient;
  try {
    client = useQueryClient();
  } catch {
    client = fallbackClient;
  }

  const queryKey = ["quotes", quoteId];
  const cached = client.getQueryData<any>(queryKey);

  const isBookmarked = Boolean(cached?.bookmarked ?? cached?.isBookmarked ?? initialData?.bookmarked ?? false);

  const mutation = useMutation(
    {
      mutationFn: async (currentlyBookmarked: boolean) => {
        if (currentlyBookmarked) {
          return apiClient<SocialActionResponse>(`/api/v1/quotes/${quoteId}/bookmark`, {
            method: "DELETE",
          });
        } else {
          return apiClient<SocialActionResponse>(`/api/v1/quotes/${quoteId}/bookmark`, {
            method: "POST",
          });
        }
      },
      onMutate: (currentlyBookmarked: boolean) => {
        client.cancelQueries({ queryKey });

        const previousQuote = client.getQueryData<any>(queryKey);

        const nextBookmarked = !currentlyBookmarked;

        client.setQueryData(queryKey, (old: any) => ({
          ...(old || { id: quoteId }),
          bookmarked: nextBookmarked,
          isBookmarked: nextBookmarked,
        }));

        return { previousQuote };
      },
      onError: (err: any, _variables, context) => {
        if (context?.previousQuote !== undefined) {
          client.setQueryData(queryKey, context.previousQuote);
        } else {
          client.removeQueries({ queryKey });
        }
        toast.error(err?.detail || err?.message || "Failed to update bookmark");
      },
      onSettled: () => {
        client.invalidateQueries({ queryKey });
        client.invalidateQueries({ queryKey: ["bookmarks"] });
        client.invalidateQueries({ queryKey: ["feed"] });
        client.invalidateQueries({ queryKey: ["quotes"] });
      },
    },
    client
  );

  const toggleBookmark = () => {
    if (mutation.isPending) return;
    mutation.mutate(isBookmarked);
  };

  return {
    isBookmarked,
    toggleBookmark,
    isPending: mutation.isPending,
  };
}

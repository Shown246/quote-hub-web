"use client";

import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { SocialActionResponse } from "@/types/api";

const fallbackClient = new QueryClient();

export function useLikeMutation(
  quoteId: string,
  isOwner: boolean = false,
  initialData?: { liked?: boolean; likeCount?: number }
) {
  let client: QueryClient;
  try {
    client = useQueryClient();
  } catch {
    client = fallbackClient;
  }

  const queryKey = ["quotes", quoteId];
  const cached = client.getQueryData<any>(queryKey);

  const isLiked = Boolean(cached?.liked ?? cached?.isLiked ?? initialData?.liked ?? false);
  const likeCount = Math.max(0, Number(cached?.likeCount ?? initialData?.likeCount ?? 0));
  const canLike = !isOwner;

  const mutation = useMutation(
    {
      mutationFn: async (currentlyLiked: boolean) => {
        if (currentlyLiked) {
          return apiClient<SocialActionResponse>(`/api/v1/quotes/${quoteId}/like`, {
            method: "DELETE",
          });
        } else {
          return apiClient<SocialActionResponse>(`/api/v1/quotes/${quoteId}/like`, {
            method: "POST",
          });
        }
      },
      onMutate: (currentlyLiked: boolean) => {
        client.cancelQueries({ queryKey });

        const previousQuote = client.getQueryData<any>(queryKey);

        const nextLiked = !currentlyLiked;
        const currentCount = Number(previousQuote?.likeCount ?? initialData?.likeCount ?? 0);
        const nextCount = currentlyLiked
          ? Math.max(0, currentCount - 1)
          : currentCount + 1;

        client.setQueryData(queryKey, (old: any) => ({
          ...(old || { id: quoteId }),
          liked: nextLiked,
          isLiked: nextLiked,
          likeCount: nextCount,
        }));

        return { previousQuote };
      },
      onError: (err: any, _variables, context) => {
        if (context?.previousQuote !== undefined) {
          client.setQueryData(queryKey, context.previousQuote);
        } else {
          client.removeQueries({ queryKey });
        }
        toast.error(err?.detail || err?.message || "Failed to update like");
      },
      onSettled: () => {
        client.invalidateQueries({ queryKey });
        client.invalidateQueries({ queryKey: ["feed"] });
        client.invalidateQueries({ queryKey: ["quotes"] });
      },
    },
    client
  );

  const toggleLike = () => {
    if (!canLike || mutation.isPending) return;
    mutation.mutate(isLiked);
  };

  return {
    isLiked,
    likeCount,
    toggleLike,
    canLike,
    isPending: mutation.isPending,
  };
}

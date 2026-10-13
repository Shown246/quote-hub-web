"use client";

import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { SocialActionResponse } from "@/types/api";

export function useRepostMutation(
  quoteId: string,
  initialData?: { reposted?: boolean; repostCount?: number }
) {
  const client = useQueryClient();

  const queryKey = ["quotes", quoteId];
  const cached = client.getQueryData<any>(queryKey);

  const isReposted = Boolean(cached?.reposted ?? cached?.isReposted ?? initialData?.reposted ?? false);
  const repostCount = Math.max(0, Number(cached?.repostCount ?? initialData?.repostCount ?? 0));

  const mutation = useMutation(
    {
      mutationFn: async (currentlyReposted: boolean) => {
        if (currentlyReposted) {
          return apiClient<SocialActionResponse>(`/api/v1/quotes/${quoteId}/repost`, {
            method: "DELETE",
          });
        } else {
          return apiClient<SocialActionResponse>(`/api/v1/quotes/${quoteId}/repost`, {
            method: "POST",
          });
        }
      },
      onMutate: (currentlyReposted: boolean) => {
        client.cancelQueries({ queryKey });

        const previousQuote = client.getQueryData<any>(queryKey);

        const nextReposted = !currentlyReposted;
        const currentCount = Number(previousQuote?.repostCount ?? initialData?.repostCount ?? 0);
        const nextCount = currentlyReposted
          ? Math.max(0, currentCount - 1)
          : currentCount + 1;

        client.setQueryData(queryKey, (old: any) => ({
          ...(old || { id: quoteId }),
          reposted: nextReposted,
          isReposted: nextReposted,
          repostCount: nextCount,
        }));

        return { previousQuote };
      },
      onError: (err: any, _variables, context) => {
        if (context?.previousQuote !== undefined) {
          client.setQueryData(queryKey, context.previousQuote);
        } else {
          client.removeQueries({ queryKey });
        }
        toast.error(err?.detail || err?.message || "Failed to update repost");
      },
      onSettled: () => {
        client.invalidateQueries({ queryKey });
        client.invalidateQueries({ queryKey: ["feed"] });
        client.invalidateQueries({ queryKey: ["quotes"] });
      },
    },
    client
  );

  const toggleRepost = () => {
    if (mutation.isPending) return;
    mutation.mutate(isReposted);
  };

  return {
    isReposted,
    repostCount,
    toggleRepost,
    isPending: mutation.isPending,
  };
}

"use client";

import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { SocialActionResponse } from "@/types/api";

export function useFollowMutation(
  userId: string,
  isOwnProfile: boolean = false,
  initialData?: { following?: boolean; followerCount?: number }
) {
  const client = useQueryClient();

  const queryKey = ["users", userId];
  const cached = client.getQueryData<any>(queryKey);

  const isFollowing = Boolean(cached?.isFollowing ?? cached?.following ?? initialData?.following ?? false);
  const followerCount = Math.max(0, Number(cached?.followerCount ?? initialData?.followerCount ?? 0));
  const canFollow = !isOwnProfile;

  const mutation = useMutation(
    {
      mutationFn: async (currentlyFollowing: boolean) => {
        if (currentlyFollowing) {
          return apiClient<SocialActionResponse>(`/api/v1/users/${userId}/follow`, {
            method: "DELETE",
          });
        } else {
          return apiClient<SocialActionResponse>(`/api/v1/users/${userId}/follow`, {
            method: "POST",
          });
        }
      },
      onMutate: (currentlyFollowing: boolean) => {
        client.cancelQueries({ queryKey });

        const previousProfile = client.getQueryData<any>(queryKey);

        const nextFollowing = !currentlyFollowing;
        const currentCount = Number(previousProfile?.followerCount ?? initialData?.followerCount ?? 0);
        const nextCount = currentlyFollowing
          ? Math.max(0, currentCount - 1)
          : currentCount + 1;

        client.setQueryData(queryKey, (old: any) => ({
          ...(old || { id: userId }),
          following: nextFollowing,
          isFollowing: nextFollowing,
          followerCount: nextCount,
        }));

        return { previousProfile };
      },
      onError: (err: any, _variables, context) => {
        if (context?.previousProfile !== undefined) {
          client.setQueryData(queryKey, context.previousProfile);
        } else {
          client.removeQueries({ queryKey });
        }
        toast.error(err?.detail || err?.message || "Failed to update follow status");
      },
      onSettled: () => {
        client.invalidateQueries({ queryKey });
        client.invalidateQueries({ queryKey: ["user"] });
        client.invalidateQueries({ queryKey: ["feed"] });
      },
    },
    client
  );

  const toggleFollow = () => {
    if (!canFollow || mutation.isPending) return;
    mutation.mutate(isFollowing);
  };

  return {
    isFollowing,
    followerCount,
    toggleFollow,
    canFollow,
    isPending: mutation.isPending,
  };
}

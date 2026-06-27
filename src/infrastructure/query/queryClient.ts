import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/infrastructure/http/api";
import { isSubscriptionExpired } from "@/common/errors/subscription-errors";

export const queryClient = new QueryClient({
  // Surface the subscription write-block (403 SUBSCRIPTION_EXPIRED) on any
  // mutation app-wide, with a single de-duplicated toast. The persistent
  // SubscriptionBanner is the primary cue; this catches the moment a blocked
  // write is attempted. Uses the backend message (it carries the renewal hint).
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isSubscriptionExpired(error)) {
        toast.error(
          error instanceof ApiError && error.messages[0]
            ? error.messages[0]
            : "Your subscription is not active. Renew to continue.",
          { id: "subscription-expired" },
        );
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

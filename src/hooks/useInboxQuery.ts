import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

export interface InboxReply {
  id: string;
  type?: "REPLY" | "SENT";
  campaignId: string;
  recipientId: string;
  messageId: string;
  subject: string;
  fromEmail: string;
  body: string;
  receivedAt: string;
  isRead: boolean;
  isFlagged?: boolean;
  classification?:
    | "INTERESTED"
    | "NOT_INTERESTED"
    | "OUT_OF_OFFICE"
    | "SPAM"
    | "OTHER";
  repliedAt: string | null;
  hasReplied?: boolean;
  campaign: {
    name: string;
  };
  recipient: {
    email: string;
    dynamicData: Record<string, unknown>;
    mailEvents?: { type: string }[];
  };
}

export interface InboxApiResponse {
  replies: InboxReply[];
  allReplies: InboxReply[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
  stats?: {
    total: number;
    unread: number;
    received: number;
    sent: number;
  };
}

export interface InboxDerivedData {
  replies: InboxReply[];
  allReplies: InboxReply[];
  total: number;
  unreadCount: number;
  stats: {
    total: number;
    unread: number;
    received: number;
    sent: number;
  };
}

function deriveInboxData(data: InboxApiResponse): InboxDerivedData {
  const total = data.total || 0;
  const unreadCount = data.unreadCount || 0;
  const allReplies = data.allReplies || [];
  return {
    replies: data.replies || [],
    allReplies,
    total,
    unreadCount,
    stats: data.stats || {
      total,
      unread: unreadCount,
      received: allReplies.filter((r) => r.type !== "SENT").length,
      sent: allReplies.filter((r) => r.type === "SENT").length,
    },
  };
}

export function useInboxReplies(params: {
  filterType?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}) {
  const { filterType = "ALL", searchQuery = "", page = 1, limit = 50 } = params;

  return useQuery<InboxApiResponse, Error, InboxDerivedData>({
    queryKey: ["inbox", "replies", filterType, searchQuery, page, limit],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        filter: filterType,
        search: searchQuery,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/replies?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch inbox replies");
      return res.json();
    },
    staleTime: 10000,
    refetchInterval: 60000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    select: deriveInboxData,
  });
}

export function useToggleFlagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isFlagged,
    }: {
      id: string;
      isFlagged: boolean;
    }) => {
      const res = await fetch(`/api/replies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFlagged }),
      });
      if (!res.ok) throw new Error("Failed to toggle flag");
      return res.json();
    },
    onMutate: async ({ id, isFlagged }) => {
      await queryClient.cancelQueries({ queryKey: ["inbox"] });

      const previousQueriesData = queryClient.getQueriesData<InboxApiResponse>({
        queryKey: ["inbox"],
      });

      queryClient.setQueriesData<InboxApiResponse>(
        { queryKey: ["inbox"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            replies: oldData.replies.map((r) =>
              r.id === id ? { ...r, isFlagged } : r
            ),
            allReplies: oldData.allReplies.map((r) =>
              r.id === id ? { ...r, isFlagged } : r
            ),
          };
        }
      );

      return { previousQueriesData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // No invalidateQueries — the optimistic update keeps the cache correct.
    // The 60s refetchInterval will reconcile any server-side drift.
  });
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/replies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["inbox"] });

      queryClient.setQueriesData<InboxApiResponse>(
        { queryKey: ["inbox"] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            unreadCount: Math.max(0, oldData.unreadCount - 1),
            replies: oldData.replies.map((r) =>
              r.id === id ? { ...r, isRead: true } : r,
            ),
            allReplies: oldData.allReplies.map((r) =>
              r.id === id ? { ...r, isRead: true } : r,
            ),
          };
        },
      );
    },
    // No invalidateQueries — optimistic update handles the cache.
    // Error case: rely on next refetchInterval to restore server state.
  });
}

export function useBulkActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      const res = await fetch("/api/replies/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) throw new Error("Bulk action failed");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}

export function useSyncImapMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/replies/sync", { method: "POST" });
      if (!res.ok) throw new Error("Failed to sync IMAP replies");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}

import prisma from "@/lib/prisma";
import { getUser } from "@/lib/supabase";
import CampaignList from "./_components/CampaignList";

export default async function CampaignsPage() {
  const user = await getUser();
  if (!user) return null;

  let calculatedCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    dailyLimit?: number | null;
    createdAt: string;
    stats: {
      sent: number;
      opens: number;
      clicks: number;
      replies: number;
      lastSentAt: string | null;
    };
  }> = [];

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        dailyLimit: true,
        createdAt: true,
      },
    });

    if (campaigns.length > 0) {
      const campaignIds = campaigns.map((c) => c.id);

      const [recipientStats, mailEventStats, lastSentDates] = await Promise.all([
        prisma.recipient.groupBy({
          by: ["campaignId", "status"],
          where: { campaignId: { in: campaignIds } },
          _count: { _all: true },
        }),
        prisma.mailEvent.groupBy({
          by: ["campaignId", "type"],
          where: { campaignId: { in: campaignIds } },
          _count: { _all: true },
        }),
        prisma.mailEvent.groupBy({
          by: ["campaignId"],
          where: { campaignId: { in: campaignIds }, type: "SENT" },
          _max: { occurredAt: true },
        }),
      ]);

      const sentMap = new Map<string, number>();
      recipientStats.forEach((st) => {
        if (st.status === "SENT") {
          sentMap.set(st.campaignId, (sentMap.get(st.campaignId) || 0) + st._count._all);
        }
      });

      const eventSentMap = new Map<string, number>();
      const opensMap = new Map<string, number>();
      const clicksMap = new Map<string, number>();
      const repliesMap = new Map<string, number>();

      mailEventStats.forEach((ev) => {
        if (ev.type === "SENT") {
          eventSentMap.set(ev.campaignId, (eventSentMap.get(ev.campaignId) || 0) + ev._count._all);
        } else if (ev.type === "OPENED") {
          opensMap.set(ev.campaignId, (opensMap.get(ev.campaignId) || 0) + ev._count._all);
        } else if (ev.type === "CLICKED") {
          clicksMap.set(ev.campaignId, (clicksMap.get(ev.campaignId) || 0) + ev._count._all);
        } else if (ev.type === "REPLIED") {
          repliesMap.set(ev.campaignId, (repliesMap.get(ev.campaignId) || 0) + ev._count._all);
        }
      });

      const lastSentMap = new Map<string, Date>();
      lastSentDates.forEach((ls) => {
        if (ls._max.occurredAt) {
          lastSentMap.set(ls.campaignId, ls._max.occurredAt);
        }
      });

      calculatedCampaigns = campaigns.map((c) => {
        const recipientSent = sentMap.get(c.id) || 0;
        const eventSent = eventSentMap.get(c.id) || 0;
        const finalSent = Math.max(recipientSent, eventSent);
        const lastSentAt = lastSentMap.get(c.id) || null;

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          dailyLimit: c.dailyLimit,
          createdAt: c.createdAt.toISOString(),
          stats: {
            sent: finalSent,
            opens: opensMap.get(c.id) || 0,
            clicks: clicksMap.get(c.id) || 0,
            replies: repliesMap.get(c.id) || 0,
            lastSentAt: lastSentAt ? lastSentAt.toISOString() : null,
          },
        };
      }).sort((a, b) => {
        const aTime = a.stats.lastSentAt ? new Date(a.stats.lastSentAt).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.stats.lastSentAt ? new Date(b.stats.lastSentAt).getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      });
    }
  } catch (error) {
    console.error("[Campaigns] DATABASE ERROR:", error);
    return (
      <div className="skeu-page p-8">
        <div className="max-w-2xl mx-auto p-8 mt-12 text-center text-red-500 bg-red-500/10 rounded-md border border-red-500/20">
          <h2 className="text-lg font-semibold mb-2">Database Connection Failed</h2>
          <p>We could not connect to the database to load your campaigns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="skeu-page">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <CampaignList initialCampaigns={calculatedCampaigns} />
      </div>
    </div>
  );
}


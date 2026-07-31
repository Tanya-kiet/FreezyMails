import { NextResponse } from 'next/server';
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/supabase";
import { TemplateStatRow } from "@/types";

type CampaignType = {
  id: string;
  name: string;
  createdAt: Date;
  template: {
    id: string;
    name: string;
  } | null;
  _count: {
    replies: number;
  };
};

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run independent database queries in parallel
    const [
      campaigns,
      recipientCounts,
      sentRaw,
      uniqueOpensRaw,
      uniqueClicksRaw
    ] = await Promise.all([
      prisma.campaign.findMany({
        where: { userId: user.id },
        include: {
          template: { select: { id: true, name: true } },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.recipient.groupBy({
        by: ["campaignId", "status"],
        where: { campaign: { userId: user.id } },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ campaignId: string; sent: number }[]>`
        SELECT "campaignId", CAST(COUNT(*) AS INTEGER) as sent
        FROM "MailEvent"
        WHERE "type" = 'SENT' AND "campaignId" IN (SELECT id FROM "Campaign" WHERE "userId" = ${user.id})
        GROUP BY "campaignId"
      `,
      prisma.$queryRaw<{ campaignId: string; opens: number }[]>`
        SELECT "campaignId", CAST(COUNT(DISTINCT "recipientId") AS INTEGER) as opens
        FROM "MailEvent"
        WHERE "type" = 'OPENED' AND "campaignId" IN (SELECT id FROM "Campaign" WHERE "userId" = ${user.id})
        GROUP BY "campaignId"
      `,
      prisma.$queryRaw<{ campaignId: string; clicks: number }[]>`
        SELECT "campaignId", CAST(COUNT(DISTINCT "recipientId") AS INTEGER) as clicks
        FROM "MailEvent"
        WHERE "type" = 'CLICKED' AND "campaignId" IN (SELECT id FROM "Campaign" WHERE "userId" = ${user.id})
        GROUP BY "campaignId"
      `
    ]);

    const sentMap = new Map(sentRaw.map((r) => [r.campaignId, Number(r.sent)]));
    const openMap = new Map(uniqueOpensRaw.map((r) => [r.campaignId, Number(r.opens)]));
    const clickMap = new Map(uniqueClicksRaw.map((r) => [r.campaignId, Number(r.clicks)]));

    const stats = campaigns.map((c: CampaignType) => {
      let failed = 0;

      recipientCounts.forEach((r) => {
        if (r.campaignId === c.id) {
          if (r.status === "FAILED" || r.status === "BOUNCED") failed += r._count._all;
        }
      });

      const sent = sentMap.get(c.id) || 0;
      const opened = openMap.get(c.id) || 0;
      const clicked = clickMap.get(c.id) || 0;
      const replied = c._count.replies;
      const openRate = sent > 0 ? (opened / sent) * 100 : 0;
      const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;
      const replyRate = sent > 0 ? (replied / sent) * 100 : 0;

      return {
        id: c.id,
        name: c.name,
        createdAt: c.createdAt.toISOString(),
        templateId: c.template?.id || "unknown",
        templateName: c.template?.name || "Unknown Template",
        sent,
        failed,
        opened,
        clicked,
        replied,
        openRate,
        clickRate,
        replyRate,
      };
    });

    // Calculate template stats
    const templateMap = new Map<string, TemplateStatRow>();
    stats.forEach((c) => {
      const tId = c.templateId;
      if (!templateMap.has(tId)) {
        templateMap.set(tId, {
          id: tId,
          name: c.templateName,
          campaignCount: 0,
          sent: 0,
          failed: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          openRate: 0,
          clickRate: 0,
          replyRate: 0,
        });
      }
      const t = templateMap.get(tId)!;
      t.campaignCount += 1;
      t.sent += c.sent;
      t.failed += c.failed;
      t.opened += c.opened;
      t.clicked += c.clicked;
      t.replied += c.replied;
    });

    const templateStats: TemplateStatRow[] = Array.from(templateMap.values()).map(
      (t) => {
        t.openRate = t.sent > 0 ? (t.opened / t.sent) * 100 : 0;
        t.clickRate = t.sent > 0 ? (t.clicked / t.sent) * 100 : 0;
        t.replyRate = t.sent > 0 ? (t.replied / t.sent) * 100 : 0;
        return t;
      }
    );

    // Calculate overall KPIs
    const totalSent = stats.reduce((acc, c) => acc + c.sent, 0);
    const totalOpened = stats.reduce((acc, c) => acc + c.opened, 0);
    const totalClicked = stats.reduce((acc, c) => acc + c.clicked, 0);
    const totalReplied = stats.reduce((acc, c) => acc + c.replied, 0);

    const overallOpenRate =
      totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";
    const overallClickRate =
      totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0.0";
    const overallReplyRate =
      totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      stats,
      templateStats,
      kpis: {
        totalSent,
        totalOpened,
        totalClicked,
        totalReplied,
        overallOpenRate,
        overallClickRate,
        overallReplyRate
      }
    });
  } catch (error) {
    console.error("Analytics Overview API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase'
import { renderTemplate } from '@/lib/template-parser'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const filter = searchParams.get('filter') || 'ALL'
  const searchQuery = (searchParams.get('search') || '').toLowerCase().trim()
  const skip = (page - 1) * limit

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    select: { id: true }
  })
  const campaignIds = campaigns.map(c => c.id)

  // Fetch replies and sent events in parallel
  const [rawReplies, sentEvents] = await Promise.all([
    prisma.reply.findMany({
      where: { campaignId: { in: campaignIds } },
      orderBy: { receivedAt: 'desc' },
      take: 300,
      include: {
        campaign: { select: { name: true } },
        recipient: {
          select: {
            email: true,
            dynamicData: true,
            mailEvents: { select: { type: true } }
          }
        }
      }
    }),
    prisma.mailEvent.findMany({
      where: { campaignId: { in: campaignIds }, type: 'SENT' },
      orderBy: { occurredAt: 'desc' },
      take: 300,
      include: {
        campaign: { include: { template: true, abTemplateVariants: { include: { subjectVariants: true } } } },
        recipient: {
          select: {
            email: true,
            dynamicData: true,
            mailEvents: { select: { type: true } }
          }
        }
      }
    })
  ])

  // Batch fetch all REPLIED events
  const allRecipientIds = [
    ...rawReplies.map(r => r.recipientId),
    ...sentEvents.map(e => e.recipientId)
  ]
  const uniqueRecipientIds = [...new Set(allRecipientIds)]

  const repliedEvents = await prisma.mailEvent.findMany({
    where: { recipientId: { in: uniqueRecipientIds }, type: 'REPLIED' },
    select: { recipientId: true }
  })
  const repliedRecipientIds = new Set(repliedEvents.map(e => e.recipientId))

  const formattedReplies = rawReplies.map(r => ({
    ...r,
    type: 'REPLY' as const,
    receivedAt: r.receivedAt.toISOString(),
    repliedAt: r.repliedAt?.toISOString() || null,
    hasReplied: repliedRecipientIds.has(r.recipientId)
  }))

  const formattedSentEvents = sentEvents.map(e => {
    let subj = e.campaign.template.subject;
    const rawDynamicData = (e.recipient.dynamicData as Record<string, unknown>) || {};
    const dynamicData: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawDynamicData)) {
      dynamicData[k] = String(v);
    }
    
    const tVariantId = dynamicData._templateVariantId;
    const sVariantId = dynamicData._subjectVariantId;
    
    if (sVariantId && e.campaign.abTemplateVariants) {
      const tVariant = e.campaign.abTemplateVariants.find(tv => tv.id === tVariantId);
      if (tVariant && tVariant.subjectVariants) {
        const sVariant = tVariant.subjectVariants.find(sv => sv.id === sVariantId);
        if (sVariant) subj = sVariant.subject;
      }
    }

    const renderedSubj = renderTemplate(subj, dynamicData);

    let bodyTemplate = e.campaign.template.body;
    if (tVariantId && e.campaign.abTemplateVariants) {
      const tVariant = e.campaign.abTemplateVariants.find(tv => tv.id === tVariantId);
      if (tVariant) bodyTemplate = tVariant.body;
    }
    const renderedBody = renderTemplate(bodyTemplate, dynamicData);

    return {
      id: e.id,
      type: 'SENT' as const,
      campaignId: e.campaignId,
      recipientId: e.recipientId,
      messageId: (e.metadata as Record<string, string>)?.messageId || '',
      subject: renderedSubj,
      fromEmail: 'You',
      body: renderedBody,
      receivedAt: e.occurredAt.toISOString(),
      isRead: true,
      isFlagged: Boolean((e.metadata as Record<string, unknown>)?.isFlagged || false),
      repliedAt: null,
      hasReplied: repliedRecipientIds.has(e.recipientId),
      campaign: { name: e.campaign.name },
      recipient: { email: e.recipient.email, dynamicData, mailEvents: e.recipient.mailEvents || [] }
    }
  })

  let allEvents = [...formattedReplies, ...formattedSentEvents]
    .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

  const globalStats = {
    total: allEvents.length,
    unread: formattedReplies.filter((r) => !r.isRead).length,
    received: allEvents.filter((r) => r.type !== "SENT").length,
    sent: allEvents.filter((r) => r.type === "SENT").length,
  };

  // Apply server-side filtering
  if (filter === 'UNREAD') {
    allEvents = allEvents.filter(r => !r.isRead && r.type !== 'SENT');
  } else if (filter === 'SENT') {
    allEvents = allEvents.filter(r => r.type === 'SENT');
  } else if (filter === 'RECEIVED') {
    allEvents = allEvents.filter(r => r.type !== 'SENT');
  } else if (filter === 'FOLLOW_UP' || filter === 'FLAGGED') {
    allEvents = allEvents.filter(r => (r as Record<string, unknown>).isFlagged === true);
  }

  // Apply server-side search query
  if (searchQuery) {
    allEvents = allEvents.filter(r =>
      (r.subject || '').toLowerCase().includes(searchQuery) ||
      (r.fromEmail || '').toLowerCase().includes(searchQuery) ||
      (r.recipient?.email || '').toLowerCase().includes(searchQuery) ||
      (r.campaign?.name || '').toLowerCase().includes(searchQuery)
    );
  }

  const total = allEvents.length;
  const paginatedEvents = allEvents.slice(skip, skip + limit);

  return NextResponse.json({
    replies: paginatedEvents,
    allReplies: allEvents,
    total,
    page,
    limit,
    unreadCount: globalStats.unread,
    stats: globalStats,
  })
}

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { computeHealthScore } from '@/lib/health'
import { getUser } from '@/lib/supabase'

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const account = await prisma.emailAccount.findUnique({
    where: { id: params.id, userId: user.id }
  })
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Find campaigns using this account
  const campaigns = await prisma.campaign.findMany({
    where: { emailAccounts: { some: { id: account.id } } },
    select: { id: true }
  })
  const campaignIds = campaigns.map(c => c.id)

  if (campaignIds.length > 0) {
    const badEvents = await prisma.mailEvent.findMany({
      where: {
        campaignId: { in: campaignIds },
        type: { in: ['BOUNCED', 'FAILED'] },
        occurredAt: { gte: thirtyDaysAgo }
      }
    })

    // Update each event to be ignored for health calculations, preserving existing metadata
    for (const event of badEvents) {
      const currentMeta = event.metadata && typeof event.metadata === 'object' ? event.metadata : {}
      await prisma.mailEvent.update({
        where: { id: event.id },
        data: {
          metadata: {
            ...currentMeta,
            ignoredForHealth: true
          }
        }
      })
    }
  }

  // Recalculate health score (it should now be 100 or close to it)
  const score = await computeHealthScore(account.id)
  
  await prisma.emailAccount.update({
    where: { id: account.id },
    data: { healthScore: score }
  })
  
  return NextResponse.json({ score })
}

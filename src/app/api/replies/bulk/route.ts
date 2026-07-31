import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUser } from '@/lib/supabase'
import type { Prisma } from '@prisma/client'

export async function PATCH(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { ids, action } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    if (action === 'mark_read') {
      await prisma.reply.updateMany({
        where: { id: { in: ids } },
        data: { isRead: true }
      })
    } else if (action === 'mark_unread') {
      await prisma.reply.updateMany({
        where: { id: { in: ids } },
        data: { isRead: false }
      })
    } else if (action === 'flag') {
      await prisma.reply.updateMany({
        where: { id: { in: ids } },
        data: { isFlagged: true }
      })
      // Also update sent mailEvents metadata if any of the ids are mailEvents
      const mailEvents = await prisma.mailEvent.findMany({
        where: { id: { in: ids } }
      })
      for (const me of mailEvents) {
        const meta = (me.metadata as Record<string, unknown>) || {}
        await prisma.mailEvent.update({
          where: { id: me.id },
          data: { metadata: { ...meta, isFlagged: true } as Prisma.InputJsonObject }
        })
      }
    } else if (action === 'unflag') {
      await prisma.reply.updateMany({
        where: { id: { in: ids } },
        data: { isFlagged: false }
      })
      const mailEvents = await prisma.mailEvent.findMany({
        where: { id: { in: ids } }
      })
      for (const me of mailEvents) {
        const meta = (me.metadata as Record<string, unknown>) || {}
        await prisma.mailEvent.update({
          where: { id: me.id },
          data: { metadata: { ...meta, isFlagged: false } as Prisma.InputJsonObject }
        })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, updated: ids.length })
  } catch (_error: unknown) {
    const error = _error as Error;
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

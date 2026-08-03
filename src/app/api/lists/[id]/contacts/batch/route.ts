import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/supabase";
import { Prisma } from "@prisma/client";

const CHUNK_SIZE = 500;

async function upsertChunk(
  chunk: { email: string; customFields?: Prisma.InputJsonObject }[],
  listId: string
) {
  const values = chunk.map((c) =>
    Prisma.sql`(gen_random_uuid(), ${listId}, ${c.email}, ${JSON.stringify(c.customFields ?? {})}::jsonb, now(), now())`
  );

  await prisma.$executeRaw`
    INSERT INTO "Contact" ("id", "mailingListId", "email", "customFields", "createdAt", "updatedAt")
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("mailingListId", "email")
    DO UPDATE SET
      "customFields" = EXCLUDED."customFields",
      "updatedAt"    = now()
  `;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const list = await prisma.mailingList.findFirst({
      where: { id: id, userId: user.id },
    });

    if (!list) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { contacts } = body;

    if (!Array.isArray(contacts)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const validContacts = contacts.filter(
      (contact: { email?: string }) => contact.email
    ) as { email: string; customFields?: Prisma.InputJsonObject }[];

    // Deduplicate by email — last occurrence wins (most recent edit)
    // This prevents the "ON CONFLICT cannot affect row a second time" Postgres error
    const deduped = Array.from(
      validContacts
        .reduce((map, c) => map.set(c.email.toLowerCase(), c), new Map<string, typeof validContacts[number]>())
        .values()
    );

    // Process in chunks sequentially — no transaction, no timeout risk
    for (let i = 0; i < deduped.length; i += CHUNK_SIZE) {
      await upsertChunk(deduped.slice(i, i + CHUNK_SIZE), id);
    }

    return NextResponse.json({ success: true, count: validContacts.length });
  } catch (_error: unknown) {
    const error = _error as Error;
    console.error("Error in batch contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const list = await prisma.mailingList.findFirst({
      where: { id: id, userId: user.id },
    });

    if (!list) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    await prisma.contact.deleteMany({
      where: {
        id: { in: ids },
        mailingListId: id,
      },
    });

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (_error: unknown) { const error = _error as Error;
    console.error("Error deleting batch contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



export const dynamic = 'force-dynamic'

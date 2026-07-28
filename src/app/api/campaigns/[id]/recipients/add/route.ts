import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/supabase";
import { Prisma } from "@prisma/client";
import { assignStableBucket } from "@/lib/assignment";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        abTemplateVariants: {
          include: { subjectVariants: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const { recipients } = await req.json();
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "No recipients provided" }, { status: 400 });
    }

    const hasVariants = campaign.abEnabled && campaign.abTemplateVariants.length > 0;
    const variantsForHashing = campaign.abTemplateVariants.map(tv => ({
      id: tv.id,
      splitPercent: tv.splitPercent,
      subjects: tv.subjectVariants.map(sv => ({
        id: sv.id,
        splitPercent: sv.splitPercent
      }))
    }));

    const recipientData = recipients.map((row: Record<string, unknown>) => {
      const { email, ...dynamicData } = row;
      const recipientId = crypto.randomUUID(); // Pre-generate ID for stable hashing

      if (hasVariants && variantsForHashing.length > 0) {
        const tVariantId = assignStableBucket(recipientId + campaign.id, variantsForHashing);
        if (tVariantId) {
          dynamicData._templateVariantId = tVariantId;
          const tVariant = variantsForHashing.find(t => t.id === tVariantId);
          if (tVariant && tVariant.subjects.length > 0) {
            const sVariantId = assignStableBucket(recipientId + tVariant.id, tVariant.subjects);
            if (sVariantId) {
              dynamicData._subjectVariantId = sVariantId;
            }
          }
        }
      }

      return {
        id: recipientId,
        campaignId: campaign.id,
        email: String(email).trim().toLowerCase(),
        dynamicData: dynamicData as Prisma.InputJsonObject,
        status: "PENDING" as const,
      };
    });

    await prisma.$transaction(
      async (tx) => {
        await tx.recipient.createMany({
          data: recipientData,
          skipDuplicates: true,
        });

        // If campaign is DONE and we're adding new recipients, move it to PAUSED
        if (campaign.status === "DONE") {
          await tx.campaign.update({
            where: { id: campaign.id },
            data: { status: "PAUSED" },
          });
        }
      },
      { timeout: 60000, maxWait: 10000 },
    );

    return NextResponse.json({ success: true, count: recipientData.length });
  } catch (_error: unknown) {
    const error = _error as Error;
    console.error("Error adding recipients:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

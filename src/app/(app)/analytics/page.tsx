import { getUser } from "@/lib/supabase";
import AnalyticsDashboard from "./_components/AnalyticsDashboard";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function AnalyticsPage() {
  const user = await getUser();
  if (!user) return null;


  const hasCampaigns = await prisma.campaign.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  return (
    <div className="skeu-page">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center items-start gap-4">
          <div>
            <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp size={20} className="text-primary-base" />
              Analytics
            </h1>
            <p className="text-sm text-text-muted mt-0.5">
              Comprehensive performance metrics, open rates, and engagement insights
            </p>
          </div>
          {hasCampaigns && (
            <Link
              href="/campaigns/new"
              className="skeu-btn-primary whitespace-nowrap"
            >
              + New campaign
            </Link>
          )}
        </div>

        <AnalyticsDashboard />
      </div>
    </div>
  );
}

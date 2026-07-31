"use client";

import { useQuery } from "@tanstack/react-query";
import CampaignStatsTable from "./CampaignStatsTable";
import TemplateStatsTable from "./TemplateStatsTable";
import DailyAreaChart from "./DailyAreaChart";
import FunnelChart from "./FunnelChart";
import { BarChart2, Mail, MousePointerClick, MessageSquare, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CampaignStatRow, TemplateStatRow } from "@/types";

type AnalyticsData = {
  stats: CampaignStatRow[];
  templateStats: TemplateStatRow[];
  kpis: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalReplied: number;
    overallOpenRate: string;
    overallClickRate: string;
    overallReplyRate: string;
  };
};

export default function AnalyticsDashboard() {
  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ["analyticsOverview"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/overview");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeu-card p-5 h-[104px] flex flex-col justify-between animate-pulse">
              <div className="w-24 h-4 bg-bg-subtle rounded"></div>
              <div className="w-16 h-8 bg-bg-subtle rounded mt-2"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="skeu-card p-5 lg:col-span-3 h-[320px] animate-pulse bg-bg-subtle/50"></div>
          <div className="skeu-card p-5 lg:col-span-2 h-[320px] animate-pulse bg-bg-subtle/50"></div>
        </div>
        <div className="skeu-card h-[400px] animate-pulse bg-bg-subtle/50"></div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="skeu-card flex flex-col items-center justify-center min-h-[320px] text-center space-y-4 p-8">
        <div className="text-danger-text">Error loading analytics data.</div>
      </div>
    );
  }

  const { stats, templateStats, kpis } = data;

  if (stats.length === 0) {
    return (
      <div className="skeu-card flex flex-col items-center justify-center min-h-[320px] text-center space-y-4 p-8">
        <BarChart2 size={56} className="text-text-muted opacity-40" />
        <div>
          <h3 className="text-base font-semibold text-text-primary">
            No analytics data available
          </h3>
          <p className="text-sm text-text-muted mt-1 max-w-sm">
            Launch your first email campaign to track real-time open rates, click rates, and prospect responses.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button variant="primary" className="mt-2">
            Create Campaign
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sent */}
        <Card className="skeu-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-widest text-text-muted uppercase">
              Total Sent
            </h2>
            <Mail size={16} className="text-text-muted opacity-70" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-text-primary">
              {kpis.totalSent.toLocaleString()}
            </div>
            <span className="text-xs text-text-muted mt-1 block">
              Total emails delivered
            </span>
          </div>
        </Card>

        {/* Avg Open Rate */}
        <Card className="skeu-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-widest text-text-muted uppercase">
              Avg Open Rate
            </h2>
            <Eye size={16} className="text-text-muted opacity-70" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <div className="text-2xl font-bold text-text-primary">
                {kpis.overallOpenRate}%
              </div>
            </div>
            <span className="text-xs text-text-muted mt-1 block">
              {kpis.totalOpened.toLocaleString()} unique opens
            </span>
          </div>
        </Card>

        {/* Avg Click Rate */}
        <Card className="skeu-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-widest text-text-muted uppercase">
              Avg Click Rate
            </h2>
            <MousePointerClick size={16} className=" text-text-muted opacity-70" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <div className="text-2xl font-bold text-text-primary">
                {kpis.overallClickRate}%
              </div>
            </div>
            <span className="text-xs text-text-muted mt-1 block">
              {kpis.totalClicked.toLocaleString()} unique clicks
            </span>
          </div>
        </Card>

        {/* Avg Reply Rate */}
        <Card className="skeu-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold tracking-widest text-text-muted uppercase">
              Avg Reply Rate
            </h2>
            <MessageSquare size={16} className="text-text-muted opacity-70" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <div className="text-2xl font-bold text-text-primary">
                {kpis.overallReplyRate}%
              </div>
            </div>
            <span className="text-xs text-text-muted mt-1 block">
              {kpis.totalReplied.toLocaleString()} prospect replies
            </span>
          </div>
        </Card>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="skeu-card p-5 lg:col-span-3 flex flex-col justify-between">
          <DailyAreaChart />
        </Card>
        <Card className="skeu-card p-5 lg:col-span-2 flex flex-col justify-between">
          <FunnelChart />
        </Card>
      </div>

      {/* TEMPLATE PERFORMANCE TABLE */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-semibold tracking-widest text-text-muted uppercase">
            Template Performance
          </h2>
        </div>
        <TemplateStatsTable data={templateStats} />
      </div>

      {/* CAMPAIGN PERFORMANCE TABLE */}
      <div className="space-y-4 mt-8">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-semibold tracking-widest text-text-muted uppercase">
            Campaign Performance
          </h2>
        </div>
        <CampaignStatsTable data={stats} />
      </div>
    </>
  );
}

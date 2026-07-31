'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Eye, MousePointerClick, MessageSquare } from "lucide-react";

interface FunnelData {
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
}

export default function FunnelChart() {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/daily?range=30')
      .then(res => res.json())
      .then(json => {
        if (json.funnel) setFunnel(json.funnel);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-full justify-between space-y-4 p-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-48 mb-4" />
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const sent = funnel?.sent || 0;
  const opened = funnel?.opened || 0;
  const clicked = funnel?.clicked || 0;
  const replied = funnel?.replied || 0;

  const steps = [
    {
      id: 'sent',
      name: 'Sent',
      count: sent,
      icon: Mail,
      barColor: 'bg-primary-base',
      iconBg: 'bg-bg-subtle text-text-muted border-border-subtle',
      badgeClass: 'skeu-badge skeu-badge-sent',
      pctOfSent: 100,
    },
    {
      id: 'opened',
      name: 'Opened',
      count: opened,
      icon: Eye,
      barColor: 'bg-success-text',
      iconBg: 'bg-success-bg text-success-text border-border-subtle',
      badgeClass: 'skeu-badge skeu-badge-opened',
      pctOfSent: sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0.0',
    },
    {
      id: 'clicked',
      name: 'Clicked',
      count: clicked,
      icon: MousePointerClick,
      barColor: 'bg-warning-text',
      iconBg: 'bg-warning-bg text-warning-text border-border-subtle',
      badgeClass: 'skeu-badge skeu-badge-warning',
      pctOfSent: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0.0',
    },
    {
      id: 'replied',
      name: 'Replied',
      count: replied,
      icon: MessageSquare,
      barColor: 'bg-primary-base',
      iconBg: 'bg-bg-subtle text-text-primary border-border-subtle',
      badgeClass: 'skeu-badge skeu-badge-sent',
      pctOfSent: sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0.0',
    },
  ];

  return (
    <div className="flex flex-col h-full justify-between space-y-4">
      <div>
        <h2 className="text-xs font-semibold tracking-widest text-text-muted uppercase">
          Conversion Funnel
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          30-day pipeline breakdown & drop-off
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-around space-y-2.5 mt-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const barWidth = sent > 0 ? Math.max(6, Math.min(100, (step.count / sent) * 100)) : 0;

          return (
            <div key={step.id} className="relative group">
              <div className="p-3 rounded-lg border border-border-subtle bg-bg-base hover:bg-bg-subtle/50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${step.iconBg} border`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-semibold text-text-primary">
                      {step.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary font-mono">
                      {step.count.toLocaleString()}
                    </span>
                    <span className={step.badgeClass}>
                      {step.pctOfSent}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="skeu-progress-bar">
                  <div
                    className={`${step.barColor} h-full transition-all duration-500 rounded-full`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

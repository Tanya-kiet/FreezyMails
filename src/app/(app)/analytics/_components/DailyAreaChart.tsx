'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DailyData {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
}

export default function DailyAreaChart() {
  const [data, setData] = useState<DailyData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState<'all' | 'sent' | 'opened' | 'clicked' | 'replied'>('all')

  useEffect(() => {
    fetch('/api/analytics/daily?range=30')
      .then(res => res.json())
      .then(json => {
        if (json.daily) setData(json.daily)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 h-full flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-64 rounded-md" />
        </div>
        <Skeleton className="flex-1 w-full min-h-[260px] rounded-lg" />
      </div>
    );
  }

  const totals = {
    sent: data.reduce((acc, d) => acc + d.sent, 0),
    opened: data.reduce((acc, d) => acc + d.opened, 0),
    clicked: data.reduce((acc, d) => acc + d.clicked, 0),
    replied: data.reduce((acc, d) => acc + d.replied, 0),
  };

  const metricConfigs = {
    sent: { label: 'Sent', color: 'var(--primary-base)' },
    opened: { label: 'Opened', color: 'var(--success-text)' },
    clicked: { label: 'Clicked', color: 'var(--warning-text)' },
    replied: { label: 'Replied', color: 'var(--text-primary)' },
  };

  return (
    <div className="flex flex-col h-full justify-between space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-text-muted uppercase">
            Daily Activity Trend (30 Days)
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {activeMetric === 'all'
              ? `${totals.sent} total emails sent across 30 days`
              : `${totals[activeMetric as keyof typeof totals]} total ${metricConfigs[activeMetric as keyof typeof metricConfigs].label.toLowerCase()}`}
          </p>
        </div>

        {/* Filter Pill Tabs */}
        <div className="flex items-center gap-1 bg-bg-subtle p-1 rounded-lg border border-border-subtle self-start sm:self-auto shrink-0">
          {(['all', 'sent', 'opened', 'clicked', 'replied'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all capitalize cursor-pointer ${
                activeMetric === m
                  ? 'bg-bg-base text-text-primary shadow-xs border border-border-subtle font-semibold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-[250px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeMetric === 'all' ? (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="skeu-card p-3 shadow-xl border border-border-subtle space-y-1.5 min-w-[140px]">
                      <p className="text-xs font-semibold text-text-primary border-b border-border-subtle pb-1 mb-1">
                        {label}
                      </p>
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex justify-between items-center text-xs">
                          <span className="capitalize text-text-muted flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}:
                          </span>
                          <span className="font-mono font-bold text-text-primary">
                            {Number(entry.value).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar dataKey="sent" name="Sent" fill="var(--primary-base)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="opened" name="Opened" fill="var(--success-text)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="clicked" name="Clicked" fill="var(--warning-text)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="replied" name="Replied" fill="var(--text-primary)" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={metricConfigs[activeMetric].color}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={metricConfigs[activeMetric].color}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="skeu-card p-2.5 shadow-xl border border-border-subtle space-y-1">
                      <p className="text-xs font-semibold text-text-primary">{label}</p>
                      <p className="text-xs font-mono font-bold" style={{ color: metricConfigs[activeMetric].color }}>
                        {metricConfigs[activeMetric].label}: {payload[0].value}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={metricConfigs[activeMetric].color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${activeMetric})`}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

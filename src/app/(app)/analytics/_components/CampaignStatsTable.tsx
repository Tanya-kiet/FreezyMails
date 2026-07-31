"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CampaignStatRow } from "@/types";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export default function CampaignStatsTable({
  data,
}: {
  data: CampaignStatRow[];
}) {
  const router = useRouter();
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedData = [...data].sort((a, b) => {
    if (
      a[sortField as keyof CampaignStatRow] <
      b[sortField as keyof CampaignStatRow]
    )
      return sortOrder === "asc" ? -1 : 1;
    if (
      a[sortField as keyof CampaignStatRow] >
      b[sortField as keyof CampaignStatRow]
    )
      return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field)
      return (
        <ArrowUpDown
          size={14}
          className="text-text-muted opacity-50 ml-1 inline-block"
        />
      );
    return sortOrder === "asc" ? (
      <ArrowUp size={14} className="text-primary-base ml-1 inline-block" />
    ) : (
      <ArrowDown size={14} className="text-primary-base ml-1 inline-block" />
    );
  };

  const thClass =
    "px-4 py-3 font-medium border-b border-border-subtle cursor-pointer select-none hover:bg-bg-subtle transition";
  const tdClass = "px-4 py-3";

  const renderTh = (field: string, label: string) => (
    <th className={thClass} onClick={() => handleSort(field)}>
      <div className="flex items-center">
        {label}
        {getSortIcon(field)}
      </div>
    </th>
  );

  return (
    <div className="skeu-card -skeu-base overflow-hidden flex-1 flex flex-col min-h-0 mt-2">
      <div className="overflow-y-auto overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[750px]">
          <thead className="bg-bg-subtle text-text-muted sticky top-0 z-10">
            <tr>
              {renderTh("name", "Campaign Name")}
              {renderTh("sent", "Sent")}
              {renderTh("opened", "Opened")}
              {renderTh("openRate", "Open %")}
              {renderTh("clicked", "Clicked")}
              {renderTh("clickRate", "Click %")}
              {renderTh("replied", "Replied")}
              {renderTh("replyRate", "Reply %")}
              {renderTh("failed", "Failed")}
              {renderTh("createdAt", "Date")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-text-muted">
                  No campaign stats found.
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/campaigns/${row.id}`)}
                  className="hover:bg-bg-subtle/50 transition-colors cursor-pointer group"
                >
                  <td className={`${tdClass} font-medium text-text-primary`}>
                    {row.name}
                  </td>
                  <td className={tdClass}>{row.sent}</td>
                  <td className={tdClass}>{row.opened}</td>
                  <td className={tdClass}>{row.openRate.toFixed(1)}%</td>
                  <td className={tdClass}>{row.clicked}</td>
                  <td className={tdClass}>{row.clickRate.toFixed(1)}%</td>
                  <td className={tdClass}>{row.replied}</td>
                  <td className={tdClass}>{row.replyRate.toFixed(1)}%</td>
                  <td className={`${tdClass} text-danger-text font-medium`}>
                    {row.failed}
                  </td>
                  <td className={`${tdClass} text-text-muted`}>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

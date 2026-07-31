"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplateStatRow } from "@/types";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

export default function TemplateStatsTable({
  data,
}: {
  data: TemplateStatRow[];
}) {
  const router = useRouter();
  const [sortField, setSortField] = useState("opened"); // Default to most opens? Or maybe sent
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedData = [...data].sort((a, b) => {
    if (
      a[sortField as keyof TemplateStatRow] <
      b[sortField as keyof TemplateStatRow]
    )
      return sortOrder === "asc" ? -1 : 1;
    if (
      a[sortField as keyof TemplateStatRow] >
      b[sortField as keyof TemplateStatRow]
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
              {renderTh("name", "Template Name")}
              {renderTh("campaignCount", "Campaigns")}
              {renderTh("sent", "Sent")}
              {renderTh("opened", "Opened")}
              {renderTh("openRate", "Open %")}
              {renderTh("clicked", "Clicked")}
              {renderTh("clickRate", "Click %")}
              {renderTh("replied", "Replied")}
              {renderTh("replyRate", "Reply %")}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                  No template stats found.
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/templates/${row.id}`)}
                  className="hover:bg-bg-subtle/50 transition-colors cursor-pointer group"
                >
                  <td className={`${tdClass} font-medium text-text-primary`}>
                    {row.name}
                  </td>
                  <td className={tdClass}>{row.campaignCount}</td>
                  <td className={tdClass}>{row.sent}</td>
                  <td className={tdClass}>{row.opened}</td>
                  <td className={tdClass}>{row.openRate.toFixed(1)}%</td>
                  <td className={tdClass}>{row.clicked}</td>
                  <td className={tdClass}>{row.clickRate.toFixed(1)}%</td>
                  <td className={tdClass}>{row.replied}</td>
                  <td className={tdClass}>{row.replyRate.toFixed(1)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

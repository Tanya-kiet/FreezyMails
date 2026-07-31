"use client";

import { ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Account = {
  id: string;
  label: string;
  healthScore: number;
};

export default function HealthAlertBanner({
  activeAccounts,
}: {
  activeAccounts: Account[];
}) {
  const [dismissed, setDismissed] = useState(false);

  const hasPausedAccounts = activeAccounts.some((acc) => acc.healthScore === 0);

  if (!hasPausedAccounts || dismissed) return null;

  return (
    <div className="skeu-card border-danger-text/30 bg-danger-bg flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-danger-text/10 shrink-0">
          <ShieldAlert size={18} className="text-danger-text" />
        </div>
        <div>
          <p className="text-danger-text font-semibold text-sm">
            Critical Action Required
          </p>
          <p className="text-danger-text/80 text-xs mt-0.5 leading-relaxed">
            One or more of your email accounts has been paused due to a high bounce rate. Continuing to send risks permanent domain blacklisting.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <button
          onClick={() => setDismissed(true)}
          className="skeu-btn-ghost text-danger-text/70 hover:text-danger-text text-xs px-3 py-1.5"
        >
          Dismiss
        </button>
        <Link
          href="/accounts"
          className="skeu-btn-primary flex items-center gap-2 justify-center w-full sm:w-auto"
        >
          Resolve Now <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

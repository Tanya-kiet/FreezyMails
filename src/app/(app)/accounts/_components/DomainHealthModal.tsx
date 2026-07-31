"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  RotateCcw,
  TrendingDown,
  AlertTriangle,
  Inbox,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DomainHealthModal({
  isOpen,
  setIsOpen,
  accountId,
  onResetComplete,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  accountId: string;
  onResetComplete?: () => void;
}) {
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}/reset-health`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reset domain health");
      toast.success("Score reset. Clean your lists before the next campaign.");
      setIsOpen(false);
      onResetComplete?.();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset score");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-bg-base border-border-subtle gap-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-border-subtle">
          <div className="flex items-center gap-3 mb-1">
            <ShieldAlert size={18} className="text-danger-text" />
            <DialogTitle className="text-sm font-semibold text-text-primary">
              Domain Health Paused
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-text-muted ml-7">
            Your bounce rate exceeded 10% in the last 30 days. Sending has been
            paused to protect your domain.
          </DialogDescription>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
          {/* LEFT: Bounce rate visual + what it means */}
          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
                Bounce Rate Gauge
              </p>

              {/* Bar */}
              <div className="space-y-2">
                <div className="h-2.5 bg-bg-subtle rounded-full overflow-hidden flex">
                  <div className="w-[20%] bg-success-text/40" />
                  <div className="w-[40%] bg-warning-text/40" />
                  <div className="w-[40%] bg-danger-text/40" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-text-muted">
                  <span>0%</span>
                  <span>2% — safe</span>
                  <span>10% — critical</span>
                </div>
                {/* Current status indicator */}
                <div className="flex items-center gap-2 pt-1">
                  <TrendingDown size={13} className="text-danger-text" />
                  <span className="text-xs text-danger-text font-medium">
                    Your account is currently above 10%
                  </span>
                </div>
              </div>
            </div>

            {/* Consequence timeline */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
                What happens next
              </p>
              <div className="space-y-3">
                {[
                  {
                    icon: AlertTriangle,
                    label: "Emails flagged by Google & Outlook",
                    sub: "Your sender reputation is damaged",
                  },
                  {
                    icon: Inbox,
                    label: "Emails routed to spam folder",
                    sub: "Recipients never see your outreach",
                  },
                  {
                    icon: ShieldAlert,
                    label: "Domain permanently blacklisted",
                    sub: "Extremely difficult to recover from",
                  },
                ].map(({ icon: Icon, label, sub }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-bg-subtle border border-border-subtle flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={11} className="text-text-muted" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-primary">
                        {label}
                      </p>
                      <p className="text-[10px] text-text-muted">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: What to do before reset */}
          <div className="p-6 space-y-5 bg-bg-subtle">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">
                Before you reset
              </p>
              <div className="space-y-3">
                {[
                  {
                    step: "01",
                    title: "Verify your email list",
                    desc: "Use a tool like ZeroBounce or NeverBounce to validate every address before your next send.",
                  },
                  {
                    step: "02",
                    title: "Remove bounced addresses",
                    desc: "Go to your Audiences and delete contacts that have previously bounced or failed.",
                  },
                  {
                    step: "03",
                    title: "Only send to known contacts",
                    desc: "Stop guessing email formats. Only outreach to addresses you have explicitly verified.",
                  },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-3">
                    <span className="text-[10px] font-mono font-bold text-text-muted shrink-0 mt-0.5 w-5 text-right">
                      {step}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-text-primary">
                        {title}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Acknowledgement note */}
            <div className="border border-border-subtle rounded-lg p-3 bg-bg-base flex items-start gap-2">
              <ListChecks
                size={13}
                className="text-text-muted shrink-0 mt-0.5"
              />
              <p className="text-[10px] text-text-muted leading-relaxed">
                Resetting the score marks past bounce events as resolved. It
                does <strong className="text-text-primary">not</strong> delete
                your history or fix the underlying list quality.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleReset}
            isLoading={isResetting}
            leftIcon={!isResetting ? <RotateCcw size={13} /> : undefined}
          >
            I understand, reset score
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

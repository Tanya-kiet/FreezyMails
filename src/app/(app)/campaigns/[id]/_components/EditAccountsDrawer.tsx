"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Search, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface EmailAccount {
  id: string;
  label: string;
  fromName: string;
  fromEmail: string;
  isActive: boolean;
  healthScore?: number;
}

interface EditAccountsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  currentAccounts: { id: string; label: string; fromEmail: string }[];
  campaignStatus: string;
  onSuccess: () => void;
}

export default function EditAccountsDrawer({
  isOpen,
  onClose,
  campaignId,
  currentAccounts,
  campaignStatus,
  onSuccess,
}: EditAccountsDrawerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSelectedIds(currentAccounts.map((a) => a.id));
      setSearchTerm("");
    }
  }

  const { data: accounts = [], isLoading } = useQuery<EmailAccount[]>({
    queryKey: ["accounts"],
    queryFn: () => fetch("/api/accounts").then((r) => r.json()),
    enabled: isOpen,
  });

  const isSending = campaignStatus === "SENDING";

  const toggleAccount = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (isSending) {
      toast.error(
        "Campaign must be paused or ended to update sender accounts.",
      );
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("At least one sender account must be selected.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAccountIds: selectedIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update sender accounts");
      }

      toast.success("Sender accounts updated successfully!");
      onSuccess();
      onClose();
    } catch (_err: unknown) {
      const err = _err as Error;
      toast.error(err.message || "Failed to update sender accounts");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.fromEmail.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const currentChosenSet = new Set(currentAccounts.map((a) => a.id));

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-2xl h-full flex flex-col overflow-hidden">
          <DrawerHeader className="border-b border-border-subtle px-4 md:px-6 py-4">
            <DrawerTitle className="text-text-primary text-lg font-semibold flex items-center gap-2">
              <Mail size={18} className="text-primary-base" />
              Edit Sender Accounts
            </DrawerTitle>
            <p className="text-xs text-text-muted mt-1">
              Select sending accounts for this campaign. Campaign must be paused
              or ended to apply changes.
            </p>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {isSending && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-500 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>
                  This campaign is currently active (SENDING). Pause the
                  campaign first before saving new accounts.
                </span>
              </div>
            )}

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-text-muted"
              />
              <input
                type="text"
                className="skeu-input pl-9 py-1.5 text-sm bg-bg-base w-full"
                placeholder="Search sender accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-4 md:p-8 text-center border border-dashed border-border-subtle rounded-xl text-text-muted text-sm">
                No email accounts found matching search.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAccounts.map((acc) => {
                  const isSelected = selectedIds.includes(acc.id);
                  const isCurrentlyChosen = currentChosenSet.has(acc.id);

                  return (
                    <div
                      key={acc.id}
                      onClick={() => toggleAccount(acc.id)}
                      className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary-base/50 bg-primary-base/5"
                          : "border-border-subtle bg-bg-base hover:bg-bg-subtle/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-primary-base border-primary-base text-white"
                              : "border-border-subtle bg-bg-base"
                          }`}
                        >
                          {isSelected && <Check size={12} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary truncate">
                              {acc.label}
                            </span>
                            {isCurrentlyChosen && (
                              <span className="text-[10px] bg-bg-subtle border border-border-subtle text-text-muted px-1.5 py-0.5 rounded font-medium">
                                Active in campaign
                              </span>
                            )}
                            {!acc.isActive && (
                              <span className="text-[10px] bg-danger-bg text-danger-text px-1.5 py-0.5 rounded font-medium">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted truncate">
                            {acc.fromEmail}
                          </p>
                        </div>
                      </div>

                      {acc.healthScore !== undefined && (
                        <div className="text-xs font-semibold text-text-muted border border-border-subtle px-2 py-1 rounded-md bg-bg-subtle/50 shrink-0 ml-2">
                          Health: {acc.healthScore}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DrawerFooter className="border-t border-border-subtle px-4 md:px-6 py-4 flex flex-row justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSending || selectedIds.length === 0}
            >
              Update Accounts ({selectedIds.length})
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

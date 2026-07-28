"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Mail } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface ImportToCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
}

export default function ImportToCampaignModal({
  isOpen,
  onClose,
  listId,
}: ImportToCampaignModalProps) {
  const router = useRouter();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("new");

  const { data: rawCampaigns = [], isLoading: loading } = useQuery<Campaign[]>({
    queryKey: ["campaigns-list"],
    queryFn: async () => {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to load campaigns");
      return res.json();
    },
    enabled: isOpen,
    staleTime: 30 * 1000,
  });

  const campaigns = rawCampaigns.filter((c) => c.status !== "SENDING");

  const handleImport = () => {
    if (selectedCampaignId === "new") {
      router.push(`/campaigns/new?listId=${listId}`);
    } else {
      router.push(`/campaigns/${selectedCampaignId}?importList=${listId}`);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[95vw] sm:max-w-md p-4 sm:p-6 rounded-xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Import to Campaign</DialogTitle>
          <DialogDescription>
            Select an existing campaign to add these contacts to, or create a
            new campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-4">
          <label className="text-sm font-medium text-text-primary mb-2">
            Select Campaign
          </label>

          {loading ? (
            <div className="flex items-center gap-2 text-text-muted text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-base" />
              Loading campaigns...
            </div>
          ) : (
            <Select
              value={selectedCampaignId}
              onValueChange={setSelectedCampaignId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a campaign..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="new"
                  className="font-semibold text-primary-base flex items-center gap-2"
                >
                  <span className="flex items-center gap-2">
                    <Plus size={14} /> Create New Campaign
                  </span>
                </SelectItem>
                {campaigns.length > 0 && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Existing Campaigns
                  </div>
                )}
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <Mail size={14} className="text-text-muted" />
                      {c.name}{" "}
                      <span className="text-text-muted text-xs">
                        ({c.status})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 sm:mt-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={loading || !selectedCampaignId}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


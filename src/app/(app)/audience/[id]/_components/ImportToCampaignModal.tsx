"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("new");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/campaigns")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Only show campaigns that are DRAFT, PAUSED, SCHEDULED, or DONE
            // (Exclude SENDING to prevent concurrent editing issues, or include it if desired, but safest is to allow PAUSED/DONE)
            const available = data.filter(c => c.status !== "SENDING");
            setCampaigns(available);
          }
        })
        .catch((err) => console.error("Failed to load campaigns", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

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
      <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 rounded-xl">
        <DialogHeader>
          <DialogTitle>Import to Campaign</DialogTitle>
          <DialogDescription>
            Select an existing campaign to add these contacts to, or create a new campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <label className="text-sm font-medium text-text-primary">
            Select Campaign
          </label>
          
          {loading ? (
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading campaigns...
            </div>
          ) : (
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a campaign..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new" className="font-semibold text-primary-base flex items-center gap-2">
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
                      {c.name} <span className="text-text-muted text-xs">({c.status})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4 sm:mt-0">
          <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={loading || !selectedCampaignId} className="w-full sm:w-auto">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

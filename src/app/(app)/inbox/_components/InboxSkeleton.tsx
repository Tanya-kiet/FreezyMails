import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function InboxSkeleton() {
  return (
    <div className="skeu-page h-[100dvh] overflow-y-auto w-full flex flex-col">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4 w-full flex-1 flex flex-col animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-4 shrink-0">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        {/* 4 Stats Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="skeu-card p-4 flex flex-col justify-between h-20">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-7 w-12 mt-2" />
            </Card>
          ))}
        </div>

        {/* Controls Row: Search & Filter Pills */}
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center shrink-0">
          <Skeleton className="h-10 w-full lg:w-72 rounded-lg" />
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-md shrink-0" />
            ))}
          </div>
          <Skeleton className="h-4 w-32 lg:ml-auto shrink-0" />
        </div>

        {/* Table Container Skeleton */}
        <div className="skeu-card -skeu-base overflow-hidden flex-1 flex flex-col min-h-[400px]">
          {/* Table Header Skeleton */}
          <div className="bg-bg-subtle/60 px-4 py-3 border-b border-border-subtle grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <div className="col-span-3">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="col-span-5">
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="col-span-1 text-right flex justify-end">
              <Skeleton className="h-4 w-12" />
            </div>
          </div>

          {/* Table Rows Skeleton */}
          <div className="divide-y divide-border-subtle flex-1 overflow-y-auto">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="px-4 py-3.5 grid grid-cols-12 gap-4 items-center"
              >
                <div className="col-span-1 flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded shrink-0" />
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <div className="col-span-5 flex items-center gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32 hidden sm:inline" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="col-span-1 text-right flex justify-end">
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

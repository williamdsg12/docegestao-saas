"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* KPI Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white/50">
            <CardContent className="p-8">
              <div className="flex justify-between items-start mb-6">
                <Skeleton className="size-14 rounded-2xl" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-32" />
                <div className="flex justify-between pt-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="size-8 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden h-[400px]">
          <Skeleton className="h-full w-full" />
        </Card>
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden h-[400px]">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>

      {/* Chart Skeleton */}
      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden h-[400px]">
        <Skeleton className="h-full w-full" />
      </Card>
    </div>
  )
}

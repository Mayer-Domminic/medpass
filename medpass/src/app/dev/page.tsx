'use client';
import GeneralMetric from "@/components/analytics/generalMetric";

export default function DevPage() {
  return (
    <GeneralMetric
      title="Total Revenue"
      value="$1,250.00"
      trend={12.5}
      color="#22c55e"
      data={[]}
    />
  );
}
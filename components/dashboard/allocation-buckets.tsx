import { TrackedBucketCard } from "@/components/dashboard/tracked-bucket-card";
import { DepositBucketCard } from "@/components/dashboard/deposit-bucket-card";
import type { BucketWithEntries } from "@/lib/calculations";

export function AllocationBuckets({ buckets }: { buckets: BucketWithEntries[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {buckets.map((bucket) =>
        bucket.type === "deposit" ? (
          <DepositBucketCard key={bucket.id} bucket={bucket} />
        ) : (
          <TrackedBucketCard key={bucket.id} bucket={bucket} />
        ),
      )}
    </div>
  );
}

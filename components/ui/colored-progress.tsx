import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cn } from "cn";

export function ColoredProgress({
  value,
  indicatorClassName,
  className,
}: {
  value: number;
  indicatorClassName?: string;
  className?: string;
}) {
  return (
    <ProgressPrimitive.Root value={value} data-slot="progress">
      <ProgressPrimitive.Track
        className={cn(
          "relative flex h-2 w-full items-center overflow-x-hidden rounded-full bg-muted",
          className,
        )}
      >
        <ProgressPrimitive.Indicator
          className={cn("h-full bg-primary transition-all", indicatorClassName)}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

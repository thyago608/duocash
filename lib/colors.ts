export type BucketColor = "green" | "yellow" | "red" | "blue" | "purple" | "orange";

const BUCKET_COLOR_CLASSES: Record<
  BucketColor,
  { accent: string; iconBg: string; bar: string; text: string }
> = {
  green: {
    accent: "bg-positive",
    iconBg: "bg-positive/15 text-positive",
    bar: "bg-positive",
    text: "text-positive",
  },
  yellow: {
    accent: "bg-warning",
    iconBg: "bg-warning/15 text-warning",
    bar: "bg-warning",
    text: "text-warning",
  },
  red: {
    accent: "bg-negative",
    iconBg: "bg-negative/15 text-negative",
    bar: "bg-negative",
    text: "text-negative",
  },
  blue: {
    accent: "bg-info",
    iconBg: "bg-info/15 text-info",
    bar: "bg-info",
    text: "text-info",
  },
  purple: {
    accent: "bg-punctual",
    iconBg: "bg-punctual/15 text-punctual",
    bar: "bg-punctual",
    text: "text-punctual",
  },
  orange: {
    accent: "bg-margin",
    iconBg: "bg-margin/15 text-margin",
    bar: "bg-margin",
    text: "text-margin",
  },
};

export function bucketColorClasses(color: string) {
  return BUCKET_COLOR_CLASSES[color as BucketColor] ?? BUCKET_COLOR_CLASSES.blue;
}

// Thresholds de comprometimento de renda (seção 7)
export const COMMITMENT_THRESHOLDS = {
  warning: 0.7,
  danger: 0.9,
};

export function commitmentColorClasses(ratio: number) {
  if (ratio > COMMITMENT_THRESHOLDS.danger) return bucketColorClasses("red");
  if (ratio > COMMITMENT_THRESHOLDS.warning) return bucketColorClasses("yellow");
  return bucketColorClasses("green");
}

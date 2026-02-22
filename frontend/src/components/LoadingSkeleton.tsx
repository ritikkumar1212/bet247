import clsx from "clsx";

interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton = ({ className }: LoadingSkeletonProps) => (
  <div className={clsx("animate-pulse rounded-xl bg-base-700/60", className)} />
);

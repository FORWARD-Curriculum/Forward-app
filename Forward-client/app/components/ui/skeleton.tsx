import { cn } from "@/lib/utils"
 
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md brightness-50 bg-secondary/10", className)}
      {...props}
    />
  )
}
 
export { Skeleton }
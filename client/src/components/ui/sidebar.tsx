import * as React from "react";
import { cn } from "@/lib/utils";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(
      "flex flex-col h-full border-r border-border bg-background text-foreground",
      className
    )}
    {...props}
  />
));
Sidebar.displayName = "Sidebar";

export { Sidebar };

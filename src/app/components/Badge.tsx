import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "ai" | "accent";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "default", size = "md", className = "" }: BadgeProps) {
  const variantClasses = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    danger: "bg-red-500/15 text-red-700 dark:text-red-400",
    info: "bg-primary/10 text-primary",
    ai: "bg-gradient-to-r from-primary/10 to-accent/15 text-primary border border-primary/10",
    accent: "bg-accent/15 text-accent-foreground dark:text-accent",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}

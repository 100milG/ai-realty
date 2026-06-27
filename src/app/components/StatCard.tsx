import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
}: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold text-foreground mt-1 font-numeric">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 font-numeric ${trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`size-10 ${iconBgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`size-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

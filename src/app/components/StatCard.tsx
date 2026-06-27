import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

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
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="glass rounded-2xl p-5 shadow-soft hover:shadow-elevated transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2 font-numeric">{value}</p>
          {trend && (
            <div className={`inline-flex items-center text-xs mt-3 px-2 py-1 rounded-md font-medium ${trend.positive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>
              <span className="mr-1">{trend.positive ? "↑" : "↓"}</span> {trend.value}
            </div>
          )}
        </div>
        <div className={`size-12 ${iconBgColor} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon className={`size-6 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
  );
}

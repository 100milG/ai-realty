import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export function Card({ children, className = "", padding = true, hover = false }: CardProps) {
  return (
    <div
      className={`bg-card rounded-xl border border-border shadow-soft ${
        hover ? "hover:shadow-elevated transition-shadow cursor-pointer" : ""
      } ${padding ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

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
      className={`bg-white rounded-xl border border-gray-200 ${
        hover ? "hover:shadow-md transition-shadow cursor-pointer" : "shadow-sm"
      } ${padding ? "p-6" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

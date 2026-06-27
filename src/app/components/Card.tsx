import { ReactNode } from "react";
import { motion } from "motion/react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
}

export function Card({ children, className = "", padding = true, hover = false }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : {}}
      className={`glass rounded-2xl shadow-soft ${
        hover ? "hover:shadow-elevated transition-all cursor-pointer" : ""
      } ${padding ? "p-6" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

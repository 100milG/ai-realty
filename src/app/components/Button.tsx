import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "accent";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className = "", children, ...props },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-lg transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

    const variantClasses = {
      primary: "bg-primary text-primary-foreground shadow-soft hover:shadow-elevated",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-border bg-card text-foreground hover:bg-secondary",
      ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 shadow-soft hover:shadow-elevated dark:bg-emerald-500 dark:hover:bg-emerald-600",
      accent: "bg-accent text-accent-foreground shadow-soft hover:shadow-elevated",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98, y: 0 }}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  borderRadius?: string;
  background?: string;
}

const BASE_CLASSES =
  "inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-lg bg-blue-500";

const Button = ({
  children,
  type = "button",
  className,
  borderRadius,
  background,
  style,
  ...rest
}: Readonly<ButtonProps>) => {
  const customStyle: CSSProperties | undefined =
    borderRadius !== undefined ||
    background !== undefined ||
    style !== undefined
      ? {
          ...(borderRadius !== undefined ? { borderRadius } : {}),
          ...(background !== undefined ? { background } : {}),
          ...style,
        }
      : undefined;

  return (
    <button
      type={type}
      className={twMerge(BASE_CLASSES, className)}
      style={customStyle}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;

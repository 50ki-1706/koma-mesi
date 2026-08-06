"use client";

import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { twMerge } from "tailwind-merge";

interface TransparentButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  borderRadius?: string;
  border?: string;
  borderColor?: string;
}

const BASE_CLASSES =
  "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-lg border border-solid border-blue-500 bg-transparent text-blue-500";

const TransparentButton = ({
  children,
  type = "button",
  className,
  borderRadius,
  border,
  borderColor,
  style,
  ...rest
}: Readonly<TransparentButtonProps>) => {
  const customStyle: CSSProperties | undefined =
    borderRadius !== undefined ||
    border !== undefined ||
    borderColor !== undefined ||
    style !== undefined
      ? {
          ...(borderRadius !== undefined ? { borderRadius } : {}),
          ...(border !== undefined ? { border } : {}),
          ...(borderColor !== undefined
            ? { borderColor, color: borderColor }
            : {}),
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

export default TransparentButton;

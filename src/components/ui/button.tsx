import type { Route } from "next";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "violet";
type ButtonSize = "sm" | "md" | "lg";

interface SharedButtonProps {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

type ButtonActionProps = SharedButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedButtonProps> & {
    href?: never;
  };

type ButtonLinkProps = SharedButtonProps & {
  href: Route;
  "aria-label"?: string;
  nativeNavigation?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-coral text-ink shadow-[0_5px_0_var(--color-coral-deep)] hover:-translate-y-0.5 hover:shadow-[0_7px_0_var(--color-coral-deep)] focus-visible:outline-coral",
  secondary:
    "border border-ink/15 bg-white text-ink shadow-sm hover:border-ink/30 hover:bg-cream focus-visible:outline-ink",
  ghost: "bg-transparent text-ink hover:bg-ink/5 focus-visible:outline-ink",
  violet:
    "bg-violet text-white shadow-[0_5px_0_var(--color-violet-deep)] hover:-translate-y-0.5 hover:shadow-[0_7px_0_var(--color-violet-deep)] focus-visible:outline-violet",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-6 text-base",
};

function getButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

function isButtonLink(
  props: ButtonActionProps | ButtonLinkProps,
): props is ButtonLinkProps {
  return props.href !== undefined;
}

export function Button(props: ButtonActionProps | ButtonLinkProps) {
  const variant = props.variant ?? "primary";
  const size = props.size ?? "md";

  if (isButtonLink(props)) {
    const { children, className, href, nativeNavigation } = props;
    if (nativeNavigation) {
      return (
        <a
          href={href}
          className={getButtonClassName(variant, size, className)}
          aria-label={props["aria-label"]}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className={getButtonClassName(variant, size, className)}
        aria-label={props["aria-label"]}
      >
        {children}
      </Link>
    );
  }

  const {
    children,
    className,
    type = "button",
    variant: actionVariant,
    size: actionSize,
    ...buttonProps
  } = props;
  return (
    <button
      type={type}
      className={getButtonClassName(
        actionVariant ?? "primary",
        actionSize ?? "md",
        className,
      )}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

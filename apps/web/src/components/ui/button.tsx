import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
export function Button({
  className = "",
  variant = "default",
  ...props
}: ComponentProps<typeof BaseButton> & { variant?: "default" | "secondary" | "ghost" | "danger" }) {
  return <BaseButton className={`button button-${variant} ${className}`} {...props} />;
}

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { X } from "lucide-react";
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  sheet = false,
  className = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  sheet?: boolean;
  className?: string;
}) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="dialog-backdrop" />
        <BaseDialog.Popup className={`dialog ${sheet ? "sheet" : ""} ${className}`}>
          <BaseDialog.Title>{title}</BaseDialog.Title>
          <BaseDialog.Description className={sheet ? "sr-only" : undefined}>
            {description}
          </BaseDialog.Description>
          <BaseDialog.Close className="dialog-close" aria-label="Close dialog">
            <X size={18} />
          </BaseDialog.Close>
          {children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

import { Dialog } from "./dialog";
import type { ComponentProps } from "react";
export function Sheet(props: ComponentProps<typeof Dialog>) {
  return <Dialog {...props} sheet />;
}

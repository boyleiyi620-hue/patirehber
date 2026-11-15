import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-semibold leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";

/** Form alanı için açıklama / hata metni */
function FieldHint({
  children,
  error,
  id,
}: {
  children: React.ReactNode;
  error?: boolean;
  id?: string;
}) {
  return (
    <p
      id={id}
      className={cn(
        "text-xs leading-relaxed",
        error ? "text-danger" : "text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}

export { Label, FieldHint };

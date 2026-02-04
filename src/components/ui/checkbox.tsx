"use client";

import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, onCheckedChange, checked, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate ?? false;
      }
    }, [indeterminate, inputRef]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={inputRef}
          checked={checked}
          onChange={handleChange}
          className="peer sr-only"
          {...props}
        />
        <div
          className={cn(
            "h-4 w-4 shrink-0 rounded border border-zinc-300 bg-white",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-zinc-950 peer-focus-visible:ring-offset-2",
            "peer-checked:border-zinc-900 peer-checked:bg-zinc-900",
            "peer-indeterminate:border-zinc-900 peer-indeterminate:bg-zinc-900",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            "dark:border-zinc-700 dark:bg-zinc-950",
            "dark:peer-focus-visible:ring-zinc-300",
            "dark:peer-checked:border-zinc-50 dark:peer-checked:bg-zinc-50",
            "dark:peer-indeterminate:border-zinc-50 dark:peer-indeterminate:bg-zinc-50",
            "transition-colors duration-150",
            className
          )}
        >
          {indeterminate ? (
            <Minus className="h-3 w-3 text-white dark:text-zinc-900 m-auto" />
          ) : (
            checked && <Check className="h-3 w-3 text-white dark:text-zinc-900 m-auto" />
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };

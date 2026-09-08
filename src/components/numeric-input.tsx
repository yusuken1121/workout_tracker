"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

type NumericInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: number
  /** Called with the parsed number; an empty/invalid field becomes 0. */
  onValueChange: (value: number) => void
}

/**
 * Number input that hands a real `number` to react-hook-form instead of the
 * raw string, so Zod `z.number()` schemas validate without coercion.
 */
export function NumericInput({
  value,
  onValueChange,
  ...props
}: NumericInputProps) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      value={Number.isNaN(value) ? "" : value}
      onChange={(event) => {
        const parsed = event.target.valueAsNumber
        onValueChange(Number.isNaN(parsed) ? 0 : parsed)
      }}
      {...props}
    />
  )
}

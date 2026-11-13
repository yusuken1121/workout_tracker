"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { formatNumericText, parseNumericText } from "@/lib/numeric-text"

type NumericInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "step" | "min" | "max"
> & {
  value: number
  /** Called with the parsed number; an empty field becomes 0. */
  onValueChange: (value: number) => void
}

/**
 * Decimal-friendly number field that hands a real `number` to
 * react-hook-form.
 *
 * It keeps the typed text locally instead of using `<input type="number">`,
 * because some mobile browsers report an in-progress value such as "62."
 * as empty — which used to reset the field to 0 mid-typing. Full-width
 * digits and "," / "．" decimal marks are accepted too.
 */
export function NumericInput({
  value,
  onValueChange,
  ...props
}: NumericInputProps) {
  const [text, setText] = React.useState(() => formatNumericText(value))
  const [syncedValue, setSyncedValue] = React.useState(value)

  // The form changed the value from outside (reset, "前回の記録を入力").
  if (value !== syncedValue) {
    setSyncedValue(value)
    if ((parseNumericText(text) ?? 0) !== value) {
      setText(formatNumericText(value))
    }
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      placeholder="0"
      value={text}
      onChange={(event) => {
        const parsed = parseNumericText(event.target.value)
        if (parsed === undefined) return // reject non-numeric characters
        setText(event.target.value)
        setSyncedValue(parsed ?? 0)
        onValueChange(parsed ?? 0)
      }}
      {...props}
    />
  )
}

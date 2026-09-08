"use client"

import * as React from "react"
import type { NotionOption } from "@/core/domain/notion-option"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ExerciseSelectProps = Omit<
  React.ComponentProps<typeof SelectTrigger>,
  "value" | "onChange"
> & {
  value: string
  onValueChange: (exercisePageId: string) => void
  options: NotionOption[] | undefined
  isLoading?: boolean
}

/**
 * Exercise (種目) picker shared by the log form and the progress chart.
 * Extra props go to the trigger so it can sit inside a shadcn `FormControl`.
 */
export function ExerciseSelect({
  value,
  onValueChange,
  options,
  isLoading = false,
  ...triggerProps
}: ExerciseSelectProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={isLoading}
    >
      <SelectTrigger {...triggerProps}>
        <SelectValue
          placeholder={isLoading ? "読み込み中..." : "種目を選択してください"}
        />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

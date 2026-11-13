"use client"

import * as React from "react"
import { Check, ChevronsUpDown, History } from "lucide-react"
import {
  collectExerciseTags,
  filterExerciseOptions,
  pickRecentExercises,
  type ExerciseOption,
} from "@/core/domain/exercise-option"
import { formatShortDate } from "@/lib/workout-format"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** One-tap shortcuts shown under the trigger. */
const QUICK_PICK_LIMIT = 6
/** "最近の種目" group at the top of the picker. */
const RECENT_GROUP_LIMIT = 5

type ExerciseSelectProps = Omit<
  React.ComponentProps<"button">,
  "value" | "onChange" | "type"
> & {
  value: string
  onValueChange: (exercisePageId: string) => void
  options: ExerciseOption[] | undefined
  isLoading?: boolean
  /** Show recently used exercises as one-tap chips under the trigger. */
  showQuickPicks?: boolean
}

/**
 * Exercise (種目) picker shared by the log form and the progress chart.
 * Opens a searchable list (kana-insensitive) with tag filters and recently
 * used exercises first. Extra props go to the trigger so it can sit inside
 * a shadcn `FormControl`.
 */
export function ExerciseSelect({
  value,
  onValueChange,
  options,
  isLoading = false,
  showQuickPicks = false,
  className,
  ...triggerProps
}: ExerciseSelectProps) {
  const [open, setOpen] = React.useState(false)
  const allOptions = React.useMemo(() => options ?? [], [options])
  const selected = allOptions.find((option) => option.id === value)
  const quickPicks = React.useMemo(
    () => pickRecentExercises(allOptions, QUICK_PICK_LIMIT),
    [allOptions],
  )

  const select = (exercisePageId: string) => {
    onValueChange(exercisePageId)
    setOpen(false)
  }

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="dialog"
        disabled={isLoading}
        onClick={() => setOpen(true)}
        className="w-full justify-between font-normal"
        {...triggerProps}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {isLoading
            ? "読み込み中..."
            : (selected?.label ?? "種目を選択してください")}
        </span>
        <ChevronsUpDown className="opacity-50" />
      </Button>

      {showQuickPicks && quickPicks.length > 0 && (
        <div
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="最近の種目"
        >
          {quickPicks.map((option) => (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant={option.id === value ? "default" : "secondary"}
              aria-pressed={option.id === value}
              className="h-8 max-w-[14rem] shrink-0 rounded-full"
              onClick={() => onValueChange(option.id)}
            >
              <span className="truncate">{option.label}</span>
            </Button>
          ))}
        </div>
      )}

      <ExercisePickerDialog
        open={open}
        onOpenChange={setOpen}
        options={allOptions}
        value={value}
        onSelect={select}
      />
    </div>
  )
}

type ExercisePickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: ExerciseOption[]
  value: string
  onSelect: (exercisePageId: string) => void
}

function ExercisePickerDialog({
  open,
  onOpenChange,
  options,
  value,
  onSelect,
}: ExercisePickerDialogProps) {
  const isMobile = useIsMobile()
  const [query, setQuery] = React.useState("")
  const [tag, setTag] = React.useState<string | null>(null)

  const tags = React.useMemo(() => collectExerciseTags(options), [options])
  const filtered = React.useMemo(
    () => filterExerciseOptions(options, { query, tag }),
    [options, query, tag],
  )
  const isFiltering = query.trim().length > 0 || tag !== null
  const recent = React.useMemo(
    () => (isFiltering ? [] : pickRecentExercises(options, RECENT_GROUP_LIMIT)),
    [options, isFiltering],
  )

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery("")
      setTag(null)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        // Pin to the top on phones so the on-screen keyboard can't hide the list.
        className="top-4 translate-y-0 gap-0 overflow-hidden p-0 sm:top-[50%] sm:translate-y-[-50%]"
        onOpenAutoFocus={(event) => {
          // On phones, don't pop the keyboard: most picks are a tap away.
          if (isMobile) event.preventDefault()
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>種目を選択</DialogTitle>
          <DialogDescription>
            名前で検索するか、タグで絞り込んで種目を選んでください。
          </DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false} loop>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="種目名で検索（ひらがな・カタカナどちらでも）"
            // 16px on phones prevents iOS from zooming into the field.
            className="h-12 text-base sm:text-sm"
          />

          {tags.length > 0 && (
            <div
              className="flex gap-1.5 overflow-x-auto border-b px-3 py-2"
              role="group"
              aria-label="タグで絞り込み"
            >
              <TagChip active={tag === null} onClick={() => setTag(null)}>
                すべて
              </TagChip>
              {tags.map((name) => (
                <TagChip
                  key={name}
                  active={tag === name}
                  onClick={() => setTag(tag === name ? null : name)}
                >
                  {name}
                </TagChip>
              ))}
            </div>
          )}

          <CommandList className="max-h-[60vh] sm:max-h-[400px]">
            {filtered.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                該当する種目がありません
              </p>
            )}

            {recent.length > 0 && (
              <CommandGroup heading="最近の種目">
                {recent.map((option) => (
                  <ExerciseItem
                    key={option.id}
                    itemValue={`recent:${option.id}`}
                    option={option}
                    selected={option.id === value}
                    onSelect={onSelect}
                    showLastPerformed
                  />
                ))}
              </CommandGroup>
            )}

            {filtered.length > 0 && (
              <CommandGroup
                heading={isFiltering ? `${filtered.length} 件` : "すべての種目"}
              >
                {filtered.map((option) => (
                  <ExerciseItem
                    key={option.id}
                    itemValue={`all:${option.id}`}
                    option={option}
                    selected={option.id === value}
                    onSelect={onSelect}
                  />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function TagChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      aria-pressed={active}
      className="h-7 shrink-0 rounded-full px-3 text-xs"
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function ExerciseItem({
  itemValue,
  option,
  selected,
  onSelect,
  showLastPerformed = false,
}: {
  itemValue: string
  option: ExerciseOption
  selected: boolean
  onSelect: (exercisePageId: string) => void
  showLastPerformed?: boolean
}) {
  return (
    <CommandItem
      value={itemValue}
      onSelect={() => onSelect(option.id)}
      className="py-3 sm:py-2"
    >
      <Check className={cn("size-4", selected ? "opacity-100" : "opacity-0")} />
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {showLastPerformed && option.lastPerformedAt ? (
        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
          <History className="size-3" />
          {formatShortDate(option.lastPerformedAt)}
        </span>
      ) : (
        option.tags &&
        option.tags.length > 0 && (
          <span className="text-muted-foreground shrink-0 truncate text-xs">
            {option.tags.join("・")}
          </span>
        )
      )}
    </CommandItem>
  )
}

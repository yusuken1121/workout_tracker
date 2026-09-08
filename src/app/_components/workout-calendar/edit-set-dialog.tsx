"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"

import { useUpdateWorkoutLog } from "@/lib/api/queries/useWorkoutLog"
import {
  workoutLogPatchSchema,
  type WorkoutLogPatchRequest,
} from "@/lib/validators/workout-log.schema"
import type { WorkoutCalendarSet } from "@/core/domain/workout-calendar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { NumericInput } from "@/components/numeric-input"
import { Textarea } from "@/components/ui/textarea"

type EditSetDialogProps = {
  set: WorkoutCalendarSet
  exerciseName: string
}

/** Pencil icon that opens a small form to fix kg / reps / notes of one set. */
export function EditSetDialog({ set, exerciseName }: EditSetDialogProps) {
  const [open, setOpen] = React.useState(false)

  const form = useForm<WorkoutLogPatchRequest>({
    resolver: zodResolver(workoutLogPatchSchema),
    defaultValues: {
      weightKg: set.weightKg,
      reps: set.reps,
      notes: set.notes ?? "",
    },
  })

  const { mutate, isPending } = useUpdateWorkoutLog({
    onSuccess: () => {
      toast.success("セットを更新しました")
      setOpen(false)
    },
    onError: (error) => {
      toast.error(error.message || "更新に失敗しました")
    },
  })

  const handleOpenChange = (next: boolean) => {
    if (next) {
      form.reset({
        weightKg: set.weightKg,
        reps: set.reps,
        notes: set.notes ?? "",
      })
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-7"
          aria-label={`${exerciseName} ${set.weightKg} kg × ${set.reps} 回 を編集`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>セットを編集</DialogTitle>
          <DialogDescription>
            {exerciseName} の記録を修正します。種目と日付は変更できません。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((patch) =>
              mutate({ logId: set.id, patch }),
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>重量 (kg)</FormLabel>
                    <FormControl>
                      <NumericInput
                        step="0.5"
                        min={0}
                        value={value}
                        onValueChange={onChange}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reps"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>回数</FormLabel>
                    <FormControl>
                      <NumericInput
                        step="0.1"
                        min={0}
                        value={value}
                        onValueChange={onChange}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>感想（任意）</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

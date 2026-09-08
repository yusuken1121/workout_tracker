"use client"

import * as React from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useDeleteWorkoutLog } from "@/lib/api/queries/useWorkoutLog"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type DeleteSetButtonProps = {
  setId: string
  /** Human-readable description shown in the confirmation, e.g. "ベンチプレス 60 kg × 8 回". */
  label: string
}

/** Trash icon with a confirmation dialog; archives the set in Notion. */
export function DeleteSetButton({ setId, label }: DeleteSetButtonProps) {
  const [open, setOpen] = React.useState(false)

  const { mutate, isPending } = useDeleteWorkoutLog({
    onSuccess: () => {
      toast.success("セットを削除しました")
      setOpen(false)
    },
    onError: (error) => {
      toast.error(error.message || "削除に失敗しました")
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-7"
          aria-label={`${label} を削除`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>このセットを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{label}」を Notion のゴミ箱に移動します。必要なら Notion
            側から復元できます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              // Keep the dialog open until the request settles.
              event.preventDefault()
              mutate(setId)
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                削除中...
              </>
            ) : (
              "削除する"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

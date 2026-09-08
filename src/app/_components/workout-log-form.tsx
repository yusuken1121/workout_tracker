"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Dumbbell, Loader2 } from "lucide-react"

import {
  useCreateWorkoutLog,
  useExerciseOptions,
  useWorkoutProgress,
} from "@/lib/api/queries/useWorkoutLog"
import {
  workoutLogFormSchema,
  type WorkoutLogFormValues,
} from "@/lib/validators/workout-log.schema"
import {
  latestProgressPoint,
  type WorkoutProgressPoint,
} from "@/core/domain/workout-progress"
import { todayIso } from "@/lib/workout-format"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { NumericInput } from "@/components/numeric-input"
import { Textarea } from "@/components/ui/textarea"
import { ExerciseSelect } from "./exercise-select"
import { LastSessionHint } from "./last-session-hint"

function defaultValues(): WorkoutLogFormValues {
  return {
    exercisePageId: "",
    weightKg: 0,
    reps: 0,
    performedAt: todayIso(),
    notes: "",
  }
}

export function WorkoutLogForm() {
  const { data: exerciseOptions, isLoading: isLoadingExercises } =
    useExerciseOptions()

  const form = useForm<WorkoutLogFormValues>({
    resolver: zodResolver(workoutLogFormSchema),
    defaultValues: defaultValues(),
  })

  const exercisePageId = form.watch("exercisePageId")
  const { data: progress = [], isLoading: isLoadingProgress } =
    useWorkoutProgress(exercisePageId)
  const lastSession = latestProgressPoint(progress)

  const { mutate, isPending } = useCreateWorkoutLog({
    onSuccess: () => {
      toast.success("記録を保存しました")
      // Keep exercise + weight so the next set of the same exercise is one tap away.
      form.reset({
        ...defaultValues(),
        exercisePageId: form.getValues("exercisePageId"),
        weightKg: form.getValues("weightKg"),
      })
    },
    onError: (error) => {
      toast.error(error.message || "保存に失敗しました")
    },
  })

  const applyLastSession = (session: WorkoutProgressPoint) => {
    form.setValue("weightKg", session.weightKg, { shouldDirty: true })
    form.setValue("reps", session.reps, { shouldDirty: true })
    form.setFocus("reps")
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          記録を追加
        </CardTitle>
        <CardDescription>
          セットを入力すると Notion のデータベースに保存されます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="exercisePageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>種目</FormLabel>
                  <FormControl>
                    <ExerciseSelect
                      className="w-full"
                      value={field.value}
                      onValueChange={field.onChange}
                      options={exerciseOptions}
                      isLoading={isLoadingExercises}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {exercisePageId && (
              <LastSessionHint
                lastSession={lastSession}
                isLoading={isLoadingProgress}
                onApply={applyLastSession}
              />
            )}

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
              name="performedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>実施日</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>感想（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="調子はどうでしたか？"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Dumbbell className="mr-2 h-4 w-4" />
                  記録を保存
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

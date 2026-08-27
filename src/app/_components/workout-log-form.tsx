"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Dumbbell, Loader2 } from "lucide-react"
import { format } from "date-fns"

import {
  useCreateWorkoutLog,
  useExerciseOptions,
} from "@/lib/api/queries/useWorkoutLog"
import {
  workoutLogFormSchema,
  type WorkoutLogFormValues,
} from "@/lib/validators/workout-log.schema"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd")
}

export function WorkoutLogForm() {
  const { data: exerciseOptions, isLoading: isLoadingExercises } =
    useExerciseOptions()

  const form = useForm<WorkoutLogFormValues>({
    resolver: zodResolver(workoutLogFormSchema),
    defaultValues: {
      exercisePageId: "",
      weightKg: 0,
      reps: 0,
      performedAt: todayIso(),
      notes: "",
    },
  })

  const { mutate, isPending } = useCreateWorkoutLog({
    onSuccess: () => {
      toast.success("記録を保存しました")
      form.reset({
        exercisePageId: form.getValues("exercisePageId"),
        weightKg: form.getValues("weightKg"),
        reps: 0,
        performedAt: todayIso(),
        notes: "",
      })
    },
    onError: (error) => {
      toast.error(error.message || "保存に失敗しました")
    },
  })

  const onSubmit = (values: WorkoutLogFormValues) => {
    mutate(values)
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="exercisePageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>種目</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingExercises}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingExercises
                              ? "読み込み中..."
                              : "種目を選択してください"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {exerciseOptions?.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>重量 (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min={0}
                        inputMode="decimal"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.valueAsNumber
                          field.onChange(Number.isNaN(value) ? 0 : value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>回数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min={0}
                        inputMode="decimal"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.valueAsNumber
                          field.onChange(Number.isNaN(value) ? 0 : value)
                        }}
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

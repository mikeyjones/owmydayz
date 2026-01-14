import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { useState } from "react";
import { KANBAN_IMPORTANCE_VALUES, KANBAN_EFFORT_VALUES } from "~/db/schema";

export const itemFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional()
    .or(z.literal("")),
  importance: z.enum(KANBAN_IMPORTANCE_VALUES).default("medium"),
  effort: z.enum(KANBAN_EFFORT_VALUES).default("medium"),
  tags: z.array(z.string()).default([]),
});

export type ItemFormData = z.infer<typeof itemFormSchema>;

interface ItemFormProps {
  defaultValues?: Partial<ItemFormData>;
  onSubmit: (data: ItemFormData) => void | Promise<void>;
  isPending?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
}

const importanceLabels: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-green-500/20 text-green-600 border-green-500/30" },
  medium: { label: "Medium", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" },
  high: { label: "High", color: "bg-red-500/20 text-red-600 border-red-500/30" },
};

const effortLabels: Record<string, { label: string; color: string }> = {
  small: { label: "Small", color: "bg-blue-500/20 text-blue-600 border-blue-500/30" },
  medium: { label: "Medium", color: "bg-purple-500/20 text-purple-600 border-purple-500/30" },
  big: { label: "Big", color: "bg-orange-500/20 text-orange-600 border-orange-500/30" },
};

export function ItemForm({
  defaultValues,
  onSubmit,
  isPending = false,
  submitLabel = "Create Item",
  onCancel,
  cancelLabel = "Cancel",
}: ItemFormProps) {
  const [tagInput, setTagInput] = useState("");

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      importance: "medium",
      effort: "medium",
      tags: [],
      ...defaultValues,
    },
  });

  const tags = form.watch("tags") || [];

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      form.setValue("tags", [...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue("tags", tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter item name"
                  className="h-11 text-base"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/200 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Description (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter item description"
                  className="min-h-[80px] text-base resize-none"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {field.value?.length || 0}/2000 characters
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="importance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Importance</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select importance" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KANBAN_IMPORTANCE_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${importanceLabels[value].color}`}>
                          {importanceLabels[value].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="effort"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Effort</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isPending}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select effort" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {KANBAN_EFFORT_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${effortLabels[value].color}`}>
                          {effortLabels[value].label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormItem>
          <FormLabel className="text-base font-medium">Tags (Optional)</FormLabel>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              className="h-10"
              disabled={isPending}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addTag}
              disabled={isPending || !tagInput.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
                    disabled={isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </FormItem>

        <div className="flex flex-col gap-4 pt-4 border-t border-border">
          <div className="flex gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={isPending}
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

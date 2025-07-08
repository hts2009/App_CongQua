"use client";

import React, { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import type { Unit, WorkType } from "@/types";

type CategoryItem = Unit | WorkType;

const categorySchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự."),
  priority: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().min(0, "Thứ tự ưu tiên phải là số không âm.").default(0)
  ),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormDialogProps<T extends CategoryItem> {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  itemToEdit?: T | null;
  onSubmit: (data: CategoryFormData, id?: string) => Promise<void>;
  itemTypeLabel: string; // e.g., "Đơn Vị" or "Loại Việc"
}

export function CategoryFormDialog<T extends CategoryItem>({
  isOpen,
  setIsOpen,
  itemToEdit,
  onSubmit,
  itemTypeLabel,
}: CategoryFormDialogProps<T>) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  useEffect(() => {
    if (itemToEdit) {
      reset({
        name: itemToEdit.name,
        priority: itemToEdit.priority,
        isActive: itemToEdit.isActive,
      });
    } else {
      reset({ name: "", priority: 0, isActive: true });
    }
  }, [itemToEdit, reset, isOpen]); // Reset when dialog opens or itemToEdit changes

  const handleFormSubmit: SubmitHandler<CategoryFormData> = async (data) => {
    await onSubmit(data, itemToEdit?.id);
    // setIsOpen(false); // Parent should control this to allow for async operations
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">
            {itemToEdit ? `Chỉnh Sửa ${itemTypeLabel}` : `Thêm ${itemTypeLabel} Mới`}
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin chi tiết cho {itemTypeLabel.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Tên {itemTypeLabel}</Label>
            <Input id="name" {...register("name")} className="mt-1" placeholder={`Nhập tên ${itemTypeLabel.toLowerCase()}`} />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="priority">Thứ Tự Ưu Tiên</Label>
            <Input id="priority" type="number" {...register("priority")} className="mt-1" placeholder="0" />
            {errors.priority && <p className="text-sm text-destructive mt-1">{errors.priority.message}</p>}
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="isActive">Kích hoạt</Label>
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>Hủy</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : (itemToEdit ? "Lưu Thay Đổi" : "Thêm Mới")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import type { Unit, WorkType } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, ArrowUpDown } from "lucide-react";

type CategoryItem = Unit | WorkType;

interface CategoryListProps<T extends CategoryItem> {
  items: T[];
  onEdit: (item: T) => void;
  onDelete: (itemId: string) => void;
  itemTypeLabel: string; // e.g., "Đơn Vị" or "Loại Việc"
  // onSort: (column: keyof T) => void; // Future: for sorting
}

export function CategoryList<T extends CategoryItem>({ items, onEdit, onDelete, itemTypeLabel }: CategoryListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Không có {itemTypeLabel.toLowerCase()} nào được tìm thấy.</p>
        <p className="text-sm">Hãy thêm mới để bắt đầu quản lý.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60%]">Tên {itemTypeLabel}</TableHead>
            <TableHead className="w-[20%] text-center">Trạng Thái</TableHead>
            <TableHead className="w-[20%] text-right">Hành Động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-center">
                <Badge variant={item.isActive ? "default" : "outline"} className={item.isActive ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-800 dark:text-green-200 dark:border-green-600" : "bg-red-100 text-red-700 border-red-300 dark:bg-red-800 dark:text-red-200 dark:border-red-600"}>
                  {item.isActive ? "Hoạt động" : "Ẩn"}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="icon" onClick={() => onEdit(item)} aria-label={`Sửa ${itemTypeLabel}`}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)} aria-label={`Xóa ${itemTypeLabel}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

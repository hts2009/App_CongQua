"use client";

import type { Template } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Copy, Eye } from "lucide-react";
import Link from "next/link";

interface TemplateListItemProps {
  template: Template;
  onDelete: (templateId: string) => void;
  onDuplicate: (templateId: string) => void;
}

export function TemplateListItem({ template, onDelete, onDuplicate }: TemplateListItemProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl">{template.name}</CardTitle>
          <Badge variant={template.isActive ? "default" : "secondary"} className={template.isActive ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
            {template.isActive ? "Hoạt động" : "Không hoạt động"}
          </Badge>
        </div>
        <CardDescription>
          Tạo ngày: {new Date(template.createdAt).toLocaleDateString('vi-VN')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Số trường dữ liệu: {template.configJson.fields?.length || 0}
        </p>
        {/* Could add a small visual preview or key fields here */}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => onDuplicate(template.id)} aria-label="Nhân bản mẫu">
          <Copy className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Nhân Bản</span>
        </Button>
        <Link href={`/templates/${template.id}/edit`} passHref>
          <Button variant="outline" size="sm" aria-label="Chỉnh sửa mẫu">
            <Edit2 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Sửa</span>
          </Button>
        </Link>
        <Button variant="destructive" size="sm" onClick={() => onDelete(template.id)} aria-label="Xóa mẫu">
          <Trash2 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Xóa</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

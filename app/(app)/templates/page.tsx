
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TemplateListItem } from "@/components/templates/template-list-item";
import type { Template } from "@/types";
import Link from "next/link";
import { PlusCircle, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const defaultMockTemplates: Template[] = [ // Renamed to avoid confusion if we load from localStorage
  { 
    id: "template1", 
    name: "Phiếu Công Đức Chung", 
    configJson: { 
      fields: [
        { id: "f1", fieldName: "donorName", label: "Họ Tên Thí Chủ", fieldType: "text", required: true, positionX: 10, positionY: 10},
        { id: "f2", fieldName: "amount", label: "Số Tiền", fieldType: "number", required: true, positionX: 10, positionY: 20},
        { id: "f3", fieldName: "notes", label: "Ghi Chú", fieldType: "text", required: false, positionX: 10, positionY: 30},
      ],
      organizationName:"Chùa Từ Tâm Hạnh", organizationAddress: "123 Đường An Bình, Phường An Lạc, Quận Bình Tân, TP.HCM", showLogoOnPrint: true, headerText: "PHIẾU CÔNG ĐỨC", footerText:"Xin chân thành cảm ơn!"
    }, 
    isActive: true, 
    createdAt: new Date(2023, 10, 15).toISOString() 
  },
  { 
    id: "template2", 
    name: "Phiếu Cúng Dường Trai Tăng", 
    configJson: { 
      fields: [
        { id: "f1", fieldName: "donorName", label: "Phật Tử", fieldType: "text", required: true, positionX: 10, positionY: 10},
        { id: "f2", fieldName: "amount", label: "Tịnh Tài", fieldType: "number", required: true, positionX: 10, positionY: 20},
        { id: "f3", fieldName: "eventDate", label: "Ngày Lễ", fieldType: "date", required: true, positionX: 10, positionY: 30},
      ] 
    }, 
    isActive: true, 
    createdAt: new Date(2023, 11, 1).toISOString() 
  },
  { 
    id: "template3", 
    name: "Phiếu Xây Dựng Chùa (Không hoạt động)", 
    configJson: { fields: [] }, 
    isActive: false, 
    createdAt: new Date(2023, 9, 5).toISOString() 
  },
];

const TEMPLATES_STORAGE_KEY = 'templates';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    let loadedTemplates: Template[] = [];
    try {
      const storedTemplatesRaw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (storedTemplatesRaw) {
        loadedTemplates = JSON.parse(storedTemplatesRaw);
        if (!Array.isArray(loadedTemplates) || loadedTemplates.length === 0) {
          // If stored data is invalid or empty, use default and save
          loadedTemplates = defaultMockTemplates;
          localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(defaultMockTemplates));
        }
      } else {
        // If nothing in localStorage, use initial mocks and save them
        loadedTemplates = defaultMockTemplates;
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(defaultMockTemplates));
      }
    } catch (error) {
      console.error("Error loading templates from localStorage:", error);
      loadedTemplates = defaultMockTemplates; // Fallback to mocks
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(defaultMockTemplates)); // Ensure localStorage is set
      toast({
        variant: "destructive",
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách mẫu phiếu. Sử dụng dữ liệu mặc định.",
      });
    }
    setTemplates(loadedTemplates);
    setIsLoading(false);
  }, [toast]);


  const handleDelete = (templateId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mẫu phiếu này? Hành động này không thể hoàn tác.")) {
      setTemplates(prev => {
        const updatedTemplates = prev.filter(t => t.id !== templateId);
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
        return updatedTemplates;
      });
      toast({ title: "Đã Xóa", description: "Mẫu phiếu đã được xóa." });
    }
  };

  const handleDuplicate = (templateId: string) => {
    const templateToDuplicate = templates.find(t => t.id === templateId);
    if (templateToDuplicate) {
      const newTemplate: Template = {
        ...JSON.parse(JSON.stringify(templateToDuplicate)), 
        id: `template-copy-${Date.now()}`, 
        name: `${templateToDuplicate.name} (Bản Sao)`,
        createdAt: new Date().toISOString(),
      };
      setTemplates(prev => {
        const updatedTemplates = [newTemplate, ...prev];
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
        return updatedTemplates;
      });
      toast({ title: "Đã Nhân Bản", description: `Mẫu phiếu "${newTemplate.name}" đã được tạo.` });
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center">Đang tải danh sách mẫu phiếu...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-headline font-bold">Quản Lý Mẫu Phiếu Công Quả</h1>
        <Link href="/templates/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            Tạo Mẫu Phiếu Mới
          </Button>
        </Link>
      </div>

      <div className="mb-6 relative">
        <Input 
          type="text"
          placeholder="Tìm kiếm mẫu phiếu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateListItem
              key={template.id}
              template={template}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy mẫu phiếu nào</h2>
          <p className="text-muted-foreground">
            {searchTerm ? "Thử tìm kiếm với từ khóa khác hoặc " : "Hãy "}
            <Link href="/templates/new" className="text-primary hover:underline">tạo mẫu phiếu mới</Link>.
          </p>
        </div>
      )}
    </div>
  );
}

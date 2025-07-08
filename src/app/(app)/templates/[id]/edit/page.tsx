
"use client";
// This is a dynamic route page, e.g., /templates/template1/edit

import { TemplateDesignerForm } from '@/components/templates/template-designer-form';
import type { Template } from '@/types';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Mock data fetching function - replace with actual API call
async function getTemplateById(id: string): Promise<Template | null> {
  const mockTemplates: Template[] = [
    { 
      id: "template1", 
      name: "Phiếu Công Đức Chung", 
      configJson: { 
        fields: [
          { id: "f1", fieldName: "donorName", label: "Họ Tên Thí Chủ", fieldType: "text", required: true, positionX: 10, positionY: 10},
          { id: "f2", fieldName: "amount", label: "Số Tiền", fieldType: "number", required: true, positionX: 10, positionY: 20},
          { id: "f3", fieldName: "notes", label: "Ghi Chú", fieldType: "text", required: false, positionX: 10, positionY: 30},
        ] 
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
  ];
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
  return mockTemplates.find(t => t.id === id) || null;
}


export default function EditTemplatePage() {
  const params = useParams();
  const templateId = typeof params.id === 'string' ? params.id : undefined;
  const [templateData, setTemplateData] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (templateId) {
      setLoading(true);
      getTemplateById(templateId)
        .then(data => {
          if (data) {
            setTemplateData(data);
          } else {
            setError("Không tìm thấy mẫu phiếu.");
          }
        })
        .catch(() => setError("Lỗi khi tải dữ liệu mẫu phiếu."))
        .finally(() => setLoading(false));
    } else {
      setError("ID mẫu phiếu không hợp lệ.");
      setLoading(false);
    }
  }, [templateId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        <p className="ml-2">Đang tải mẫu phiếu...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error}</div>;
  }

  if (!templateData) {
     return <div className="text-center py-10 text-muted-foreground">Không có dữ liệu mẫu phiếu.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <TemplateDesignerForm initialData={templateData} />
    </div>
  );
}

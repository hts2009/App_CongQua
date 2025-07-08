
"use client";

import { useState, useEffect, type ChangeEvent } from 'react';
import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ReceiptPreviewCanvas } from './receipt-preview-canvas';
import type { Template, TemplateField, TemplateConfig } from '@/types';
import { PlusCircle, Trash2, Save, Upload, GripVertical, Settings2, Palette, Info, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '../ui/textarea';

const fieldSchema = z.object({
  id: z.string().optional(), 
  fieldName: z.string().min(1, "Tên trường (mã) không được trống").regex(/^[a-zA-Z0-9_]+$/, "Chỉ dùng chữ, số, gạch dưới"),
  label: z.string().min(1, "Nhãn hiển thị không được trống"),
  fieldType: z.enum(["text", "number", "dropdown", "date", "phone", "image"]),
  required: z.boolean(),
  options: z.string().optional().describe("Các lựa chọn cho dropdown, cách nhau bởi dấu phẩy"),
  positionX: z.number().default(10),
  positionY: z.number().default(10),
});

const templateFormSchema = z.object({
  name: z.string().min(3, "Tên mẫu phiếu phải có ít nhất 3 ký tự."),
  isActive: z.boolean().default(true),
  fields: z.array(fieldSchema).min(0, "Mẫu phiếu phải có ít nhất một trường dữ liệu."), 
  backgroundImageUrl: z.string().url("URL hình nền không hợp lệ").optional().or(z.literal('')),
  logoUrl: z.string().url("URL logo không hợp lệ").optional().or(z.literal('')),
  logoPositionX: z.number().optional().default(10),
  logoPositionY: z.number().optional().default(10),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  organizationName: z.string().optional(),
  organizationAddress: z.string().optional(),
  showLogoOnPrint: z.boolean().default(true),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface TemplateDesignerFormProps {
  initialData?: Template; 
}

const availableFieldTypes: { value: TemplateField['fieldType']; label: string; defaultFieldName?: string; defaultLabel?: string; isSystemField?: boolean, defaultPositionX?: number, defaultPositionY?: number }[] = [
  { value: "text", label: "Văn bản một dòng", defaultPositionX: 10, defaultPositionY: 10 },
  { value: "number", label: "Số", defaultPositionX: 10, defaultPositionY: 30 },
  { value: "dropdown", label: "Danh sách chọn (tùy chỉnh)", defaultPositionX: 10, defaultPositionY: 50 },
  { value: "date", label: "Ngày tháng", defaultPositionX: 10, defaultPositionY: 70 },
  { value: "phone", label: "Số điện thoại", defaultPositionX: 10, defaultPositionY: 90 },
  { value: "text", label: "Tên người đóng góp (Hệ thống)", defaultFieldName: "donorName", defaultLabel: "Họ tên:", isSystemField: true, defaultPositionX: 20, defaultPositionY: 50 },
  { value: "text", label: "Số tiền (Hệ thống)", defaultFieldName: "amount", defaultLabel: "Số tiền:", isSystemField: true, defaultPositionX: 20, defaultPositionY: 70 },
  { value: "text", label: "Ngày đóng góp (Hệ thống)", defaultFieldName: "contributionDate", defaultLabel: "Ngày:", isSystemField: true, defaultPositionX: 300, defaultPositionY: 50 },
  { value: "text", label: "Số biên nhận (Hệ thống)", defaultFieldName: "receiptNumber", defaultLabel: "Số phiếu:", isSystemField: true, defaultPositionX: 300, defaultPositionY: 70 },
  { value: "text", label: "Đơn vị/Ban (Hệ thống)", defaultFieldName: "unitId", defaultLabel: "Đơn vị/Ban:", isSystemField: true, defaultPositionX: 20, defaultPositionY: 90 },
  { value: "text", label: "Về Việc (Hệ thống)", defaultFieldName: "workTypeId", defaultLabel: "Về việc:", isSystemField: true, defaultPositionX: 20, defaultPositionY: 110 },
  { value: "text", label: "Ghi chú (Hệ thống)", defaultFieldName: "notes", defaultLabel: "Ghi chú:", isSystemField: true, defaultPositionX: 20, defaultPositionY: 130 },
  { value: "text", label: "Khối Chữ Ký Người Lập Phiếu", defaultFieldName: "issuerSignatureBlock", defaultLabel: "Người lập phiếu\n(Ký, họ tên)", isSystemField: true, defaultPositionX: 550, defaultPositionY: 400 },
];

export function TemplateDesignerForm({ initialData }: TemplateDesignerFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [previewBgImageUrl, setPreviewBgImageUrl] = useState<string | undefined>(initialData?.configJson.backgroundImageUrl);
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | undefined>(initialData?.configJson.logoUrl);

  const { control, register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: initialData 
      ? { 
          name: initialData.name, 
          isActive: initialData.isActive,
          fields: initialData.configJson.fields.map(f => ({
            ...f, 
            id: f.id || String(Math.random()),
            positionX: f.positionX || 10,
            positionY: f.positionY || (initialData.configJson.fields.indexOf(f) * 20 + 50)
          })),
          backgroundImageUrl: initialData.configJson.backgroundImageUrl || "",
          logoUrl: initialData.configJson.logoUrl || "",
          logoPositionX: initialData.configJson.logoPositionX || 10,
          logoPositionY: initialData.configJson.logoPositionY || 10,
          headerText: initialData.configJson.headerText || "",
          footerText: initialData.configJson.footerText || "",
          organizationName: initialData.configJson.organizationName || "",
          organizationAddress: initialData.configJson.organizationAddress || "",
          showLogoOnPrint: initialData.configJson.showLogoOnPrint !== undefined ? initialData.configJson.showLogoOnPrint : true,
        } 
      : { 
          name: "", 
          isActive: true, 
          fields: [ 
            { id: String(Date.now()+1), fieldName: "donorName", label: "Họ tên:", fieldType: "text", required: true, options: "", positionX: 20, positionY: 50 },
            { id: String(Date.now()+2), fieldName: "amount", label: "Số tiền:", fieldType: "text", required: true, options: "", positionX: 20, positionY: 70 },
            { id: String(Date.now()+3), fieldName: "contributionDate", label: "Ngày:", fieldType: "text", required: true, options: "", positionX: 300, positionY: 50 },
            { id: String(Date.now()+4), fieldName: "receiptNumber", label: "Số phiếu:", fieldType: "text", required: true, options: "", positionX: 300, positionY: 70 },
          ], 
          backgroundImageUrl: "", 
          logoUrl: "",
          logoPositionX: 10,
          logoPositionY: 10,
          headerText: "PHIẾU CÔNG ĐỨC",
          footerText: "Xin chân thành cảm ơn quý vị!",
          organizationName: "Tên Chùa/Tổ Chức",
          organizationAddress: "Địa chỉ chùa/tổ chức",
          showLogoOnPrint: true,
        },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "fields",
  });

  const watchedFormValues = watch();

  useEffect(() => {
    if (initialData?.configJson.backgroundImageUrl) {
      setPreviewBgImageUrl(initialData.configJson.backgroundImageUrl);
    }
    if (initialData?.configJson.logoUrl) {
      setPreviewLogoUrl(initialData.configJson.logoUrl);
    }
  }, [initialData]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, type: 'background' | 'logo') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        if (type === 'background') {
          setPreviewBgImageUrl(dataUri);
          setValue('backgroundImageUrl', ''); // Clear URL if local file is chosen
        } else if (type === 'logo') {
          setPreviewLogoUrl(dataUri);
          setValue('logoUrl', ''); // Clear URL if local file is chosen
        }
        toast({ title: "Xem trước ảnh cục bộ", description: "Ảnh này chỉ hiển thị cho bạn. Để lưu, vui lòng cung cấp URL trực tiếp của hình ảnh đã được tải lên một dịch vụ lưu trữ (nếu ảnh này không phải từ URL)." });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit: SubmitHandler<TemplateFormData> = async (data) => {
    setIsSubmittingForm(true);
    
    // Use preview URLs if actual URLs are empty (meaning local file was likely used for preview)
    const finalLogoUrl = data.logoUrl || previewLogoUrl;
    const finalBackgroundImageUrl = data.backgroundImageUrl || previewBgImageUrl;

    const finalFields = data.fields.map(f => ({
      ...f,
      options: f.fieldType === 'dropdown' && f.options ? f.options.split(',').map(opt => opt.trim()) : undefined,
    }));

    const templateToSave: Template = {
      id: initialData?.id || `template-${Date.now()}`,
      name: data.name,
      configJson: { 
        fields: finalFields as unknown as TemplateField[], 
        backgroundImageUrl: finalBackgroundImageUrl, 
        logoUrl: finalLogoUrl,
        logoPositionX: data.logoPositionX,
        logoPositionY: data.logoPositionY,
        headerText: data.headerText,
        footerText: data.footerText,
        organizationName: data.organizationName,
        organizationAddress: data.organizationAddress,
        showLogoOnPrint: data.showLogoOnPrint,
      },
      isActive: data.isActive,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    try {
        const storedTemplatesRaw = localStorage.getItem('templates');
        let templates: Template[] = [];
        if (storedTemplatesRaw) {
            try {
                templates = JSON.parse(storedTemplatesRaw);
                if (!Array.isArray(templates)) templates = []; // Ensure it's an array
            } catch (e) {
                console.error("Error parsing templates from localStorage, resetting.", e);
                templates = []; // Reset if parsing fails
            }
        }
        
        const existingIndex = templates.findIndex(t => t.id === templateToSave.id);
        if (existingIndex > -1) {
            templates[existingIndex] = templateToSave;
        } else {
            templates.unshift(templateToSave); 
        }
        localStorage.setItem('templates', JSON.stringify(templates));
        
        toast({
          title: initialData ? "Cập Nhật Thành Công" : "Tạo Mới Thành Công",
          description: `Mẫu phiếu "${templateToSave.name}" đã được lưu.`,
        });
        router.push("/templates"); 
    } catch (e) {
        console.error("Failed to save template to localStorage", e);
        toast({
            variant: "destructive",
            title: "Lỗi Lưu Trữ",
            description: "Không thể lưu mẫu phiếu vào localStorage.",
        });
    } finally {
        setIsSubmittingForm(false);
    }
  };

  const addNewField = (selectedFieldType?: (typeof availableFieldTypes)[number]) => {
    let yPos = 50;
    if (fields.length > 0) {
        yPos = Math.max(...fields.map(f => f.positionY), 0) + 20; // Ensure yPos is at least 0
    }

    const baseField = {
      id: String(Date.now()), 
      fieldName: `custom_field_${fields.length + 1}`,
      label: `Trường Tùy Chỉnh ${fields.length + 1}`,
      fieldType: "text" as TemplateField['fieldType'],
      required: false,
      options: "",
      positionX: 10,
      positionY: selectedFieldType?.defaultPositionY || yPos,
    };

    if (selectedFieldType) {
        baseField.fieldType = selectedFieldType.value as TemplateField['fieldType'];
        if (selectedFieldType.defaultFieldName) {
            baseField.fieldName = selectedFieldType.defaultFieldName;
        }
        if (selectedFieldType.defaultLabel) {
            baseField.label = selectedFieldType.defaultLabel;
        }
        if (selectedFieldType.defaultPositionX) {
            baseField.positionX = selectedFieldType.defaultPositionX;
        }
    }
    append(baseField);
  };

  const updateFieldPosition = (index: number, axis: 'X' | 'Y', delta: number) => {
    const currentX = getValues(`fields.${index}.positionX`);
    const currentY = getValues(`fields.${index}.positionY`);
    if (axis === 'X') {
      setValue(`fields.${index}.positionX`, Math.max(0, currentX + delta));
    } else {
      setValue(`fields.${index}.positionY`, Math.max(0, currentY + delta));
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              {initialData ? "Chỉnh Sửa Mẫu Phiếu" : "Tạo Mẫu Phiếu Mới"}
            </CardTitle>
            <CardDescription>Thiết kế bố cục và các trường thông tin cho phiếu công quả.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="templateName" className="font-semibold">Tên Mẫu Phiếu</Label>
              <Input id="templateName" {...register("name")} placeholder="Ví dụ: Phiếu Công Đức Trai Tăng" className="mt-1"/>
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            
            <div className="flex items-center space-x-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                   <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <Label htmlFor="isActive" className="text-sm font-medium">Kích hoạt mẫu phiếu này</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Tùy Chỉnh Thông Tin & Giao Diện Phiếu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="organizationName">Tên Chùa/Tổ Chức (hiển thị trên phiếu)</Label>
                    <Input id="organizationName" {...register("organizationName")} placeholder="Chùa Từ Tâm Hạnh" className="mt-1"/>
                    {errors.organizationName && <p className="text-sm text-destructive mt-1">{errors.organizationName.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="organizationAddress">Địa Chỉ (hiển thị trên phiếu)</Label>
                    <Input id="organizationAddress" {...register("organizationAddress")} placeholder="123 Đường An Bình, TP. HCM" className="mt-1"/>
                    {errors.organizationAddress && <p className="text-sm text-destructive mt-1">{errors.organizationAddress.message}</p>}
                </div>
                <div>
                    <Label htmlFor="headerText">Tiêu Đề Đầu Phiếu</Label>
                    <Input id="headerText" {...register("headerText")} placeholder="PHIẾU CÔNG ĐỨC" className="mt-1"/>
                    {errors.headerText && <p className="text-sm text-destructive mt-1">{errors.headerText.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="footerText">Chân Trang Phiếu</Label>
                    <Textarea id="footerText" {...register("footerText")} placeholder="Xin chân thành cảm ơn quý vị..." className="mt-1"/>
                    {errors.footerText && <p className="text-sm text-destructive mt-1">{errors.footerText.message}</p>}
                </div>

                <Separator />
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Lưu ý về hình ảnh</AlertTitle>
                  <AlertDescription>
                    Tải file lên chỉ để xem trước cục bộ. Để lưu trữ hình ảnh lâu dài và hiển thị cho mọi người, vui lòng dán URL trực tiếp của hình ảnh đã được tải lên một dịch vụ lưu trữ (nếu ảnh này không phải từ URL công khai).
                  </AlertDescription>
                </Alert>

                 <div>
                    <Label htmlFor="logoUrlInput">URL Logo (dán URL để lưu trữ)</Label>
                    <Input id="logoUrlInput" {...register("logoUrl")} placeholder="https://example.com/logo.png" className="mt-1" onChange={(e) => { setValue('logoUrl', e.target.value); if(e.target.value) setPreviewLogoUrl(e.target.value); }}/>
                    {errors.logoUrl && <p className="text-sm text-destructive mt-1">{errors.logoUrl.message}</p>}
                    
                    <Label htmlFor="logoFile" className="text-xs text-muted-foreground mt-1 block">Hoặc chọn file để xem trước logo (chỉ xem trước, không lưu file nếu URL ở trên được điền):</Label>
                    <Input id="logoFile" type="file" accept="image/*" onChange={e => handleFileChange(e, 'logo')} className="mt-1 text-sm"/>
                 </div>
                 <div className="grid grid-cols-3 gap-4 items-end">
                    <div>
                        <Label htmlFor="logoPositionX">Logo X (px)</Label>
                        <Input id="logoPositionX" type="number" {...register("logoPositionX", { valueAsNumber: true })} className="mt-1"/>
                    </div>
                    <div>
                        <Label htmlFor="logoPositionY">Logo Y (px)</Label>
                        <Input id="logoPositionY" type="number" {...register("logoPositionY", { valueAsNumber: true })} className="mt-1"/>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setValue('logoPositionY', (getValues('logoPositionY') || 0) - 5)}><ArrowUp className="h-4 w-4"/></Button>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setValue('logoPositionY', (getValues('logoPositionY') || 0) + 5)}><ArrowDown className="h-4 w-4"/></Button>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setValue('logoPositionX', (getValues('logoPositionX') || 0) - 5)}><ArrowLeft className="h-4 w-4"/></Button>
                        <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setValue('logoPositionX', (getValues('logoPositionX') || 0) + 5)}><ArrowRight className="h-4 w-4"/></Button>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2 pt-2">
                    <Controller name="showLogoOnPrint" control={control} render={({ field }) => ( <Checkbox id="showLogoOnPrint" checked={field.value} onCheckedChange={field.onChange} /> )}/>
                    <Label htmlFor="showLogoOnPrint" className="text-sm font-medium">Hiển thị Logo trên phiếu in</Label>
                </div>

                 <div>
                    <Label htmlFor="backgroundImageUrlInput">URL Hình Nền (dán URL để lưu trữ)</Label>
                    <Input id="backgroundImageUrlInput" {...register("backgroundImageUrl")} placeholder="https://example.com/background.jpg" className="mt-1" onChange={(e) => { setValue('backgroundImageUrl', e.target.value); if(e.target.value) setPreviewBgImageUrl(e.target.value);}}/>
                    {errors.backgroundImageUrl && <p className="text-sm text-destructive mt-1">{errors.backgroundImageUrl.message}</p>}

                    <Label htmlFor="backgroundFile" className="text-xs text-muted-foreground mt-1 block">Hoặc chọn file để xem trước hình nền (chỉ xem trước, không lưu file nếu URL ở trên được điền):</Label>
                    <Input id="backgroundFile" type="file" accept="image/*" onChange={e => handleFileChange(e, 'background')} className="mt-1 text-sm"/>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-headline text-xl">Các Trường Dữ Liệu Trên Phiếu</CardTitle>
               <Select onValueChange={(value) => {
                 const selectedType = availableFieldTypes.find(ft => ft.defaultFieldName ? `${ft.value}-${ft.defaultFieldName}` === value : ft.value === value);
                 if (selectedType) addNewField(selectedType);
               }}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Thêm trường hệ thống hoặc tùy chỉnh" />
                </SelectTrigger>
                <SelectContent>
                  {availableFieldTypes.map(type => (
                    <SelectItem key={type.defaultFieldName ? `${type.value}-${type.defaultFieldName}` : type.value} value={type.defaultFieldName ? `${type.value}-${type.defaultFieldName}` : type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.fields?.message && <p className="text-sm text-destructive mt-2">{errors.fields.message}</p>}
            {errors.fields?.root?.message && <p className="text-sm text-destructive mt-2">{errors.fields.root.message}</p>}
             <p className="text-xs text-muted-foreground mt-2">Sử dụng X/Y để định vị chính xác.</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-3">
              {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Chưa có trường dữ liệu nào. Nhấn "Thêm Trường Mới".</p>}
              <Accordion type="multiple" className="w-full">
              {fields.map((fieldItem, index) => (
                <AccordionItem key={fieldItem.id} value={fieldItem.id || `field-${index}`} className="border-b border-border/60">
                  <AccordionTrigger className="hover:no-underline py-3 px-2 rounded-md hover:bg-muted/50 group">
                    <div className="flex items-center w-full">
                      <GripVertical className="h-5 w-5 text-muted-foreground mr-2 group-hover:text-foreground transition-colors" />
                      <span className="font-medium text-sm truncate flex-1 text-left">{watch(`fields.${index}.label`) || `Trường ${index + 1}`}</span>
                        <Button
                          asChild
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            remove(index); 
                          }}
                          aria-label="Xóa trường"
                        >
                          <span>
                           <Trash2 className="h-4 w-4" />
                          </span>
                        </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 bg-muted/30 rounded-b-md">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`fields[${index}].label`}>Nhãn Hiển Thị</Label>
                          {watch(`fields.${index}.fieldName`) === 'issuerSignatureBlock' ? (
                             <Textarea id={`fields[${index}].label`} {...register(`fields.${index}.label`)} placeholder="Người lập phiếu..." className="mt-1" rows={3}/>
                          ) : (
                            <Input id={`fields[${index}].label`} {...register(`fields.${index}.label`)} placeholder="VD: Họ Tên Thí Chủ" className="mt-1"/>
                          )}
                          {errors.fields?.[index]?.label && <p className="text-sm text-destructive mt-1">{errors.fields[index]?.label?.message}</p>}
                        </div>
                        <div>
                          <Label htmlFor={`fields[${index}].fieldName`}>Tên Trường (Mã)</Label>
                          <Input id={`fields[${index}].fieldName`} {...register(`fields.${index}.fieldName`)} placeholder="VD: donor_name (không dấu, không cách)" className="mt-1"/>
                          {errors.fields?.[index]?.fieldName && <p className="text-sm text-destructive mt-1">{errors.fields[index]?.fieldName?.message}</p>}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`fields[${index}].fieldType`}>Loại Trường</Label>
                        <Controller
                          name={`fields.${index}.fieldType`}
                          control={control}
                          render={({ field: controllerField }) => (
                            <Select 
                              onValueChange={controllerField.onChange} 
                              value={controllerField.value as TemplateField['fieldType']}
                              disabled={availableFieldTypes.find(ft => ft.defaultFieldName === watch(`fields.${index}.fieldName`))?.isSystemField}
                            >
                              <SelectTrigger id={`fields[${index}].fieldType`} className="mt-1">
                                <SelectValue placeholder="Chọn loại trường" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFieldTypes.filter(f=>!f.isSystemField && !f.defaultFieldName).map(type => ( 
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                         {errors.fields?.[index]?.fieldType && <p className="text-sm text-destructive mt-1">{errors.fields[index]?.fieldType?.message}</p>}
                      </div>
                      {watch(`fields.${index}.fieldType`) === 'dropdown' && (
                        <div>
                          <Label htmlFor={`fields[${index}].options`}>Các Lựa Chọn (cách nhau bởi dấu phẩy)</Label>
                          <Input id={`fields[${index}].options`} {...register(`fields.${index}.options`)} placeholder="Lựa chọn 1, Lựa chọn 2" className="mt-1"/>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Controller
                            name={`fields.${index}.required`}
                            control={control}
                            render={({ field: controllerField }) => (
                                <Checkbox id={`fields[${index}].required`} checked={controllerField.value} onCheckedChange={controllerField.onChange} />
                            )}
                        />
                        <Label htmlFor={`fields[${index}].required`} className="text-sm font-normal">Bắt buộc nhập</Label>
                      </div>
                      <Separator />
                      <Label className="text-sm font-medium">Định vị trường (px):</Label>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                            <Label htmlFor={`fields[${index}].positionX`} className="text-xs">Vị trí X</Label>
                            <Input id={`fields[${index}].positionX`} type="number" {...register(`fields.${index}.positionX`, { valueAsNumber: true })} className="mt-1 h-8"/>
                        </div>
                        <div>
                            <Label htmlFor={`fields[${index}].positionY`} className="text-xs">Vị trí Y</Label>
                            <Input id={`fields[${index}].positionY`} type="number" {...register(`fields.${index}.positionY`, { valueAsNumber: true })} className="mt-1 h-8"/>
                        </div>
                        <div className="col-span-2 flex items-center justify-start gap-1">
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateFieldPosition(index, 'Y', -5)}><ArrowUp className="h-4 w-4"/></Button>
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateFieldPosition(index, 'Y', 5)}><ArrowDown className="h-4 w-4"/></Button>
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateFieldPosition(index, 'X', -5)}><ArrowLeft className="h-4 w-4"/></Button>
                            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => updateFieldPosition(index, 'X', 5)}><ArrowRight className="h-4 w-4"/></Button>
                        </div>
                      </div>
                       {errors.fields?.[index]?.positionX && <p className="text-sm text-destructive mt-1">{errors.fields[index]?.positionX?.message}</p>}
                       {errors.fields?.[index]?.positionY && <p className="text-sm text-destructive mt-1">{errors.fields[index]?.positionY?.message}</p>}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
              </Accordion>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <ReceiptPreviewCanvas 
          fields={watchedFormValues.fields as TemplateField[]} 
          templateName={watchedFormValues.name} 
          backgroundImageUrl={previewBgImageUrl || watchedFormValues.backgroundImageUrl}
          logoUrl={previewLogoUrl || watchedFormValues.logoUrl}
          logoPositionX={watchedFormValues.logoPositionX}
          logoPositionY={watchedFormValues.logoPositionY}
          headerText={watchedFormValues.headerText}
          footerText={watchedFormValues.footerText}
          organizationName={watchedFormValues.organizationName}
          organizationAddress={watchedFormValues.organizationAddress}
          showLogoOnPrint={watchedFormValues.showLogoOnPrint}
        />
         <CardFooter className="mt-6 sticky bottom-0 bg-card py-4 border-t">
            <Button type="submit" className="w-full" disabled={isSubmittingForm}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmittingForm ? (initialData ? "Đang Cập Nhật..." : "Đang Lưu...") : (initialData ? "Cập Nhật Mẫu Phiếu" : "Lưu Mẫu Phiếu")}
            </Button>
          </CardFooter>
      </div>
    </form>
  );
}
    

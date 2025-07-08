
"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle, Save, Printer, Lightbulb, AlertCircle, ListChecks, RotateCcw } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { recordContribution, getSuggestedReceiptNumber, getUserContributionHistory, updatePrintStatus } from "@/actions/contributionActions";
import { useToast } from "@/hooks/use-toast";
import type { Template, Unit, WorkType, Contribution } from "@/types";
import type { ContributionFormData as ServerContributionFormData } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockInitialTemplates: Template[] = [ 
  { id: "template1", name: "Mẫu Phiếu Công Đức Chung", configJson: { fields: [
    { id: "f1", fieldName: "donorName", label: "Họ Tên Thí Chủ", fieldType: "text", required: true, positionX: 10, positionY: 10},
    { id: "f2", fieldName: "amount", label: "Số Tiền", fieldType: "number", required: true, positionX: 10, positionY: 20},
    { id: "f3", fieldName: "notes", label: "Ghi Chú", fieldType: "text", required: false, positionX: 10, positionY: 30},
  ], organizationName:"Chùa Từ Tâm Hạnh", organizationAddress: "123 Đường An Bình, Phường An Lạc, Quận Bình Tân, TP.HCM", showLogoOnPrint: true, headerText: "PHIẾU CÔNG ĐỨC", footerText:"Xin chân thành cảm ơn!"}, isActive: true, createdAt: new Date().toISOString() },
  { id: "template2", name: "Mẫu Xây Dựng Chùa", configJson: { fields: [] }, isActive: true, createdAt: new Date().toISOString() },
];
const mockUnits: Unit[] = [
  { id: "unit1", name: "Ban Trị Sự", priority: 1, isActive: true },
  { id: "unit2", name: "Ban Nghi Lễ", priority: 2, isActive: true },
];
const mockWorkTypes: WorkType[] = [
  { id: "work1", name: "Cúng Dường Xây Chùa", priority: 1, isActive: true },
  { id: "work2", name: "Phóng Sanh", priority: 2, isActive: true },
];

const TEMPLATES_STORAGE_KEY = 'templates';


const contributionFormClientSchema = z.object({
  donorName: z.string().min(2, "Họ tên người đóng góp phải có ít nhất 2 ký tự."),
  amount: z.string()
    .min(1, "Số tiền không được để trống.") 
    .refine(value => {
      const num = parseFloat(String(value).replace(/,/g, '')); 
      return !isNaN(num) && num > 0;
    }, "Số tiền phải là số dương."),
  templateId: z.string().min(1, "Vui lòng chọn mẫu phiếu."),
  unitId: z.string().optional(),
  workTypeId: z.string().optional(),
  contributionDate: z.date({ required_error: "Ngày đóng góp không được để trống." }),
  receiptNumber: z.string().min(1, "Số biên nhận không được để trống."),
  notes: z.string().optional(),
});

type ClientContributionFormData = z.infer<typeof contributionFormClientSchema>;


export function ContributionForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrintButton, setShowPrintButton] = useState(false);
  const [currentContributionForPrint, setCurrentContributionForPrint] = useState<Contribution | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [userHistory, setUserHistory] = useState<Contribution[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [templates, setTemplates] = useState<Template[]>(mockInitialTemplates);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ClientContributionFormData>({
    resolver: zodResolver(contributionFormClientSchema),
    defaultValues: {
      contributionDate: new Date(),
      amount: "", 
      notes: "",
    },
  });

  const watchedFormValues = watch();
  
  useEffect(() => {
    try {
        const storedTemplatesRaw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
        if (storedTemplatesRaw) {
            const parsedTemplates = JSON.parse(storedTemplatesRaw);
            if (Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
                 setTemplates(parsedTemplates.filter(t => t.isActive)); 
            } else {
                 setTemplates(mockInitialTemplates.filter(t => t.isActive));
                 localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(mockInitialTemplates));
            }
        } else {
             setTemplates(mockInitialTemplates.filter(t => t.isActive));
             localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(mockInitialTemplates));
        }
    } catch(e) {
        console.error("Failed to load templates from localStorage for form", e);
        setTemplates(mockInitialTemplates.filter(t => t.isActive));
    }
  }, []);

  const selectedTemplate = templates.find(t => t.id === watchedFormValues.templateId);


  const fetchSuggestedReceiptNumber = useCallback(async () => {
    setIsSuggesting(true);
    try {
      const suggested = await getSuggestedReceiptNumber();
      setValue("receiptNumber", suggested);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể gợi ý số biên nhận.",
      });
    } finally {
      setIsSuggesting(false);
    }
  }, [setValue, toast]);

  const fetchUserHistory = useCallback(async () => {
    if (user?.id) {
      setIsLoadingHistory(true);
      try {
        const history = await getUserContributionHistory(user.id);
        setUserHistory(history);
      } catch (error) {
        toast({ variant: "destructive", title: "Lỗi tải lịch sử" });
      } finally {
        setIsLoadingHistory(false);
      }
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchSuggestedReceiptNumber();
    fetchUserHistory();
  }, [fetchSuggestedReceiptNumber, fetchUserHistory]);
  
  const onSubmit: SubmitHandler<ClientContributionFormData> = async (data) => {
    if (!user) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng đăng nhập lại." });
      return;
    }
    setIsSubmitting(true);
    setShowPrintButton(false);
    setCurrentContributionForPrint(null);

    const dataForServer: ServerContributionFormData = {
      ...data,
      amount: parseFloat(String(data.amount).replace(/,/g, '')), 
    };

    try {
      const result = await recordContribution(dataForServer, user.id);
      if (result.success && result.data) {
        toast({
          title: "Thành Công",
          description: "Đã ghi nhận công quả thành công.",
          action: <CheckCircle className="text-green-500" />,
        });
        setCurrentContributionForPrint(result.data);
        setShowPrintButton(true);
        setUserHistory(prev => [result.data!, ...prev].sort((a,b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()));
        await fetchSuggestedReceiptNumber(); 
      } else {
        const errorMessages = Object.values(result.errors || {}).flat().join(", ") || "Có lỗi xảy ra.";
        toast({
          variant: "destructive",
          title: "Thất Bại",
          description: `Không thể ghi nhận công quả: ${errorMessages}`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi Hệ Thống",
        description: "Không thể kết nối tới máy chủ.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const prepareForPrint = (contributionData: Contribution) => {
    setValue("donorName", contributionData.donorName);
    setValue("amount", formatCurrency(contributionData.amount));
    setValue("templateId", contributionData.templateId);
    setValue("unitId", contributionData.unitId || "");
    setValue("workTypeId", contributionData.workTypeId || "");
    setValue("contributionDate", parseISO(contributionData.datetime));
    setValue("receiptNumber", contributionData.receiptNumber);
    setValue("notes", contributionData.notes || "");
    
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrint = async (contributionToPrintArg?: Contribution) => {
    const targetContribution = contributionToPrintArg || currentContributionForPrint;
    if (targetContribution) {
      const result = await updatePrintStatus(targetContribution.id, true);
      if (result.success) {
        if (contributionToPrintArg) { 
          setUserHistory(prev => prev.map(c => c.id === targetContribution.id ? {...c, isPrinted: true} : c));
        } else if (currentContributionForPrint && currentContributionForPrint.id === targetContribution.id) {
           setCurrentContributionForPrint(prev => prev ? {...prev, isPrinted: true} : null);
        }
         toast({title: "Đã In", description: `Phiếu ${targetContribution.receiptNumber} được đánh dấu đã in.`});
      }
      prepareForPrint(targetContribution);
    }
  };

  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null || String(value).trim() === "") return "";
    const numValue = String(value).replace(/[^0-9]/g, ''); 
    const num = Number(numValue);
    if (isNaN(num)) return String(value).replace(/,/g,''); 
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericString = rawValue.replace(/[^0-9]/g, ''); 

    if (numericString === "") {
        setValue('amount', "", { shouldValidate: true });
    } else {
        const formatted = formatCurrency(numericString);
        setValue('amount', formatted, { shouldValidate: true });
    }
  };

  const handleResetForm = () => {
    reset({
        donorName: "",
        amount: "",
        templateId: "",
        unitId: "",
        workTypeId: "",
        contributionDate: new Date(),
        notes: "",
    });
    setShowPrintButton(false);
    setCurrentContributionForPrint(null);
    fetchSuggestedReceiptNumber();
  }


  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Ghi Nhận Công Quả Mới</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormFieldItem error={errors.templateId?.message}>
                  <Label htmlFor="templateId">Chọn Mẫu Phiếu</Label>
                  <Controller
                    name="templateId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""} >
                        <SelectTrigger id="templateId">
                          <SelectValue placeholder="Chọn mẫu phiếu công quả" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormFieldItem>

                <FormFieldItem error={errors.receiptNumber?.message}>
                  <Label htmlFor="receiptNumber">Số Biên Nhận</Label>
                  <div className="flex items-center gap-2">
                    <Input id="receiptNumber" {...register("receiptNumber")} placeholder="Ví dụ: 20240728_001" />
                    <Button type="button" variant="outline" size="icon" onClick={fetchSuggestedReceiptNumber} disabled={isSuggesting} aria-label="Gợi ý số biên nhận">
                      {isSuggesting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <Lightbulb className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormFieldItem>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormFieldItem error={errors.donorName?.message}>
                  <Label htmlFor="donorName">Họ Tên Người Đóng Góp</Label>
                  <Input id="donorName" {...register("donorName")} placeholder="Nguyễn Văn A" />
                </FormFieldItem>
                <FormFieldItem error={errors.amount?.message}>
                  <Label htmlFor="amount">Số Tiền (VNĐ)</Label>
                  <Input 
                    id="amount" 
                    value={watchedFormValues.amount} 
                    onChange={handleAmountChange} 
                    placeholder="1,000,000"
                  />
                </FormFieldItem>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormFieldItem error={errors.unitId?.message}>
                      <Label htmlFor="unitId">Đơn Vị/Ban</Label>
                      <Controller
                      name="unitId"
                      control={control}
                      render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger id="unitId">
                              <SelectValue placeholder="Chọn đơn vị/ban (nếu có)" />
                          </SelectTrigger>
                          <SelectContent>
                              {mockUnits.filter(u => u.isActive).map((unit) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                  {unit.name}
                              </SelectItem>
                              ))}
                          </SelectContent>
                          </Select>
                      )}
                      />
                  </FormFieldItem>
                  <FormFieldItem error={errors.workTypeId?.message}>
                      <Label htmlFor="workTypeId">Về Việc</Label>
                      <Controller
                      name="workTypeId"
                      control={control}
                      render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                          <SelectTrigger id="workTypeId">
                              <SelectValue placeholder="Chọn loại việc (nếu có)" />
                          </SelectTrigger>
                          <SelectContent>
                              {mockWorkTypes.filter(wt => wt.isActive).map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                              </SelectItem>
                              ))}
                          </SelectContent>
                          </Select>
                      )}
                      />
                  </FormFieldItem>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormFieldItem error={errors.contributionDate?.message}>
                  <Label htmlFor="contributionDate">Ngày Đóng Góp</Label>
                  <Controller
                    name="contributionDate"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP", { locale: vi }) : <span>Chọn ngày</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => field.onChange(date || new Date())}
                            initialFocus
                            locale={vi}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </FormFieldItem>
                <FormFieldItem error={errors.notes?.message} className="sm:col-span-2">
                  <Label htmlFor="notes">Ghi Chú Thêm</Label>
                  <Textarea id="notes" {...register("notes")} placeholder="Thông tin thêm về khoản đóng góp..." />
                </FormFieldItem>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleResetForm} disabled={isSubmitting}>
                  Làm Mới Form
                </Button>
                <Button type="submit" disabled={isSubmitting || showPrintButton}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Đang Lưu..." : "Lưu Phiếu"}
                </Button>
              </div>
            </form>
          </CardContent>
          {showPrintButton && currentContributionForPrint && (
            <CardFooter className="border-t pt-6">
              <Alert variant="default" className="border-primary">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-headline">Đã Lưu Thành Công!</AlertTitle>
                <AlertDescription>
                  Bạn có thể in phiếu công quả cho {currentContributionForPrint.donorName} (Số phiếu: {currentContributionForPrint.receiptNumber}).
                  <Button onClick={() => handlePrint()} className="ml-4 mt-2 sm:mt-0">
                      <Printer className="mr-2 h-4 w-4" />
                      In Phiếu
                  </Button>
                </AlertDescription>
              </Alert>
            </CardFooter>
          )}
        </Card>

        <div className="md:col-span-1 sticky top-24">
          <Card className="shadow-lg printable-receipt-container">
            <CardHeader>
              <CardTitle className="font-headline text-xl no-print-in-preview">Xem Trước Phiếu Công Quả</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-md p-4 space-y-3 border-dashed border-2 border-muted-foreground/50 no-print-in-preview">
              <div className="printable-receipt-area aspect-[210/148] w-full bg-white dark:bg-neutral-100 shadow-md p-6 relative overflow-hidden text-black">
                {selectedTemplate?.configJson.showLogoOnPrint && selectedTemplate?.configJson.logoUrl && (
                   <div className="absolute top-4 left-4">
                      <img src={selectedTemplate.configJson.logoUrl} alt="Logo Chùa" className="h-10 opacity-70" data-ai-hint="logo temple minimal"/>
                    </div>
                )}
                 <div className="text-center mb-1">
                    {selectedTemplate?.configJson.organizationName && <p className="font-semibold text-sm">{selectedTemplate.configJson.organizationName.toUpperCase()}</p>}
                    {selectedTemplate?.configJson.organizationAddress && <p className="text-xs">{selectedTemplate.configJson.organizationAddress}</p>}
                  </div>
                <h2 className="text-center text-lg font-headline font-bold text-primary-900 mt-2 mb-4">
                  {selectedTemplate?.configJson.headerText || "PHIẾU CÔNG ĐỨC"}
                </h2>
                
                <div className="text-sm space-y-1.5 text-gray-800">
                  {(selectedTemplate?.configJson.fields || []).map(field => {
                    let displayValue: ReactNode = "";
                    if (field.fieldName === "donorName") displayValue = watchedFormValues.donorName || "[ Thí chủ ]";
                    else if (field.fieldName === "amount") displayValue = `${formatCurrency(watchedFormValues.amount) || "0"} VNĐ`;
                    else if (field.fieldName === "notes") displayValue = watchedFormValues.notes || "";
                    else if (field.fieldName === "contributionDate" && watchedFormValues.contributionDate) displayValue = format(watchedFormValues.contributionDate, "dd/MM/yyyy", { locale: vi });
                    else if (field.fieldName === "receiptNumber") displayValue = watchedFormValues.receiptNumber || "[ Số phiếu ]";
                    else if (field.fieldName === "unitId" && watchedFormValues.unitId) {
                        displayValue = mockUnits.find(u => u.id === watchedFormValues.unitId)?.name || watchedFormValues.unitId;
                    } else if (field.fieldName === "workTypeId" && watchedFormValues.workTypeId) {
                        displayValue = mockWorkTypes.find(wt => wt.id === watchedFormValues.workTypeId)?.name || watchedFormValues.workTypeId;
                    } else if (field.fieldName === "issuerSignatureBlock") {
                       // This specific field's label IS the value (multi-line)
                       return <div key={field.id} className="whitespace-pre-line" style={{position: 'absolute', top: `${field.positionY}px`, left: `${field.positionX}px`}}>{field.label}</div>;
                    }
                    else {
                        const formValue = watchedFormValues[field.fieldName as keyof ClientContributionFormData] as string | undefined;
                        displayValue = formValue || (field.required ? "[...]" : "");
                    }

                    return (
                      <div key={field.id} style={{position: 'absolute', top: `${field.positionY}px`, left: `${field.positionX}px`}}>
                        <strong className="font-bold">{field.label}:</strong> 
                        {' '}{displayValue}
                      </div>
                    );
                  })}
                   {!selectedTemplate && ( 
                    <>
                      <p><strong className="font-bold w-28 inline-block">Thí chủ:</strong> {watchedFormValues.donorName || "[ Thí chủ ]"}</p>
                      <p><strong className="font-bold w-28 inline-block">Số tiền:</strong> {formatCurrency(watchedFormValues.amount) || "0"} VNĐ</p>
                      <p><strong className="font-bold w-28 inline-block">Về việc:</strong> {mockWorkTypes.find(wt => wt.id === watchedFormValues.workTypeId)?.name || "[ Việc ]"}</p>
                      <p><strong className="font-bold w-28 inline-block">Ngày ghi nhận:</strong> {watchedFormValues.contributionDate ? format(watchedFormValues.contributionDate, "dd/MM/yyyy", { locale: vi }) : "[ Ngày ]"}</p>
                      <p><strong className="font-bold w-28 inline-block">Số phiếu:</strong> {watchedFormValues.receiptNumber || "[ Số phiếu ]"}</p>
                      {watchedFormValues.notes && <p className="pt-1"><strong className="font-bold w-28 inline-block">Ghi chú:</strong> <span className="italic">{watchedFormValues.notes}</span></p>}
                    </>
                   )}
                </div>

                <div className="absolute bottom-6 right-6 text-xs text-gray-600 text-center no-print-in-preview">
                  <p>Người lập phiếu</p>
                  <p className="mt-3">(Ký, họ tên)</p>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-gray-400">
                  {selectedTemplate?.configJson.footerText || `Mẫu: ${selectedTemplate?.name || "Chung"}`}
                </div>
                <div 
                    className="absolute inset-0 border border-gray-300 pointer-events-none"
                    aria-hidden="true"
                ></div>
                <div 
                    className="absolute inset-0 border-2 border-amber-600/50 pointer-events-none rounded" 
                    style={{ 
                        borderStyle: 'double', 
                        borderWidth: '6px',
                        borderColor: 'hsl(var(--primary)/0.6)',
                        margin: '8px'
                    }}
                    aria-hidden="true"
                ></div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2 no-print-in-preview">Đây là bản xem trước. Giao diện in thực tế có thể khác.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="font-headline text-xl flex items-center">
            <ListChecks className="mr-2 h-5 w-5"/>
            Lịch Sử Ghi Nhận Cá Nhân
          </CardTitle>
          <Button onClick={fetchUserHistory} variant="outline" size="sm" disabled={isLoadingHistory}>
            <RotateCcw className={`mr-2 h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`}/> Làm mới
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingHistory && <p>Đang tải lịch sử...</p>}
          {!isLoadingHistory && userHistory.length === 0 && <p className="text-muted-foreground">Chưa có ghi nhận nào.</p>}
          {!isLoadingHistory && userHistory.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Số Phiếu</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Người Đóng Góp</TableHead>
                    <TableHead className="text-right">Số Tiền</TableHead>
                    <TableHead className="text-center">Đã In</TableHead>
                    <TableHead className="text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userHistory.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.receiptNumber}</TableCell>
                      <TableCell>{format(parseISO(item.datetime), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>{item.donorName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)} VNĐ</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.isPrinted ? "default" : "outline"} className={item.isPrinted ? "bg-green-500 text-white" : ""}>
                          {item.isPrinted ? "Đã In" : "Chưa In"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handlePrint(item)}>
                          <Printer className="mr-1 h-4 w-4"/> In Lại
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

interface FormFieldItemProps {
  children: ReactNode;
  error?: string;
  className?: string;
}
const FormFieldItem: React.FC<FormFieldItemProps> = ({ children, error, className }) => (
  <div className={`space-y-2 ${className || ''}`}>
    {children}
    {error && <p className="text-sm text-destructive flex items-center"><AlertCircle className="w-4 h-4 mr-1"/> {error}</p>}
  </div>
);


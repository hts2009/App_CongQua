
"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label }
 from "@/components/ui/label";
import { CategoryList } from "@/components/categories/category-list";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import type { Unit, WorkType } from "@/types";
import { PlusCircle, ListPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Mock data
const initialMockUnits: Unit[] = [
  { id: "unit1", name: "Ban Trị Sự", priority: 1, isActive: true },
  { id: "unit2", name: "Ban Nghi Lễ", priority: 2, isActive: true },
  { id: "unit3", name: "Ban Từ Thiện", priority: 3, isActive: false },
];

const initialMockWorkTypes: WorkType[] = [
  { id: "work1", name: "Cúng Dường Xây Chùa", priority: 1, isActive: true },
  { id: "work2", name: "Phóng Sanh", priority: 2, isActive: true },
  { id: "work3", name: "Ấn Tống Kinh Sách", priority: 3, isActive: true },
  { id: "work4", name: "Cúng Dường Trai Tăng", priority: 4, isActive: false },
];

type CategoryFormData = Omit<Unit, 'id'> | Omit<WorkType, 'id'>;

export default function CategoriesPage() {
  const [units, setUnits] = useState<Unit[]>(initialMockUnits);
  const [workTypes, setWorkTypes] = useState<WorkType[]>(initialMockWorkTypes);
  const { toast } = useToast();

  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<Unit | null>(null);
  const [batchUnitsText, setBatchUnitsText] = useState("");

  const [isWorkTypeDialogOpen, setIsWorkTypeDialogOpen] = useState(false);
  const [workTypeToEdit, setWorkTypeToEdit] = useState<WorkType | null>(null);
  const [batchWorkTypesText, setBatchWorkTypesText] = useState("");


  const handleOpenUnitDialog = (unit?: Unit) => {
    setUnitToEdit(unit || null);
    setIsUnitDialogOpen(true);
  };

  const handleOpenWorkTypeDialog = (workType?: WorkType) => {
    setWorkTypeToEdit(workType || null);
    setIsWorkTypeDialogOpen(true);
  };
  
  const handleUnitSubmit = async (data: CategoryFormData, id?: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (id) {
      setUnits(units.map(u => u.id === id ? { ...u, ...data, id } : u));
      toast({ title: "Đã cập nhật", description: `Đơn vị "${data.name}" đã được cập nhật.` });
    } else {
      const newUnit = { id: `unit-${Date.now()}`, ...data } as Unit;
      setUnits(prev => [newUnit, ...prev].sort((a,b) => a.priority - b.priority || a.name.localeCompare(b.name)));
      toast({ title: "Đã thêm mới", description: `Đơn vị "${data.name}" đã được thêm.` });
    }
    setIsUnitDialogOpen(false);
  };

  const handleWorkTypeSubmit = async (data: CategoryFormData, id?: string) => {
     await new Promise(resolve => setTimeout(resolve, 300));
    if (id) {
      setWorkTypes(workTypes.map(wt => wt.id === id ? { ...wt, ...data, id } : wt));
      toast({ title: "Đã cập nhật", description: `Loại việc "${data.name}" đã được cập nhật.` });
    } else {
      const newWorkType = { id: `worktype-${Date.now()}`, ...data } as WorkType;
      setWorkTypes(prev => [newWorkType, ...prev].sort((a,b) => a.priority - b.priority || a.name.localeCompare(b.name)));
      toast({ title: "Đã thêm mới", description: `Loại việc "${data.name}" đã được thêm.` });
    }
    setIsWorkTypeDialogOpen(false);
  };
  
  const handleDeleteUnit = (unitId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đơn vị này?")) {
      setUnits(units.filter(u => u.id !== unitId));
      toast({ title: "Đã xóa", description: "Đơn vị đã được xóa." });
    }
  };

  const handleDeleteWorkType = (workTypeId: string) => {
     if (window.confirm("Bạn có chắc chắn muốn xóa loại việc này?")) {
      setWorkTypes(workTypes.filter(wt => wt.id !== workTypeId));
      toast({ title: "Đã xóa", description: "Loại việc đã được xóa." });
    }
  };

  const handleBatchAdd = (type: 'units' | 'workTypes') => {
    const text = type === 'units' ? batchUnitsText : batchWorkTypesText;
    const names = text.split(',').map(name => name.trim()).filter(name => name.length > 0);
    if (names.length === 0) {
      toast({variant: 'destructive', title: "Không có tên hợp lệ", description: "Vui lòng nhập tên, cách nhau bởi dấu phẩy."});
      return;
    }

    if (type === 'units') {
      const newUnits: Unit[] = names.map(name => ({
        id: `unit-batch-${Date.now()}-${Math.random()}`,
        name,
        priority: 0, // Default priority
        isActive: true,
      }));
      setUnits(prev => [...prev, ...newUnits].sort((a,b) => a.priority - b.priority || a.name.localeCompare(b.name)));
      setBatchUnitsText("");
    } else {
      const newWorkTypes: WorkType[] = names.map(name => ({
        id: `worktype-batch-${Date.now()}-${Math.random()}`,
        name,
        priority: 0, // Default priority
        isActive: true,
      }));
      setWorkTypes(prev => [...prev, ...newWorkTypes].sort((a,b) => a.priority - b.priority || a.name.localeCompare(b.name)));
      setBatchWorkTypesText("");
    }
    toast({title: "Đã thêm hàng loạt", description: `${names.length} mục đã được thêm.`});
  };


  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-headline font-bold">Quản Lý Danh Mục</h1>
      </div>

      <Tabs defaultValue="units" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex mb-6">
          <TabsTrigger value="units" className="font-headline">Đơn Vị/Ban</TabsTrigger>
          <TabsTrigger value="workTypes" className="font-headline">Loại Việc</TabsTrigger>
        </TabsList>
        
        <TabsContent value="units">
          <PageSection title="Danh Sách Đơn Vị/Ban" actionButton={
            <Button onClick={() => handleOpenUnitDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm Đơn Vị Mới
            </Button>
          }>
            <CategoryList items={units} onEdit={handleOpenUnitDialog} onDelete={handleDeleteUnit} itemTypeLabel="Đơn Vị" />
            <BatchAddSection
              title="Thêm Nhanh Nhiều Đơn Vị"
              value={batchUnitsText}
              onChange={setBatchUnitsText}
              onBatchAdd={() => handleBatchAdd('units')}
              placeholder="Nhập tên các đơn vị, cách nhau bởi dấu phẩy..."
              itemTypeLabel="Đơn vị"
            />
          </PageSection>
        </TabsContent>
        
        <TabsContent value="workTypes">
           <PageSection title="Danh Sách Loại Việc" actionButton={
             <Button onClick={() => handleOpenWorkTypeDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Thêm Loại Việc Mới
             </Button>
           }>
            <CategoryList items={workTypes} onEdit={handleOpenWorkTypeDialog} onDelete={handleDeleteWorkType} itemTypeLabel="Loại Việc" />
            <BatchAddSection
              title="Thêm Nhanh Nhiều Loại Việc"
              value={batchWorkTypesText}
              onChange={setBatchWorkTypesText}
              onBatchAdd={() => handleBatchAdd('workTypes')}
              placeholder="Nhập tên các loại việc, cách nhau bởi dấu phẩy..."
              itemTypeLabel="Loại việc"
            />
          </PageSection>
        </TabsContent>
      </Tabs>

      <CategoryFormDialog<Unit>
        isOpen={isUnitDialogOpen}
        setIsOpen={setIsUnitDialogOpen}
        itemToEdit={unitToEdit}
        onSubmit={handleUnitSubmit}
        itemTypeLabel="Đơn Vị"
      />
      <CategoryFormDialog<WorkType>
        isOpen={isWorkTypeDialogOpen}
        setIsOpen={setIsWorkTypeDialogOpen}
        itemToEdit={workTypeToEdit}
        onSubmit={handleWorkTypeSubmit}
        itemTypeLabel="Loại Việc"
      />
    </div>
  );
}

function PageSection({ title, actionButton, children }: { title: string, actionButton?: ReactNode, children: ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b">
        <CardTitle className="text-xl font-semibold mb-2 sm:mb-0">{title}</CardTitle>
        {actionButton}
      </CardHeader>
      <CardContent className="p-0 sm:p-6 space-y-6">
        {children}
      </CardContent>
    </Card>
  )
}

function BatchAddSection({ title, value, onChange, onBatchAdd, placeholder, itemTypeLabel }: {
  title: string;
  value: string;
  onChange: (value: string) => void;
  onBatchAdd: () => void;
  placeholder: string;
  itemTypeLabel: string;
}) {
  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <Label htmlFor={`batch-${itemTypeLabel}`} className="sr-only">Danh sách {itemTypeLabel}</Label>
      <Textarea
        id={`batch-${itemTypeLabel}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mb-2"
      />
      <Button onClick={onBatchAdd} size="sm">
        <ListPlus className="mr-2 h-4 w-4" /> Thêm Hàng Loạt
      </Button>
    </div>
  );
}

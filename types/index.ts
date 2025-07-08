
import type { ComponentType } from 'react';

export enum UserRole {
  Admin = "admin",
  Receptionist = "receptionist",
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface TemplateField {
  id: string;
  fieldName: string;
  label: string;
  fieldType: "text" | "number" | "dropdown" | "date" | "phone" | "image";
  required: boolean;
  positionX: number; 
  positionY: number; 
  options?: string[]; // For dropdown
}

export interface TemplateConfig {
  fields: TemplateField[];
  headerText?: string;
  footerText?: string;
  organizationName?: string;
  organizationAddress?: string;
  showLogoOnPrint?: boolean;
  backgroundImageUrl?: string; 
  logoUrl?: string; 
  logoPositionX?: number;
  logoPositionY?: number;
}

export interface Template {
  id: string;
  name: string;
  configJson: TemplateConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string; // Added for consistency
}

export interface Unit {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
}

export interface WorkType {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
}

export interface Contribution {
  id: string;
  templateId: string;
  userId: string; 
  donorName: string;
  unitId?: string;
  workTypeId?: string;
  amount: number;
  datetime: string; 
  receiptNumber: string;
  customFieldsData?: Record<string, any>; 
  isPrinted?: boolean; 
  notes?: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
  role?: UserRole[]; 
  subNav?: NavItem[];
}

export interface ContributionFormData {
  donorName: string;
  amount: number; // Store as number
  templateId: string;
  unitId?: string;
  workTypeId?: string;
  contributionDate: Date;
  receiptNumber: string;
  notes?: string;
}

export interface ReportDataItem extends Contribution {
  receptionist?: string; 
  type?: string; 
}

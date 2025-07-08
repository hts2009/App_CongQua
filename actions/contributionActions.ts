
"use server";

import type { Contribution, ContributionFormData } from "@/types";
import { z } from "zod";
import { format } from "date-fns";
import { 
  dbRecordContribution, 
  dbUpdatePrintStatus, 
  dbGetUserContributionHistory, 
  dbGetAllContributionsForReport,
  dbGetContributionsForReceiptNumberGeneration
} from "@/services/sqliteService"; // Assuming this service exists and is configured

// Determine data source mode (conceptual - actual mechanism might vary, e.g., env var)
// For this example, we'll default to mock data unless an env var is set.
const USE_SQLITE = process.env.DATA_SOURCE_MODE === 'sqlite';
console.log(`Contribution actions using ${USE_SQLITE ? 'SQLite' : 'Mock Data'}`);


// Mock database or service for storing contributions
let mockContributions: Contribution[] = [
  { id: "c1", templateId: "template1", userId: "receptionist-user-id", donorName: "Phan Thị B", amount: 1500000, datetime: new Date(2024, 6, 15, 10, 30, 0).toISOString(), receiptNumber: "20240715_001", isPrinted: true, notes: "Ghi chú mẫu", workTypeId: "work1", unitId: "unit1" },
  { id: "c2", templateId: "template1", userId: "receptionist-user-id", donorName: "Trần Văn C", amount: 500000, datetime: new Date(2024, 6, 16, 14, 0, 0).toISOString(), receiptNumber: "20240716_001", isPrinted: false, notes: "Ủng hộ xây chùa", workTypeId: "work1" },
  { id: "c3", templateId: "template2", userId: "admin-user-id", donorName: "Nguyễn Thị An", amount: 2000000, datetime: new Date(2024, 6, 16, 9, 15, 0).toISOString(), receiptNumber: "20240716_002", isPrinted: true, notes: "Cúng dường trai tăng", workTypeId: "work2" },
  { id: "c4", templateId: "template1", userId: "receptionist-user-id", donorName: "Lê Văn Đức", amount: 100000, datetime: new Date(2024, 7, 20, 11,0,0).toISOString(), receiptNumber: "20240820_001", isPrinted: false, notes: "Công đức thường kỳ" },
  { id: "c5", templateId: "template1", userId: "receptionist-user-id", donorName: "Nguyễn Văn Test", amount: 250000, datetime: new Date().toISOString(), receiptNumber: format(new Date(), "yyyyMMdd") + "_001", isPrinted: false, notes: "Ghi nhận hôm nay" },
];


async function generateReceiptNumber(): Promise<string> {
  const today = new Date();
  const prefix = format(today, "yyyyMMdd");
  
  let contributionsForToday: { receiptNumber: string }[];
  if (USE_SQLITE) {
    contributionsForToday = await dbGetContributionsForReceiptNumberGeneration(prefix);
  } else {
    contributionsForToday = mockContributions.filter(c => c.receiptNumber.startsWith(prefix));
  }
  
  let nextSuffix = 1;
  if (contributionsForToday.length > 0) {
    const maxSuffix = contributionsForToday.reduce((max, c) => {
      const parts = c.receiptNumber.split('_');
      if (parts.length > 1) {
        const suffix = parseInt(parts[1], 10);
        return !isNaN(suffix) && suffix > max ? suffix : max;
      }
      return max;
    }, 0);
    nextSuffix = maxSuffix + 1;
  }
  return `${prefix}_${String(nextSuffix).padStart(3, '0')}`;
}

export const getSuggestedReceiptNumber = async (): Promise<string> => {
  return generateReceiptNumber();
};

const contributionServerSchema = z.object({
  donorName: z.string().min(2, "Họ tên người đóng góp phải có ít nhất 2 ký tự."),
  amount: z.number().positive("Số tiền phải là số dương."),
  templateId: z.string().min(1, "Vui lòng chọn mẫu phiếu."),
  unitId: z.string().optional(),
  workTypeId: z.string().optional(),
  // receiptNumber: z.string().min(1, "Số biên nhận không được để trống."), // Will be auto-generated
  contributionDate: z.date(),
  notes: z.string().optional(),
});

// Remove receiptNumber from schema as it will be auto-generated
type ContributionServerInputData = Omit<z.infer<typeof contributionServerSchema>, 'receiptNumber'>;


export async function recordContribution(data: ContributionFormData, userId: string) {
  const parsedAmount = typeof data.amount === 'string' 
    ? parseFloat(data.amount.replace(/,/g, '')) 
    : data.amount;

  // Use Omit to exclude receiptNumber for validation as it's auto-generated
  const validationResult = contributionServerSchema.safeParse({
    ...data,
    amount: parsedAmount,
    // receiptNumber: data.receiptNumber, // No longer pass receiptNumber for validation
  });

  if (!validationResult.success) {
    return { success: false, errors: validationResult.error.flatten().fieldErrors };
  }
  
  const validatedData = validationResult.data;
  const newId = String(Date.now());
  const receiptNumber = await generateReceiptNumber();

  const newContribution: Contribution = {
    id: newId, 
    userId: userId, 
    datetime: validatedData.contributionDate.toISOString(),
    donorName: validatedData.donorName,
    amount: validatedData.amount,
    templateId: validatedData.templateId,
    unitId: validatedData.unitId,
    workTypeId: validatedData.workTypeId,
    receiptNumber: receiptNumber, 
    notes: validatedData.notes,
    isPrinted: false, 
  };
  
  try {
    if (USE_SQLITE) {
      await dbRecordContribution(validatedData, userId, newId, receiptNumber);
    } else {
      mockContributions.unshift(newContribution); 
    }
    console.log("New contribution recorded:", newContribution);
    return { success: true, data: newContribution };
  } catch (error) {
    console.error("Error recording contribution:", error);
    return { success: false, errors: { form: ["Không thể lưu trữ dữ liệu."] } };
  }
}

export async function updatePrintStatus(contributionId: string, isPrinted: boolean): Promise<{success: boolean}> {
  try {
    if (USE_SQLITE) {
      await dbUpdatePrintStatus(contributionId, isPrinted);
    } else {
      const contributionIndex = mockContributions.findIndex(c => c.id === contributionId);
      if (contributionIndex !== -1) {
        mockContributions[contributionIndex] = { ...mockContributions[contributionIndex], isPrinted };
      } else {
        return { success: false }; // Not found in mock
      }
    }
    console.log(`Print status for ${contributionId} updated to ${isPrinted}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating print status:", error);
    return { success: false };
  }
}

export async function getUserContributionHistory(userId: string): Promise<Contribution[]> {
  try {
    if (USE_SQLITE) {
      return await dbGetUserContributionHistory(userId);
    } else {
      return mockContributions.filter(c => c.userId === userId).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    }
  } catch (error) {
    console.error("Error fetching user contribution history:", error);
    return [];
  }
}

export async function getAllContributionsForReport(): Promise<Contribution[]> {
  try {
    if (USE_SQLITE) {
      return await dbGetAllContributionsForReport();
    } else {
      return [...mockContributions].sort((a,b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
    }
  } catch (error) {
    console.error("Error fetching all contributions for report:", error);
    return [];
  }
}

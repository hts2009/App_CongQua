
"use client";

import type { TemplateField } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

interface ReceiptPreviewCanvasProps {
  fields: TemplateField[];
  templateName?: string;
  backgroundImageUrl?: string; 
  logoUrl?: string; 
  logoPositionX?: number;
  logoPositionY?: number;
  headerText?: string;
  footerText?: string;
  organizationName?: string;
  organizationAddress?: string;
  showLogoOnPrint?: boolean;
}

const A5_WIDTH_PX = 794; // Approx 210mm @ 96 DPI
const A5_HEIGHT_PX = 560; // Approx 148mm @ 96 DPI
const PREVIEW_SCALE = 0.65; // Scale down for display in UI (Increased from 0.5)

export function ReceiptPreviewCanvas({ 
  fields, 
  templateName = "Mẫu Phiếu Mặc Định", 
  backgroundImageUrl, 
  logoUrl,
  logoPositionX = 10,
  logoPositionY = 10,
  headerText,
  footerText,
  organizationName,
  organizationAddress,
  showLogoOnPrint = true,
}: ReceiptPreviewCanvasProps) {
  
  const renderField = (field: TemplateField) => {
    let placeholder: string | JSX.Element = "";
    switch (field.fieldType) {
      case "text": placeholder = field.label.includes("\\n") ? field.label.split("\\n").map((line, i) => <span key={i}>{line}<br/></span>) : field.label; break;
      case "number": placeholder = "123,456"; break;
      case "date": placeholder = "dd/mm/yyyy"; break;
      case "phone": placeholder = "090xxxxxxx"; break;
      case "dropdown": placeholder = field.options?.join(', ') || "Chọn..."; break;
      case "image": placeholder = "[Khu vực hình ảnh]"; break;
      default: placeholder = "Dữ liệu...";
    }
    
    let displayLabel: React.ReactNode = field.label;
    if (field.fieldName === "issuerSignatureBlock") {
      displayLabel = field.label.split("\\n").map((line, i) => <span key={i}>{line}<br/></span>);
    }


    return (
      <div 
        key={field.id} 
        className="absolute p-0.5 border border-dashed border-transparent hover:border-muted-foreground/50 rounded text-xs whitespace-pre-line"
        style={{
            top: `${field.positionY}px`, 
            left: `${field.positionX}px`, 
            // Add any future styling here (textAlign, fontWeight, etc.)
        }}
      >
        {field.fieldName === "issuerSignatureBlock" ? (
          <span className="whitespace-pre-line">{displayLabel}</span>
        ) : (
          <strong className="font-bold">{displayLabel}:</strong>
        )}
        {field.fieldType !== "text" && field.fieldName !== "issuerSignatureBlock" && ` [${placeholder}]`}
        {field.required && <span className="text-red-500">*</span>}
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-4">
        <p className="text-sm text-center text-muted-foreground mb-2">Xem Trước Phiếu (A5 Ngang - Kích thước thật: 210mm x 148mm)</p>
        <div 
          className="printable-receipt-area mx-auto bg-white dark:bg-neutral-100 shadow-md relative overflow-hidden border border-gray-300"
          style={{
            width: `${A5_WIDTH_PX * PREVIEW_SCALE}px`,
            height: `${A5_HEIGHT_PX * PREVIEW_SCALE}px`,
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative', 
          }}
          aria-label={`Xem trước mẫu phiếu ${templateName}`}
        >
          <div 
            className="absolute top-0 left-0"
            style={{
                width: `${A5_WIDTH_PX}px`,
                height: `${A5_HEIGHT_PX}px`,
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: 'top left',
            }}
            >
            <div 
                className="absolute inset-0 border-2 border-primary/30 pointer-events-none" 
                style={{ margin: `8px` }} 
            ></div>
            
            {showLogoOnPrint && logoUrl && (
                <img 
                src={logoUrl} 
                alt="Logo" 
                className="absolute opacity-80" 
                style={{ 
                    top: `${logoPositionY}px`, 
                    left: `${logoPositionX}px`, 
                    maxHeight: `40px`, 
                    maxWidth: `120px`, 
                    objectFit: 'contain',
                }} 
                data-ai-hint="logo temple minimal"
                />
            )}
            
            <div 
                className="text-center"
                style={{
                marginTop: `10px`, 
                paddingLeft: `${(showLogoOnPrint && logoUrl && (logoPositionX || 0) < A5_WIDTH_PX / 2) ? 130 : 20}px`, 
                paddingRight: `20px`, 
                }}
            >
                {organizationName && <p className="font-semibold" style={{fontSize: `10pt`}}>{organizationName.toUpperCase()}</p>}
                {organizationAddress && <p style={{fontSize: `8pt`}}>{organizationAddress}</p>}
            </div>

            <h2 
                className="text-center font-bold text-primary"
                style={{
                fontSize: `12pt`, 
                marginTop: `10px`, 
                marginBottom: `15px`,
                }}
            >
                {headerText || templateName || "PHIẾU CÔNG ĐỨC"}
            </h2>
            
            {fields.map(renderField)}
            {fields.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-10" style={{position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%'}}>
                Chưa có trường dữ liệu nào được thêm. <br/>Kéo thả các trường từ thư viện vào đây.
                </p>
            )}

            {footerText && (
                 <div 
                    className="absolute text-center text-muted-foreground"
                    style={{
                    fontSize: `8pt`,
                    bottom: `10px`, 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    }}
                >
                   <p>{footerText}</p>
                </div>
            )}
          </div> 
        </div>
      </CardContent>
    </Card>
  );
}

    
export interface CompanyInfo {
  name: string;
  brand: string;
  subTitle: string;
}

export interface ClientContact {
  name: string;
  address: string;
  attn: string;
  phone?: string;
}

export interface POMetadata {
  poNumber: string;
  issueDate: string;
  paymentTerm: string;
  priceTerm: string;
}

export interface POItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
}

export interface POSignee {
  company: string;
  name: string;
  title: string;
}

export interface AppendixItem {
  id: string;
  title: string;
  content: string;
}

export interface PurchaseOrder {
  company: CompanyInfo;
  vendor: ClientContact;
  shipping: ClientContact;
  metadata: POMetadata;
  items: POItem[];
  notes: string[];
  signee: POSignee;
  
  // Appendix Configuration
  appendixEnabled?: boolean;
  appendixTitle?: string;
  appendixItems?: AppendixItem[];

  // Premium Logo & Visual Assets Support
  logoType?: "default" | "uploaded" | "text";
  logoImage?: string;             // Base64 Data URL or path
  
  // Premium Signature (TTD) Support
  signatureType?: "generated" | "uploaded" | "blank";
  signatureFont?: "alex" | "caveat" | "satisfy" | "standard";
  signatureText?: string;
  signatureImage?: string;        // Base64 Data URL or path
  
  // Premium Corporate Stamp (Cap) Support
  stampType?: "generated" | "uploaded" | "blank";
  stampTextMain?: string;         // e.g. "PT INFINITAS DIGITAL SOLUSI"
  stampTextSub?: string;          // e.g. "DIREKSI / FINANCE"
  stampColor?: string;            // hex or tailwind class e.g. "#0f5ca3" blue, "#831843" purple
  stampAngle?: number;            // tilt degrees: -15 to +15
  stampImage?: string;            // Base64 Data URL or path
  stampSize?: number;             // size in pixels: 60 to 140

  // PPN Support
  ppnEnabled?: boolean;
  ppnPercent?: number;            // e.g. 11
}

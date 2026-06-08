import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Trash, 
  FileText, 
  CheckCircle, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Globe, 
  RefreshCw,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Phone,
  ArrowRight,
  ChevronDown,
  Info,
  Paperclip,
  PenTool,
  Upload,
  Percent,
  Eye
} from "lucide-react";
import { PurchaseOrder, POItem, BankDetails } from "./types";
import { defaultPurchaseOrder } from "./defaultData";
import { generateExcelPO } from "./excelGenerator";
import { createGoogleSheetsPO } from "./googleSheetsExport";

// Helper functions to convert OKLCH and OKLAB to RGB / RGBA to avoid html2canvas crash
function oklabToRgb(L: number, a: number, b: number, alpha = 1): string {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855414 * b;

  const l = Math.pow(Math.max(0, l_), 3);
  const m = Math.pow(Math.max(0, m_), 3);
  const s = Math.pow(Math.max(0, s_), 3);

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699294 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_val = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toSRGB = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const R = Math.round(toSRGB(r) * 255);
  const G = Math.round(toSRGB(g) * 255);
  const B = Math.round(toSRGB(b_val) * 255);

  if (alpha === 1 || alpha === undefined) {
    return `rgb(${R}, ${G}, ${B})`;
  } else {
    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }
}

function oklchToRgb(L: number, C: number, H: number, alpha = 1): string {
  const H_rad = (H * Math.PI) / 180;
  const a = C * Math.cos(H_rad);
  const b = C * Math.sin(H_rad);
  return oklabToRgb(L, a, b, alpha);
}

function replaceOklchAndOklab(cssText: string): string {
  if (typeof cssText !== "string") return cssText;

  // Replace oklch(L C H / alpha) or oklch(L C H)
  const oklchRegex = /oklch\(\s*([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+%?)(?:\s*\/\s*([0-9.]+%?))?\s*\)/g;
  let result = cssText.replace(oklchRegex, (_match, lStr, cStr, hStr, aStr) => {
    const L = lStr.endsWith("%") ? parseFloat(lStr) / 100 : parseFloat(lStr);
    const C = parseFloat(cStr);
    const H = parseFloat(hStr);
    let alpha = 1;
    if (aStr) {
      alpha = aStr.endsWith("%") ? parseFloat(aStr) / 100 : parseFloat(aStr);
    }
    return oklchToRgb(L, C, H, alpha);
  });

  // Handle oklch with commas: oklch(L, C, H, alpha)
  const oklchCommaRegex = /oklch\(\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)\s*,\s*([0-9.]+%?)(%?)(?:\s*,\s*([0-9.]+%?))?\s*\)/g;
  result = result.replace(oklchCommaRegex, (_match, lStr, cStr, hStr, _pct, aStr) => {
    const L = lStr.endsWith("%") ? parseFloat(lStr) / 100 : parseFloat(lStr);
    const C = parseFloat(cStr);
    const H = parseFloat(hStr);
    let alpha = 1;
    if (aStr) {
      alpha = aStr.endsWith("%") ? parseFloat(aStr) / 100 : parseFloat(aStr);
    }
    return oklchToRgb(L, C, H, alpha);
  });

  // Replace oklab(L a b / alpha) or oklab(L a b)
  const oklabRegex = /oklab\(\s*([0-9.]+%?)\s+([0-9.+-]+%?)\s+([0-9.+-]+%?)(?:\s*\/\s*([0-9.]+%?))?\s*\)/g;
  result = result.replace(oklabRegex, (_match, lStr, aStr_val, bStr_val, alphaStr) => {
    const L = lStr.endsWith("%") ? parseFloat(lStr) / 100 : parseFloat(lStr);
    const a = aStr_val.endsWith("%") ? parseFloat(aStr_val) / 100 : parseFloat(aStr_val);
    const b = bStr_val.endsWith("%") ? parseFloat(bStr_val) / 100 : parseFloat(bStr_val);
    let alpha = 1;
    if (alphaStr) {
      alpha = alphaStr.endsWith("%") ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
    }
    return oklabToRgb(L, a, b, alpha);
  });

  // Handle oklab with commas: oklab(L, a, b, alpha)
  const oklabCommaRegex = /oklab\(\s*([0-9.]+%?)\s*,\s*([0-9.+-]+%?)\s*,\s*([0-9.+-]+%?)(?:\s*,\s*([0-9.]+%?))?\s*\)/g;
  result = result.replace(oklabCommaRegex, (_match, lStr, aStr_val, bStr_val, alphaStr) => {
    const L = lStr.endsWith("%") ? parseFloat(lStr) / 100 : parseFloat(lStr);
    const a = aStr_val.endsWith("%") ? parseFloat(aStr_val) / 100 : parseFloat(aStr_val);
    const b = bStr_val.endsWith("%") ? parseFloat(bStr_val) / 100 : parseFloat(bStr_val);
    let alpha = 1;
    if (alphaStr) {
      alpha = alphaStr.endsWith("%") ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
    }
    return oklabToRgb(L, a, b, alpha);
  });

  return result;
}

// Realistic Corporate Sealing / Stamp component for high-fidelity PDF documents
function CorporateStamp({ mainText, subText, color, angle, size }: { mainText: string; subText: string; color: string; angle: number; size?: number }) {
  const finalSize = size || 90;
  const scale = finalSize / 90;
  // Indonesian style: rounded double-ring stamp
  return (
    <div 
      className="relative flex items-center justify-center shrink-0 pointer-events-none select-none printable-stamp origin-center"
      style={{ 
        transform: `rotate(${angle || 0}deg) scale(${scale})`, 
        color: color || "#059669",
        opacity: 0.88,
        width: "90px",
        height: "90px"
      }}
    >
      {/* Circle double border */}
      <div 
        className="absolute inset-0 rounded-full border-[2.8px] flex items-center justify-center"
        style={{ borderColor: "currentColor" }}
      >
        <div 
          className="absolute inset-[3.5px] rounded-full border border-dashed flex items-center justify-center"
          style={{ borderColor: "currentColor" }}
        />
      </div>

      {/* Outer Curved Text on circle path */}
      <svg className="absolute inset-0 w-full h-full rotate-[-91deg]">
        <path id="stamp-text-path-id" d="M 45,9 A 36,36 0 1,1 44.9,9" fill="none" />
        <text className="text-[7px] font-black uppercase tracking-wider fill-current" letterSpacing="0.9">
          <textPath href="#stamp-text-path-id" startOffset="50%" textAnchor="middle">
            {mainText ? mainText.substring(0, 42) : "PT INFINITAS DIGITAL SOLUSI"}
          </textPath>
        </text>
      </svg>

      {/* Center status layout with star dividers */}
      <div 
        className="absolute inset-[13px] rounded-full border border-double flex flex-col items-center justify-center text-center font-bold" 
        style={{ borderColor: "currentColor" }}
      >
        <span className="text-[5.5px] tracking-widest leading-none">★</span>
        <span className="text-[9.5px] font-black tracking-widest uppercase leading-none my-0.5">{subText || "APPROVED"}</span>
        <span className="text-[5.5px] tracking-widest leading-none">★</span>
      </div>
    </div>
  );
}

export default function App() {
  // State for Purchase Order Data (loaded from local storage draft if exists)
  const [po, setPo] = useState<PurchaseOrder>(() => {
    const saved = localStorage.getItem("po_document_draft_v1");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved PO draft:", e);
      }
    }
    return defaultPurchaseOrder;
  });

  // Auto-save PO document to local storage for persistence across tabs
  useEffect(() => {
    localStorage.setItem("po_document_draft_v1", JSON.stringify(po));
  }, [po]);

  // State for Google OAuth Credentials
  const [accessToken, setAccessToken] = useState<string>(() => {
    return localStorage.getItem("po_google_access_token") || "";
  });
  const [clientId, setClientId] = useState<string>(() => {
    return localStorage.getItem("po_google_client_id") || "";
  });
  
  // App system UI states
  const [tempTokenInput, setTempTokenInput] = useState<string>("");
  const [showAuthSettings, setShowAuthSettings] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [pdfExportError, setPdfExportError] = useState<string>("");
  const [lastPdfAction, setLastPdfAction] = useState<"download" | "preview" | null>(null);
  const [generatedSheet, setGeneratedSheet] = useState<{ id: string; url: string } | null>(null);
  const [exportError, setExportError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"details" | "addresses" | "items" | "notes" | "appendix" | "signature">("details");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null);

  // Persist configurations
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem("po_google_access_token", accessToken);
    } else {
      localStorage.removeItem("po_google_access_token");
    }
  }, [accessToken]);

  useEffect(() => {
    if (clientId) {
      localStorage.setItem("po_google_client_id", clientId);
    } else {
      localStorage.removeItem("po_google_client_id");
    }
  }, [clientId]);

  // Handle Hash Redirect for client-side Implicit Grant OAuth Flow
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const rParams = new URLSearchParams(hash.substring(1));
      const token = rParams.get("access_token");
      if (token) {
        setAccessToken(token);
        setStatusMessage("Google Account connected successfully!");
        window.location.hash = "";
        setTimeout(() => setStatusMessage(""), 5000);
      }
    }
  }, []);

  // Update specific metadata fields
  const handleMetaChange = (field: keyof typeof po.metadata, value: string) => {
    setPo(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  // Update client records
  const handleClientChange = (card: "vendor" | "shipping", field: string, value: string) => {
    setPo(prev => ({
      ...prev,
      [card]: {
        ...prev[card],
        [field]: value
      }
    }));
  };

  // Item List Management
  const handleItemPropertyChange = (itemId: string, property: keyof POItem, value: any) => {
    setPo(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            [property]: value
          };
        }
        return item;
      })
    }));
  };

  const addItemRow = () => {
    const newItem: POItem = {
      id: Date.now().toString(),
      description: "Nama barang baru...",
      qty: 1,
      unit: "Pcs",
      price: 0
    };
    setPo(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItemRow = (id: string) => {
    if (po.items.length <= 1) {
      alert("Purchase Order harus memiliki minimal 1 baris barang.");
      return;
    }
    setPo(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // Note Management
  const handleNoteChange = (index: number, value: string) => {
    setPo(prev => {
      const updatedNotes = [...prev.notes];
      updatedNotes[index] = value;
      return { ...prev, notes: updatedNotes };
    });
  };

  const addNoteLine = () => {
    setPo(prev => ({
      ...prev,
      notes: [...prev.notes, "Tulis syarat / ketentuan pengiriman baru di sini..."]
    }));
  };

  const removeNoteLine = (index: number) => {
    setPo(prev => ({
      ...prev,
      notes: prev.notes.filter((_, idx) => idx !== index)
    }));
  };

  const handleBankDetailsChange = (field: keyof BankDetails, value: string) => {
    setPo(prev => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || { bankName: '', accountNumber: '', accountName: '' }),
        [field]: value
      }
    }));
  };

  // Signee Changes
  const handleSigneeChange = (field: keyof typeof po.signee, value: string) => {
    setPo(prev => ({
      ...prev,
      signee: {
        ...prev.signee,
        [field]: value
      }
    }));
  };

  // Appendix clause management
  const handleAppendixItemChange = (itemId: string, field: "title" | "content" | "imageUrl", value: string | undefined) => {
    setPo(prev => ({
      ...prev,
      appendixItems: (prev.appendixItems || []).map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const handleAppendixItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran gambar maksimal 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleAppendixItemChange(itemId, "imageUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAppendixItem = () => {
    const defaultIndex = (po.appendixItems || []).length + 1;
    const newItem = {
      id: "app-" + Date.now().toString(),
      title: `${defaultIndex}. Spesifikasi Teknis/Klausul Baru`,
      content: "Masukkan detail spesifikasi, klausul pembayaran, atau syarat teknis lampiran di sini..."
    };
    setPo(prev => ({
      ...prev,
      appendixItems: [...(prev.appendixItems || []), newItem]
    }));
  };

  const removeAppendixItem = (itemId: string) => {
    setPo(prev => ({
      ...prev,
      appendixItems: (prev.appendixItems || []).filter(item => item.id !== itemId)
    }));
  };

  const toggleAppendix = (enabled: boolean) => {
    setPo(prev => ({
      ...prev,
      appendixEnabled: enabled
    }));
  };

  const handleAppendixTitleChange = (value: string) => {
    setPo(prev => ({
      ...prev,
      appendixTitle: value
    }));
  };

  // Premium Custom Visual Logo & Signature (TTD) & Stamp (Cap) Managers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "logoImage" | "signatureImage" | "stampImage") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Ukuran file gambar terlalu besar! Batas maksimal adalah 1.5MB agar dokumen tetap cepat dimuat.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPo(prev => ({
            ...prev,
            [field]: event.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignaturePropertyChange = (property: string, value: any) => {
    setPo(prev => ({
      ...prev,
      [property]: value
    }));
  };

  // Totals calculations
  const calculateSubtotal = () => {
    return po.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };

  const calculatePPN = () => {
    if (!po.ppnEnabled) return 0;
    return Math.round((calculateSubtotal() * (po.ppnPercent ?? 11)) / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculatePPN();
  };

  // Format currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(num);
  };

  // Unified PDF Generation function returning a Blob
  const generatePdfBlob = async (): Promise<{ blob: Blob; fileName: string }> => {
    // Wait until all custom fonts are loaded
    if (typeof document !== "undefined" && document.fonts) {
      await document.fonts.ready;
    }

    const html2pdfModule = await import("html2pdf.js");
    let html2pdf = html2pdfModule.default || html2pdfModule;
    if (typeof html2pdf !== "function" && (html2pdf as any).default) {
      html2pdf = (html2pdf as any).default;
    }
    
    const originalContainer = document.getElementById("po-download-wrapper");
    if (!originalContainer) {
      throw new Error("Element po-download-wrapper tidak ditemukan!");
    }

    // Capture and replace oklch / oklab colors in all stylesheets to avoid html2canvas crash
    const styleBackups: { element: HTMLStyleElement; originalText: string }[] = [];
    if (typeof document !== "undefined") {
      const styles = document.querySelectorAll("style");
      styles.forEach((styleEl) => {
        styleBackups.push({
          element: styleEl,
          originalText: styleEl.textContent || ""
        });
        styleEl.textContent = replaceOklchAndOklab(styleEl.textContent || "");
      });
    }

    // Capture and temporarily monkey-patch getComputedStyle to yield fallback rgb() colors instead of oklch
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(elt, pseudoElt) {
      const style = originalGetComputedStyle.call(this, elt, pseudoElt);
      return new Proxy(style, {
        get(target, prop, receiver) {
          if (prop === "getPropertyValue") {
            return function(propertyName: string) {
              const originalVal = target.getPropertyValue(propertyName);
              if (typeof originalVal === "string" && (originalVal.includes("oklch") || originalVal.includes("oklab"))) {
                return replaceOklchAndOklab(originalVal);
              }
              return originalVal;
            };
          }
          const val = Reflect.get(target, prop, target);
          if (typeof val === "function") {
            return val.bind(target);
          }
          if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
            return replaceOklchAndOklab(val);
          }
          return val;
        }
      });
    };

    // Create an offscreen isolated container to render the document
    const tempWrapper = document.createElement("div");
    tempWrapper.style.position = "absolute";
    tempWrapper.style.top = "-9999px";
    tempWrapper.style.left = "-9999px";
    tempWrapper.style.width = "794px"; // 794px represents standard A4 (96 DPI standard)
    tempWrapper.style.backgroundColor = "#ffffff";
    
    // Clone original element structure
    const clonedNode = originalContainer.cloneNode(true) as HTMLElement;
     // Force page-specific high fidelity dimension states on the clones
    const page1 = clonedNode.querySelector("#printable-po-document") as HTMLElement | null;
    if (page1) {
      page1.style.width = "794px";
      page1.style.minHeight = "1120px";
      page1.style.height = "auto";
      page1.style.padding = "45px";
      page1.style.border = "none";
      page1.style.borderRadius = "0";
      page1.style.boxShadow = "none";
      page1.style.boxSizing = "border-box";
      page1.style.backgroundColor = "#ffffff";
    }

    const page2 = clonedNode.querySelector("#printable-appendix-document") as HTMLElement | null;
    if (page2) {
      page2.style.width = "794px";
      page2.style.minHeight = "1120px";
      page2.style.height = "auto";
      page2.style.padding = "45px";
      page2.style.border = "none";
      page2.style.borderRadius = "0";
      page2.style.boxShadow = "none";
      page2.style.boxSizing = "border-box";
      page2.style.backgroundColor = "#ffffff";
      page2.style.pageBreakBefore = "always";
    }

    tempWrapper.appendChild(clonedNode);
    document.body.appendChild(tempWrapper);

    // Safe clean file name
    const cleanFileName = `PurchaseOrder_${po.metadata.poNumber || "Doc"}_${po.vendor.name || "Vendor"}.pdf`
      .replace(/[/\\?%*:|"<>]/g, "_")
      .replace(/\s+/g, "_");

    const opt = {
      margin:       0,
      filename:     cleanFileName,
      image:        { type: "jpeg" as const, quality: 1.0 }, // Maximum quality
      pagebreak:    { mode: ['css', 'legacy'], avoid: '.avoid-break' },
      html2canvas:  { 
        scale: 3, // Premium high-fidelity 3x scale as requested
        useCORS: true, 
        letterRendering: true,
        logging: false,
        width: 794
      },
      jsPDF:        { 
        unit: "mm" as const, 
        format: "a4" as const, 
        orientation: "portrait" as const 
      }
    };

    try {
      const blob = await (html2pdf as any)().set(opt).from(clonedNode).output('blob');
      return { blob, fileName: cleanFileName };
    } catch (e) {
      throw e;
    } finally {
      if (tempWrapper.parentNode) {
        document.body.removeChild(tempWrapper);
      }
      // Oklch computed style and style element restoration
      if (typeof window !== "undefined") {
        window.getComputedStyle = originalGetComputedStyle;
      }
      styleBackups.forEach(({ element, originalText }) => {
        element.textContent = originalText;
      });
    }
  };

  // Direct high-fidelity PDF download with html2pdf (NO PRINT PREVIEW BROWSERS)
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    setPdfExportError("");
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      const { blob, fileName } = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);

      setStatusMessage("Dokumen PDF berhasil diunduh langsung!");
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err: any) {
      console.error("Gagal mendownload PDF langsung:", err);
      setPdfExportError("Gagal mengunduh PDF secara langsung: " + (err.message || err));
      setLastPdfAction("download");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // High-fidelity PDF Preview tab with reliable popup fallback inside iframe sandbox
  const handlePreviewPDF = async () => {
    setIsExportingPDF(true);
    setPdfExportError("");
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      const { blob } = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      
      // Attempt to open in a new tab first
      try {
        const win = window.open(url, "_blank");
        if (!win || win.closed || typeof win.closed === "undefined") {
          console.warn("New tab blocked by sandbox restrictions. Falling back to the in-app interactive viewer modal!");
        }
      } catch (e) {
        console.warn("window.open triggered an exception under iframe sandbox rules: ", e);
      }
      
      // Set state to open the safe premium in-app preview modal
      setPreviewPdfBlobUrl(url);
      setStatusMessage("Pratinjau PDF berhasil dimuat!");
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err: any) {
      console.error("Gagal melakukan pratinjau PDF:", err);
      setPdfExportError("Gagal mempratinjau PDF: " + (err.message || err));
      setLastPdfAction("preview");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // ExcelJS Export launcher
  const handleExcelExport = async () => {
    try {
      await generateExcelPO(po);
      setStatusMessage("Spreadsheet template berhasil diunduh!");
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err: any) {
      console.error("Gagal mengekspor Excel:", err);
      alert("Gagal membuat Excel template: " + err.message);
    }
  };

  // Implicit Google OAuth Trigger
  const triggerGoogleLogin = () => {
    if (!clientId) {
      alert("Masukkan Client ID Google Anda terlebih dahulu di setelan koneksi untuk menggunakan SSO.");
      setShowAuthSettings(true);
      return;
    }
    const scopes = encodeURIComponent("https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file");
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scopes}&prompt=select_account`;
    
    // Redirect to authorization consent
    window.location.href = oauthUrl;
  };

  // Apply manual token
  const handleApplyManualToken = () => {
    if (!tempTokenInput.trim()) {
      alert("Masukkan token akses yang valid.");
      return;
    }
    setAccessToken(tempTokenInput.trim());
    setTempTokenInput("");
    setStatusMessage("Token Akses Google berhasil dipasang!");
    setTimeout(() => setStatusMessage(""), 5000);
  };

  // Clear session
  const handleDisconnect = () => {
    setAccessToken("");
    setGeneratedSheet(null);
    setExportError("");
    setStatusMessage("Koneksi Google dicabut.");
    setTimeout(() => setStatusMessage(""), 4000);
  };

  // Direct export via sheets API
  const handleGoogleSheetsExport = async () => {
    if (!accessToken) {
      alert("Koneksikan Google Sheets Anda terlebih dahulu.");
      setShowAuthSettings(true);
      return;
    }

    setIsExporting(true);
    setExportError("");
    setGeneratedSheet(null);

    try {
      const result = await createGoogleSheetsPO(accessToken, po);
      setGeneratedSheet({
        id: result.spreadsheetId,
        url: result.spreadsheetUrl
      });
      setStatusMessage("Template PO berhasil ditulis ke Google Sheets!");
    } catch (err: any) {
      console.error(err);
      setExportError(err.message || "Gagal melakukan ekspor ke Google Sheets.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased font-sans">
      {/* Top Banner Message */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-5 py-3 rounded-full flex items-center shadow-lg text-sm font-medium gap-2"
          >
            <CheckCircle className="w-5 h-5 text-emerald-300" />
            <span>{statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main App Layout */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-30 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-xl text-white shadow-md shadow-sky-100">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              PO & Invoice
              <span className="text-xs bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full uppercase">Template Builder</span>
            </h1>
            <p className="text-xs text-slate-500">Sesuaikan data dokumen dan langsung ekspor ke PDF secara presisi</p>
          </div>
        </div>

        {/* Master Actions */}
        <div className="flex flex-nowrap items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {/* Pratinjau PDF */}
          <button 
            onClick={handlePreviewPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 text-sm font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50/50 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shrink-0"
          >
            <Eye className={`w-4 h-4 text-rose-500 ${isExportingPDF ? "animate-pulse" : ""}`} />
            <span>{isExportingPDF ? "Mengekspor..." : "Pratinjau PDF (A4)"}</span>
          </button>

          {/* Unduh PDF */}
          <button 
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 text-sm font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50/50 px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shrink-0"
          >
            <FileText className={`w-4 h-4 text-rose-500 ${isExportingPDF ? "animate-pulse" : ""}`} />
            <span>{isExportingPDF ? "Mengekspor..." : "Unduh PDF (A4)"}</span>
          </button>
        </div>
      </header>

      {/* Error notification for PDF export */}
      <AnimatePresence>
        {pdfExportError && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-50 border-b border-rose-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 font-sans shadow-inner overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0"></span>
              <span className="font-medium">⚠️ {pdfExportError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (lastPdfAction === "download") {
                    handleDownloadPDF();
                  } else {
                    handlePreviewPDF();
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold py-1 px-3 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 animate-spin inline-block mr-1" style={{ animationDuration: '3s' }} />
                <span>Coba Lagi (Retry)</span>
              </button>
              <button 
                onClick={() => setPdfExportError("")}
                className="bg-white hover:bg-rose-100 text-rose-700 hover:text-rose-900 text-[11px] font-semibold py-1 px-3.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main body: Split screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* Left pane: Forms controls / Settings (Lg: 5 columns) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
          {/* Standard Form Editor Panels container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {/* Document Type Selector */}
            <div className="p-3 border-b border-slate-100 bg-white flex justify-between items-center px-4">
              <span className="text-xs font-bold text-slate-700 tracking-wider">TIPE DOKUMEN:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPo(prev => {
                    const nextPo = { 
                      ...prev, 
                      documentType: "po" as const,
                      vendor: defaultPurchaseOrder.vendor
                    };
                    if (!prev.notes || prev.notes.length === 0 || prev.notes[0]?.toLowerCase().includes("official proof")) {
                      nextPo.notes = [
                        "All Shipments Must Include: a. Invoice, b. Receipt, c. Delivery Order, d. Quality Control",
                        "We will return the goods if they do not match the order",
                        "Purchase Order Number must be stated on the Note/Invoice/Receipt",
                        "If the delivery will be carried out in stages, then Each shipment of goods must be accompanied by a copy of the Purchase Order."
                      ];
                    }
                    return nextPo;
                  })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    (!po.documentType || po.documentType === "po") 
                      ? "bg-white text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Purchase Order (PO)
                </button>
                <button
                  onClick={() => setPo(prev => ({ 
                    ...prev, 
                    documentType: "invoice",
                    vendor: {
                      name: "PT INFINITAS DIGITAL SOLUSI",
                      address: "Jl. Ring Road Jl. Raya Bubulak No.A-4, RT.01/RW.11, Bubulak, Kec. Bogor Bar., Kota Bogor, Jawa Barat 16115",
                      attn: "Januar Nurachman",
                      phone: "+62 895 1556 4608"
                    }
                  }))}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    po.documentType === "invoice" 
                      ? "bg-white text-emerald-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Invoice (Tagihan)
                </button>
                <button
                  onClick={() => setPo(prev => {
                    const nextPo = { 
                      ...prev, 
                      documentType: "delivery_order" as const,
                      vendor: {
                        name: "PT INFINITAS DIGITAL SOLUSI",
                        address: "Jl. Ring Road Jl. Raya Bubulak No.A-4, RT.01/RW.11, Bubulak, Kec. Bogor Bar., Kota Bogor, Jawa Barat 16115",
                        attn: "Januar Nurachman",
                        phone: "+62 895 1556 4608"
                      }
                    };
                    if (!prev.notes || prev.notes.length === 0 || prev.notes[0]?.toLowerCase().includes("all shipment") || prev.notes[0]?.toLowerCase().includes("inv")) {
                      nextPo.notes = [
                        "This Delivery Order serves as official proof of goods receipt.",
                        "This Delivery Order is not proof of sale.",
                        "This Delivery Order will be accompanied by an invoice."
                      ];
                    }
                    return nextPo;
                  })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    po.documentType === "delivery_order" 
                      ? "bg-white text-sky-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Delivery Order (DO)
                </button>
              </div>
            </div>

            {/* Tab Swappers */}
            <div className="grid grid-cols-6 border-b border-slate-100 bg-slate-50/50 p-1">
              {[
                { id: "details", label: "Metadata", icon: FileText },
                { id: "addresses", label: "Kontak", icon: MapPin },
                { id: "items", label: "Barang", icon: FileSpreadsheet },
                { id: "notes", label: "Tambahan", icon: Info },
                { id: "appendix", label: "Lampiran", icon: Paperclip },
                { id: "signature", label: "Logo & TTD", icon: PenTool }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold rounded-xl transition-all ${
                      isActive 
                        ? "bg-white text-indigo-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Editable Content area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              
              {/* TAB 1: METADATA */}
              {activeTab === "details" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-bold text-slate-800 border-l-4 border-indigo-500 pl-2">
                    {po.documentType === 'invoice' ? 'Informasi & Nomor Invoice' : po.documentType === 'delivery_order' ? 'Informasi & Nomor DO' : 'Informasi & Nomor PO'}
                  </h3>
                  
                  {po.documentType === 'invoice' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Nomor Invoice</label>
                          <input 
                            type="text" 
                            value={po.metadata.invoiceNumber || ""}
                            onChange={(e) => handleMetaChange("invoiceNumber", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Tanggal Terbit (Date)</label>
                          <input 
                            type="date" 
                            value={po.metadata.issueDate}
                            onChange={(e) => handleMetaChange("issueDate", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Nomor PO (Opsional)</label>
                          <input 
                            type="text" 
                            value={po.metadata.poNumber || ""}
                            onChange={(e) => handleMetaChange("poNumber", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Nomor DO (Opsional)</label>
                          <input 
                            type="text" 
                            value={po.metadata.deliveryOrderNumber || ""}
                            onChange={(e) => handleMetaChange("deliveryOrderNumber", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Purchased Payment</label>
                          <input 
                            type="text" 
                            value={po.metadata.paymentTerm || ""}
                            onChange={(e) => handleMetaChange("paymentTerm", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Due Dated</label>
                          <input 
                            type="text" 
                            value={po.metadata.dueDate || ""}
                            onChange={(e) => handleMetaChange("dueDate", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </>
                  ) : po.documentType === 'delivery_order' ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Nomor DO</label>
                          <input 
                            type="text" 
                            value={po.metadata.deliveryOrderNumber || ""}
                            onChange={(e) => handleMetaChange("deliveryOrderNumber", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Nomor PO (Opsional)</label>
                          <input 
                            type="text" 
                            value={po.metadata.poNumber || ""}
                            onChange={(e) => handleMetaChange("poNumber", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Tanggal Terbit (Date)</label>
                          <input 
                            type="date" 
                            value={po.metadata.issueDate}
                            onChange={(e) => handleMetaChange("issueDate", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Nomor PO</label>
                          <input 
                            type="text" 
                            value={po.metadata.poNumber}
                            onChange={(e) => handleMetaChange("poNumber", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Tanggal Terbit</label>
                          <input 
                            type="date" 
                            value={po.metadata.issueDate}
                            onChange={(e) => handleMetaChange("issueDate", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Tenggat Pembayaran</label>
                          <input 
                            type="text" 
                            value={po.metadata.paymentTerm}
                            onChange={(e) => handleMetaChange("paymentTerm", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Price Term (Syarat Harga)</label>
                          <input 
                            type="text" 
                            value={po.metadata.priceTerm}
                            onChange={(e) => handleMetaChange("priceTerm", e.target.value)}
                            className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* TAB 2: ADDRESSES */}
              {activeTab === "addresses" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Vendor Segment */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-sky-700 flex items-center gap-1.5 pl-2 border-l-4 border-sky-500">
                      <User className="w-4 h-4" /> Penyedia / Vendor
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">Nama Perusahaan / Supplier</label>
                        <input 
                          type="text" 
                          value={po.vendor.name}
                          onChange={(e) => handleClientChange("vendor", "name", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">Alamat Lengkap</label>
                        <textarea 
                          rows={2}
                          value={po.vendor.address}
                          onChange={(e) => handleClientChange("vendor", "address", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase block">Attention Contact (Attn)</label>
                          <input 
                            type="text" 
                            value={po.vendor.attn}
                            onChange={(e) => handleClientChange("vendor", "attn", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase block">Nomor Telepon (Opsional)</label>
                          <input 
                            type="text" 
                            value={po.vendor.phone || ""}
                            onChange={(e) => handleClientChange("vendor", "phone", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Destination Segment */}
                  <div className="space-y-4 pt-3 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-indigo-700 flex items-center gap-1.5 pl-2 border-l-4 border-indigo-500">
                      <MapPin className="w-4 h-4" /> Tujuan Pengiriman (Sent To)
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">Nama Perusahaan Penerima</label>
                        <input 
                          type="text" 
                          value={po.shipping.name}
                          onChange={(e) => handleClientChange("shipping", "name", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase block">Alamat Pengiriman</label>
                        <textarea 
                          rows={2}
                          value={po.shipping.address}
                          onChange={(e) => handleClientChange("shipping", "address", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase block">Penerima (Attn)</label>
                          <input 
                            type="text" 
                            value={po.shipping.attn}
                            onChange={(e) => handleClientChange("shipping", "attn", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase block">No. Telepon</label>
                          <input 
                            type="text" 
                            value={po.shipping.phone}
                            onChange={(e) => handleClientChange("shipping", "phone", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: BARANG */}
              {activeTab === "items" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800 border-l-4 border-indigo-500 pl-2">Daftar Barang Belanja</h3>
                    <button
                      onClick={addItemRow}
                      className="flex items-center gap-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Baris
                    </button>
                  </div>

                  {/* List items dynamic map */}
                  <div className="space-y-3 pt-1">
                    {po.items.map((item, idx) => (
                      <div 
                        key={item.id} 
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 relative group hover:border-slate-300 transition-colors"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full">Barang #{idx + 1}</span>
                          <button
                            onClick={() => removeItemRow(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50/50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Hapus barang"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-medium block">Nama Barang / Deskripsi</label>
                          <input 
                            type="text" 
                            value={item.description}
                            onChange={(e) => handleItemPropertyChange(item.id, "description", e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        {/* Numbers details */}
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-4 space-y-1">
                            <label className="text-[9px] text-slate-500 font-medium block">Jumlah (Qty)</label>
                            <input 
                              type="number" 
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleItemPropertyChange(item.id, "qty", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-right bg-white"
                            />
                          </div>

                          <div className="col-span-3 space-y-1">
                            <label className="text-[9px] text-slate-500 font-medium block">Unit</label>
                            <input 
                              type="text" 
                              value={item.unit}
                              onChange={(e) => handleItemPropertyChange(item.id, "unit", e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center bg-white"
                            />
                          </div>

                          <div className="col-span-5 space-y-1">
                            {po.documentType === 'delivery_order' ? (
                              <>
                                <label className="text-[9px] text-slate-500 font-medium block">Information</label>
                                <input 
                                  type="text" 
                                  value={item.information || ""}
                                  onChange={(e) => handleItemPropertyChange(item.id, "information", e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-left bg-white"
                                />
                              </>
                            ) : (
                              <>
                                <label className="text-[9px] text-slate-500 font-medium block">Harga Satuan (Rp)</label>
                                <input 
                                  type="number" 
                                  value={item.price}
                                  onChange={(e) => handleItemPropertyChange(item.id, "price", parseFloat(e.target.value) || 0)}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-right bg-white"
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {po.documentType === 'delivery_order' ? (
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-500 font-medium block">Keterangan</label>
                            <input 
                              type="text" 
                              value={item.keterangan || ""}
                              onChange={(e) => handleItemPropertyChange(item.id, "keterangan", e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-left bg-white"
                            />
                          </div>
                        ) : (
                          <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1 pt-1.5">
                            <span>Subtotal:</span>
                            <span className="font-mono font-bold text-slate-700">{formatIDR(item.qty * item.price)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* PPN / Tax Settings */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Percent className="w-3.5 h-3.5 text-indigo-650 shrink-0" />
                        <h4 className="text-xs font-bold font-sans">Pajak Pertambahan Nilai (PPN)</h4>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={po.ppnEnabled ?? false} 
                          onChange={(e) => setPo(prev => ({ ...prev, ppnEnabled: e.target.checked }))}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                      </label>
                    </div>

                    {po.ppnEnabled && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-200/60 font-sans text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span>Persentase PPN:</span>
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {po.ppnPercent ?? 11}%
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="20" 
                          step="1"
                          value={po.ppnPercent ?? 11}
                          onChange={(e) => setPo(prev => ({ ...prev, ppnPercent: parseInt(e.target.value) || 0 }))}
                          className="w-full accent-indigo-600 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                        />
                        
                        <div className="bg-white p-2.5 rounded-lg text-[10px] space-y-1 text-slate-500 border border-slate-100 font-sans mt-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-mono font-medium">{formatIDR(calculateSubtotal())}</span>
                          </div>
                          <div className="flex justify-between text-indigo-600 font-medium">
                            <span>PPN ({po.ppnPercent ?? 11}%):</span>
                            <span className="font-mono">{formatIDR(calculatePPN())}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-1">
                            <span>Total Tagihan:</span>
                            <span className="font-mono text-indigo-700">{formatIDR(calculateTotal())}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 4: ADDITIONAL & ADVANCED */}
              {activeTab === "notes" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {po.documentType === 'invoice' ? (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 pl-2 border-l-4 border-emerald-500">
                        Informasi Rekening Bank
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase block">Nama Bank</label>
                          <input 
                            type="text" 
                            value={po.bankDetails?.bankName || ""}
                            onChange={(e) => handleBankDetailsChange("bankName", e.target.value)}
                            placeholder="Contoh: BCA / Mandiri / BNI"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase block">Nomor Rekening</label>
                          <input 
                            type="text" 
                            value={po.bankDetails?.accountNumber || ""}
                            onChange={(e) => handleBankDetailsChange("accountNumber", e.target.value)}
                            placeholder="Contoh: 1234567890"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-700 uppercase block">Nama Rekening</label>
                          <input 
                            type="text" 
                            value={po.bankDetails?.accountName || ""}
                            onChange={(e) => handleBankDetailsChange("accountName", e.target.value)}
                            placeholder="Contoh: PT ABC MAJU"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-800 border-l-4 border-indigo-500 pl-2">Syarat & Ketentuan (Note)</h3>
                        <button
                          onClick={addNoteLine}
                          className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-slate-100 px-2 py-1 rounded"
                        >
                          <Plus className="w-3 h-3" /> Tambah Note
                        </button>
                      </div>

                      <div className="space-y-2">
                        {po.notes.map((noteText, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <span className="text-xs text-slate-400 mt-2 font-mono">{idx + 1}.</span>
                            <textarea
                              rows={2}
                              value={noteText}
                              onChange={(e) => handleNoteChange(idx, e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white resize-none"
                            />
                            <button
                              onClick={() => removeNoteLine(idx)}
                              className="text-slate-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors mt-1 shrink-0"
                              title="Hapus note"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signee Authorized */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 border-l-4 border-indigo-500 pl-2">Informasi Otoritas Tanda Tangan</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block uppercase">Nama Perusahaan Penanggung Jawab</label>
                        <input 
                          type="text" 
                          value={po.signee.company}
                          onChange={(e) => handleSigneeChange("company", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block uppercase">Nama Direktur / Penanda Tangan</label>
                          <input 
                            type="text" 
                            value={po.signee.name}
                            onChange={(e) => handleSigneeChange("name", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 block uppercase">Jabatan</label>
                          <input 
                            type="text" 
                            value={po.signee.title}
                            onChange={(e) => handleSigneeChange("title", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: APPENDIX (LAMPIRAN PO) */}
              {activeTab === "appendix" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="space-y-0.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!po.appendixEnabled}
                          onChange={(e) => toggleAppendix(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all cursor-pointer"
                        />
                        Aktifkan Lampiran (Appendix) PO
                      </label>
                      <p className="text-[10px] text-slate-500 pl-6 text-balance">
                        Jika diaktifkan, lampiran spesifikasi teknis akan dicetak pada Halaman Ke-2.
                      </p>
                    </div>
                  </div>

                  {po.appendixEnabled && (
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 tracking-wider uppercase block">Judul Lampiran</label>
                        <input 
                          type="text" 
                          value={po.appendixTitle || ""}
                          onChange={(e) => handleAppendixTitleChange(e.target.value)}
                          placeholder="Contoh: LAMPIRAN SPESIFIKASI TEKNIS & KLAUSUL"
                          className="w-full px-3.5 py-2 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-all font-semibold"
                        />
                      </div>

                      <div className="border-t border-slate-100 pt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-slate-800">Daftar Sub-Klausul / Item Lampiran</h4>
                          <button
                            onClick={addAppendixItem}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Tambah Klausul
                          </button>
                        </div>

                        <div className="space-y-4">
                          {(po.appendixItems || []).map((item, idx) => (
                            <div key={item.id} className="p-3 border border-slate-200 rounded-xl space-y-2.5 relative bg-slate-50/50 hover:bg-slate-50 transition-colors">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-extrabold text-slate-400 font-mono">BAGIAN #{idx + 1}</span>
                                <button
                                  onClick={() => removeAppendixItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
                                  title="Hapus bagian ini"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 font-medium block">Sub-Judul / Sub-Klausul</label>
                                <input 
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => handleAppendixItemChange(item.id, "title", e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] text-slate-500 font-medium block">Deskripsi / Detail Klausul</label>
                                <textarea
                                  rows={3}
                                  value={item.content}
                                  onChange={(e) => handleAppendixItemChange(item.id, "content", e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white resize-y"
                                />
                              </div>

                              <div className="space-y-1 pt-1">
                                <label className="text-[9px] text-slate-500 font-medium block">Gambar / Lampiran Visual (Opsional)</label>
                                {item.imageUrl ? (
                                  <div className="relative inline-block mt-1">
                                    <img src={item.imageUrl} alt={`Lampiran ${idx + 1}`} className="h-20 w-auto rounded border border-slate-200 object-contain bg-white p-1" />
                                    <button 
                                      onClick={() => handleAppendixItemChange(item.id, "imageUrl", undefined)}
                                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white hover:bg-red-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm"
                                      title="Hapus gambar"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ) : (
                                  <label className="inline-flex items-center gap-1.5 cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm mt-1">
                                    <Upload className="w-3 h-3" /> Unggah Gambar
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      onChange={(e) => handleAppendixItemImageUpload(e, item.id)} 
                                      className="hidden" 
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          ))}

                          {(po.appendixItems || []).length === 0 && (
                            <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                              Tidak ada klausul lampiran. Silakan klik tombol di atas untuk menambah.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 6: BRANDING, SIGNATURE (TTD) & CORPORATE SEAL (CAP) */}
              {activeTab === "signature" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* SECTION 1: LOGO PERUSAHAAN */}
                  <div className="space-y-3.5 pb-5 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      1. Brand Logo Header Utama
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "default", label: "Logo Wave Default" },
                        { id: "uploaded", label: "Unggah File Logo" }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleSignaturePropertyChange("logoType", opt.id)}
                          className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                            (po.logoType || "default") === opt.id
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-sm"
                              : "border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {(po.logoType || "default") === "uploaded" && (
                      <div className="p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                        <div className="flex items-center gap-3">
                          {po.logoImage ? (
                            <div className="relative shrink-0">
                              <img src={po.logoImage} alt="Preview Logo" className="h-10 w-16 object-contain border border-slate-200 bg-white p-1 rounded" />
                              <button 
                                onClick={() => handleSignaturePropertyChange("logoImage", undefined)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white hover:bg-red-650 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm"
                                title="Hapus gambar"
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <div className="h-10 w-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-400 italic">No Logo</div>
                          )}
                          <div className="flex-1">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-colors shadow-sm">
                              <Upload className="w-3.5 h-3.5" /> Pilih File Logo
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleImageUpload(e, "logoImage")} 
                                className="hidden" 
                              />
                            </label>
                            <p className="text-[9px] text-slate-400 mt-1">Gunakan transparent PNG/JPEG (Maks 1.5MB)</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: TANDA TANGAN (TTD) */}
                  <div className="space-y-3.5 pb-5 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <User className="w-4 h-4 text-indigo-500" />
                      2. Tanda Tangan (TTD) Direktur
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "generated", label: "Cursive Otomatis" },
                        { id: "uploaded", label: "Unggah TTD" },
                        { id: "blank", label: "Kosongkan" }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleSignaturePropertyChange("signatureType", opt.id)}
                          className={`py-2 px-1 text-[11px] font-semibold rounded-xl border text-center transition-all ${
                            (po.signatureType || "generated") === opt.id
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-sm"
                              : "border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {(po.signatureType || "generated") === "generated" && (
                      <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-medium">Model Coretan Teks Nama TTD</label>
                          <input
                            type="text"
                            value={po.signatureText || po.signee.name}
                            onChange={(e) => handleSignaturePropertyChange("signatureText", e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-medium">Pilihan Model Gaya Cursive</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: "satisfy", label: "Modern Flow", fontClass: "font-[--font-satisfy]" },
                              { id: "alex", label: "Klasik Fine", fontClass: "font-[--font-alex]" },
                              { id: "caveat", label: "Marker Pen", fontClass: "font-[--font-caveat]" }
                            ].map(font => (
                              <button
                                key={font.id}
                                onClick={() => handleSignaturePropertyChange("signatureFont", font.id)}
                                className={`py-1.5 px-1 border rounded-lg text-xs flex flex-col items-center gap-0.5 transition-colors ${
                                  (po.signatureFont || "satisfy") === font.id
                                    ? "border-indigo-600 bg-white text-indigo-700 font-bold"
                                    : "border-slate-200 bg-white text-slate-500"
                                }`}
                              >
                                <span className="text-[8px] text-slate-400">{font.label}</span>
                                <span className={`text-sm leading-none py-0.5 ${font.fontClass} text-indigo-800`}>Signature</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {(po.signatureType || "generated") === "uploaded" && (
                      <div className="p-3 border border-dashed border-slate-250 rounded-xl bg-slate-50/50 space-y-3">
                        <div className="flex items-center gap-3">
                          {po.signatureImage ? (
                            <div className="relative shrink-0">
                              <img src={po.signatureImage} alt="Preview TTD" className="h-10 w-16 object-contain border border-slate-200 bg-white p-1 rounded mix-blend-multiply" />
                              <button 
                                onClick={() => handleSignaturePropertyChange("signatureImage", undefined)}
                                className="absolute -top-1.5 -right-1.5 bg-red-505 text-white hover:bg-red-650 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm"
                                title="Hapus gambar"
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <div className="h-10 w-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-400 italic">No TTD</div>
                          )}
                          <div className="flex-1">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-colors shadow-sm">
                              <Upload className="w-3.5 h-3.5" /> Pilih File TTD
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleImageUpload(e, "signatureImage")} 
                                className="hidden" 
                              />
                            </label>
                            <p className="text-[9px] text-slate-400 mt-1">Gunakan file transparent PNG (Maks 1.5MB)</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: CAP STEMPEL PERUSAHAAN */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <PenTool className="w-4 h-4 text-indigo-500" />
                      3. Stempel / Cap Resmi Perusahaan
                    </h3>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "generated", label: "Simulasi Bulat" },
                        { id: "uploaded", label: "Unggah Cap" },
                        { id: "blank", label: "Kosongkan" }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => handleSignaturePropertyChange("stampType", opt.id)}
                          className={`py-2 px-1 text-[11px] font-semibold rounded-xl border text-center transition-all ${
                            (po.stampType || "generated") === opt.id
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-sm"
                              : "border-slate-200 hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {(po.stampType || "generated") === "generated" && (
                      <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-medium font-sans">Nama Perusahaan Ring (Maks 42 Huruf)</label>
                          <input
                            type="text"
                            maxLength={42}
                            value={po.stampTextMain ?? "PT INFINITAS DIGITAL SOLUSI"}
                            onChange={(e) => handleSignaturePropertyChange("stampTextMain", e.target.value)}
                            placeholder="Contoh: PT INFINITAS DIGITAL SOLUSI"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-medium font-sans">Tulisan Tengah (Internal Status)</label>
                          <input
                            type="text"
                            maxLength={15}
                            value={po.stampTextSub ?? "APPROVED"}
                            onChange={(e) => handleSignaturePropertyChange("stampTextSub", e.target.value)}
                            placeholder="APPROVED atau FINANCE"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-slate-500 font-medium block mb-1 font-sans">Pilihan Warna Tinta Stamp</label>
                          <div className="flex gap-2.5 items-center bg-white p-2 border border-slate-200 rounded-xl justify-around">
                            {[
                              { label: "Classic Blue", hex: "#0F5CA3" },
                              { label: "Emerald Green", hex: "#059669" },
                              { label: "Royal Indigo", hex: "#4f46e5" },
                              { label: "Magenta Stamp", hex: "#db2777" },
                              { label: "Crimson Red", hex: "#e11d48" }
                            ].map(item => (
                              <button
                                key={item.hex}
                                onClick={() => handleSignaturePropertyChange("stampColor", item.hex)}
                                className={`w-6 h-6 rounded-full border transition-transform flex items-center justify-center ${
                                  (po.stampColor || "#059669") === item.hex
                                    ? "scale-125 border-slate-800 shadow-sm"
                                    : "border-slate-200 hover:scale-110"
                                }`}
                                style={{ backgroundColor: item.hex }}
                                title={item.label}
                                type="button"
                              >
                                {(po.stampColor || "#059669") === item.hex && (
                                  <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {(po.stampType || "generated") === "uploaded" && (
                      <div className="p-3 border border-dashed border-slate-250 rounded-xl bg-slate-50/50 space-y-3">
                        <div className="flex items-center gap-3">
                          {po.stampImage ? (
                            <div className="relative shrink-0">
                              <img src={po.stampImage} alt="Preview Cap" className="h-10 w-16 object-contain border border-slate-200 bg-white p-1 rounded mix-blend-multiply" />
                              <button 
                                onClick={() => handleSignaturePropertyChange("stampImage", undefined)}
                                className="absolute -top-1.5 -right-1.5 bg-red-550 text-white hover:bg-red-650 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm"
                                title="Hapus gambar"
                              >
                                &times;
                              </button>
                            </div>
                          ) : (
                            <div className="h-10 w-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-400 italic">No Cap</div>
                          )}
                          <div className="flex-1">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-colors shadow-sm">
                              <Upload className="w-3.5 h-3.5" /> Pilih File Cap
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleImageUpload(e, "stampImage")} 
                                className="hidden" 
                              />
                            </label>
                            <p className="text-[9px] text-slate-400 mt-1">Gunakan transparent PNG (Maks 1.5MB)</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(po.stampType || "generated") !== "blank" && (
                      <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-500 font-medium font-sans">
                            <span>Derajat Kemiringan Cap (Overlapping Slant)</span>
                            <span className="font-mono text-[10px] font-bold text-slate-800">{(po.stampAngle !== undefined) ? po.stampAngle : -6}°</span>
                          </div>
                          <input 
                            type="range" 
                            min="-18" 
                            max="18" 
                            value={(po.stampAngle !== undefined) ? po.stampAngle : -6}
                            onChange={(e) => handleSignaturePropertyChange("stampAngle", parseInt(e.target.value) || 0)}
                            className="w-full accent-indigo-600 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                          />
                          <p className="text-[8px] text-slate-400 mt-0.5 font-sans">Disarankan -6° sampai +6° agar terlihat natural.</p>
                        </div>

                        {/* Stamp Size selection slider */}
                        <div className="space-y-1 pt-2.5 border-t border-slate-200/60 font-sans">
                          <div className="flex justify-between text-[9px] text-slate-500 font-medium">
                            <span>Ukuran Cap / Stempel (Diameter)</span>
                            <span className="font-mono text-[10px] font-bold text-slate-800">{po.stampSize || 90}px</span>
                          </div>
                          <input 
                            type="range" 
                            min="60" 
                            max="140" 
                            value={po.stampSize || 90}
                            onChange={(e) => handleSignaturePropertyChange("stampSize", parseInt(e.target.value) || 90)}
                            className="w-full accent-indigo-600 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                          />
                          <p className="text-[8px] text-slate-400 mt-0.5 font-sans">Sesuaikan luas stempel agar serasi di atas tanda tangan.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

            </div>

          </div>

        </div>

        {/* Right pane: Visual High fidelity Screen Graphic (Lg: 7 columns) */}
        <div className="lg:col-span-7 bg-slate-200/50 rounded-2xl border border-slate-300/60 p-3 sm:p-6 flex flex-col items-center gap-6 overflow-x-auto w-full max-w-full min-h-[500px] scrollbar-thin">
          
          {/* Mobile indicator for document size */}
          <div className="w-full max-w-[794px] flex items-center justify-between px-3.5 py-2.5 bg-indigo-50 border border-indigo-100/60 rounded-xl text-indigo-950 text-[11px] font-semibold leading-relaxed shadow-xs shrink-0 select-none">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span><strong>Layout Ukuran Asli (A4)</strong>: Ukuran dokumen dikunci demi akurasi cetak & PDF sempurna.</span>
            </span>
            <span className="hidden sm:inline bg-indigo-100 text-indigo-900 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Akurasi 100%</span>
          </div>

          {/* Download wrapper containing Page 1 (and optionally Page 2) */}
          <div id="po-download-wrapper" className={`w-[794px] shrink-0 flex flex-col items-center ${isExportingPDF ? 'gap-0' : 'gap-6'}`}>

            {/* Live Document Canvas */}
            <div 
              id="printable-po-document" 
              className={`bg-white justify-between relative shrink-0 flex flex-col w-[794px] min-h-[1120px] pb-12 pt-8 px-8 ${
                isExportingPDF 
                  ? "border-none shadow-none rounded-none" 
                  : "shadow-lg rounded-xl border border-slate-200"
              }`}
            >
            
            <div className="space-y-6">
              {/* BRAND HEADER BAR */}
              <div className="flex justify-between items-center border-b border-indigo-50/50 pb-6">
                
                {/* Brand Visual logo matching indilus / kustom with brand name text */}
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0 flex items-center justify-center">
                    {po.logoType === "uploaded" && po.logoImage ? (
                      <img 
                        src={po.logoImage} 
                        alt={po.company.brand} 
                        className="max-w-[280px] max-h-24 w-auto object-contain" 
                      />
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0 flex items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <svg className="w-14 h-14" viewBox="0 0 100 50">
                            <path 
                              d="M25,25 C25,35 35,42 45,35 C55,28 65,15 75,25 C85,35 75,42 65,35 C55,28 45,15 25,25 Z" 
                              fill="none" 
                              stroke="#0F5CA3" 
                              strokeWidth="8" 
                              strokeLinecap="round"
                            />
                            <circle cx="21" cy="24" r="5" fill="#38BDF8" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-900 leading-tight tracking-tight uppercase">
                            {po.company.name || "PT INFINITAS DIGITAL SOLUSI"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                            {po.company.subTitle || "INFINITAS DIGITAL SOLUSI"}
                          </span>
                          <span className="text-[9px] text-[#0F5CA3] font-medium leading-none mt-1.5 opacity-90">
                            Standard Quality & Digital Integration Vendor
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right text details */}
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] block mb-1">
                    {po.documentType === 'invoice' ? 'INVOICE' : po.documentType === 'delivery_order' ? 'DELIVERY ORDER' : 'Purchase Order'}
                  </span>
                  
                  {po.documentType === 'invoice' ? (
                    <div className="space-y-0.5 text-xs text-slate-700 pt-1">
                      <div className="flex justify-end gap-2 items-center">
                        <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">No. Invoice</span>
                        <span className="font-black font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-900 border border-indigo-100">{po.metadata.invoiceNumber || "-"}</span>
                      </div>
                      <div className="flex justify-end gap-2 items-center">
                        <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">No. PO</span>
                        <span className="font-medium font-mono">{po.metadata.poNumber || "-"}</span>
                      </div>
                      <div className="flex justify-end gap-2 items-center">
                        <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">No. DO</span>
                        <span className="font-medium font-mono">{po.metadata.deliveryOrderNumber || "-"}</span>
                      </div>
                      <div className="flex justify-end gap-2 items-center mt-1 pt-1 border-t border-slate-50/50">
                        <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">Date</span>
                        <span className="font-medium text-[10px]">{new Date(po.metadata.issueDate).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ) : po.documentType === 'delivery_order' ? (
                    <div className="space-y-0.5 text-xs text-slate-700 pt-1">
                      <div className="flex justify-end gap-2 items-center">
                        <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">No. DO</span>
                        <span className="font-black font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-900 border border-indigo-100">{po.metadata.deliveryOrderNumber || "-"}</span>
                      </div>
                      <div className="flex justify-end gap-2 items-center">
                        <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">No. PO</span>
                        <span className="font-medium font-mono">{po.metadata.poNumber || "-"}</span>
                      </div>
                      <div className="flex justify-end gap-2 items-center mt-1 pt-1 border-t border-slate-50/50">
                        <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">Date</span>
                        <span className="font-medium text-[10px]">{new Date(po.metadata.issueDate).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-black font-mono text-slate-800 block mt-1">
                        {po.metadata.poNumber || "-"}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Issued: {new Date(po.metadata.issueDate).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* CARD INFO SEGMENTS */}
              <div className="flex flex-row gap-4 w-full justify-between items-stretch">
                
                {/* VENDOR BOX CARDS */}
                <div className="w-[48%] bg-sky-50/30 border border-slate-200/80 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-sky-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-start gap-1.5 text-[#0284C7] font-black text-xs tracking-wide">
                    <CheckCircle className="w-[18px] h-[18px] flex-shrink-0 stroke-[2.5]" /> <span>{po.documentType === 'invoice' || po.documentType === 'delivery_order' ? 'FROM' : 'VENDOR'}</span>
                  </div>
                  <div className="p-4 space-y-2 flex-grow min-h-[140px]">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {po.vendor.name || "[Nama Vendor Kosong]"}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {po.vendor.address || "[Alamat Vendor Kosong]"}
                    </p>
                    <div className="pt-1.5 text-[11px] text-slate-500 space-y-0.5">
                      <p><span className="font-semibold text-slate-700">Attn:</span> {po.vendor.attn || "-"}</p>
                      <p className="flex items-center gap-1"><span className="font-semibold text-slate-700">Phone:</span> {po.vendor.phone || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* SENT TO BOX CARDS */}
                <div className="w-[48%] bg-indigo-900/5 text-slate-900 hover:shadow transition-shadow border border-indigo-200/80 rounded-xl overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-[#1E40AF] text-white border-b border-indigo-900/20 px-4 py-2.5 flex items-center justify-start gap-1.5 font-black text-xs tracking-wide">
                    <CheckCircle className="w-[18px] h-[18px] text-emerald-300 flex-shrink-0 stroke-[2.5]" /> <span>{po.documentType === 'invoice' ? 'BILLED TO' : 'SENT TO'}</span>
                  </div>
                  <div className="p-4 space-y-2 flex-grow min-h-[140px]">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {po.shipping.name || "[Nama Penerima Kosong]"}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {po.shipping.address || "[Alamat Penerima Kosong]"}
                    </p>
                    <div className="pt-1.5 text-[11px] text-slate-500 space-y-0.5">
                      <p><span className="font-semibold text-slate-700">Attn:</span> {po.shipping.attn || "-"}</p>
                      <p className="flex items-center gap-1"><span className="font-semibold text-slate-700">Phone:</span> {po.shipping.phone || "-"}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* CONTRACT CO METADATA STRIP */}
              {po.documentType !== 'delivery_order' && (
                <div className="w-full mb-6">
                  <div className="bg-slate-50 flex flex-row rounded-xl overflow-hidden">
                    <div className="flex-1 py-4 px-4 text-center">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                        {po.documentType === 'invoice' ? 'Nomor Invoice' : 'Purchase Order No'}
                      </div>
                      <div className="text-xs font-black text-slate-700 font-mono tracking-wide">
                        {po.documentType === 'invoice' ? (po.metadata.invoiceNumber || "-") : (po.metadata.poNumber || "-")}
                      </div>
                    </div>
                    <div className="flex-1 py-4 px-4 text-center">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Purchased Payment</div>
                      <div className="text-xs font-bold text-slate-800">{po.metadata.paymentTerm || "-"}</div>
                    </div>
                    <div className="flex-1 py-4 px-4 text-center">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                        {po.documentType === 'invoice' ? 'Due Dated' : 'Price Term'}
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        {po.documentType === 'invoice' ? (po.metadata.dueDate || "-") : (po.metadata.priceTerm || "-")}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GRID TABLE CONSOLE */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 border-b border-slate-200 font-bold tracking-wider text-[10px]">
                      <th className="py-2.5 px-4 font-bold text-slate-500 uppercase">Description</th>
                      <th className="py-2.5 px-3 font-bold text-slate-500 uppercase text-right w-[80px]">Qty</th>
                      <th className="py-2.5 px-3 font-bold text-slate-500 uppercase text-center w-[80px]">Unit</th>
                      <th className="py-2.5 px-3 font-bold text-slate-500 uppercase text-right w-[110px]">
                        {po.documentType === 'delivery_order' ? 'Information' : 'Price'}
                      </th>
                      <th className="py-2.5 px-4 font-bold text-slate-500 uppercase text-right w-[130px]">
                        {po.documentType === 'delivery_order' ? 'Keterangan' : 'Total'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.items.map((item, index) => (
                      <tr 
                        key={item.id} 
                        className={`border-b border-slate-100 transition-colors ${
                          index % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                        }`}
                      >
                        <td className="py-3 px-4 text-slate-800 font-semibold leading-relaxed">
                          {item.description || "<i>[Nama barang kosong]</i>"}
                        </td>
                        <td className="py-3 px-3 text-slate-700 text-right font-mono">
                          {item.qty ? Number(item.qty).toLocaleString("id-ID") : 0}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-center uppercase">
                          {item.unit || "Pcs"}
                        </td>
                        <td className="py-3 px-3 text-slate-700 text-right font-mono">
                          {po.documentType === 'delivery_order' ? (item.information || "-") : formatIDR(item.price || 0)}
                        </td>
                        <td className="py-3 px-4 text-slate-800 text-right font-mono font-bold">
                          {po.documentType === 'delivery_order' ? (item.keterangan || "-") : formatIDR(item.qty * item.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTAL AMOUNT CONTAINER BOX (align right) */}
              {po.documentType !== 'delivery_order' && (
                <div className="flex justify-end pt-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-right max-w-xs w-full shadow-sm flex flex-col gap-1.5 text-xs font-sans">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Sub-Total:</span>
                      <span className="font-mono font-medium">{formatIDR(calculateSubtotal())}</span>
                    </div>

                    {po.ppnEnabled && (
                      <div className="flex justify-between items-center text-slate-500">
                        <span>PPN ({po.ppnPercent ?? 11}%):</span>
                        <span className="font-mono font-medium">{formatIDR(calculatePPN())}</span>
                      </div>
                    )}

                    <div className="border-t border-slate-200 my-1 pt-1.5 flex justify-between items-center font-bold text-slate-800">
                      <span className="text-[10px] tracking-wide uppercase font-extrabold text-[#0F5CA3]">Total Amount:</span>
                      <span className="font-mono text-lg text-[#1E40AF]">
                        {formatIDR(calculateTotal())}
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* LOWER TERMS NOTES AND SIGNATURE */}
            {po.documentType === 'delivery_order' ? (
              <div className="flex flex-col border-t border-slate-100 pt-8 mt-12 mb-8 pb-4 items-start w-full gap-8 break-inside-avoid avoid-break">
                {/* Note */}
                <div className="w-full space-y-3 font-normal">
                  <span className="text-[10px] font-extrabold text-[#1E40AF] tracking-wider block uppercase">Note:</span>
                  <div className="text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
                    {po.notes && po.notes.length > 0 ? (
                      po.notes.map((noteText, idx) => (
                        <div key={idx} className="flex flex-row items-start gap-2">
                          <span className="font-medium shrink-0 leading-[1.3] pt-0.5">{idx + 1}.</span>
                          <span className="leading-[1.3] pt-0.5">{noteText}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No notes provided.</span>
                    )}
                  </div>
                </div>

                {/* Signee */}
                <div className="w-full flex justify-between gap-4 mt-6">
                  {/* Column 1: BUYER */}
                  <div className="flex flex-col items-center text-center w-[30%]">
                    {/* Entity Name Header - fixed consistent height */}
                    <div className="h-10 flex items-center justify-center w-full">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide leading-tight">
                        {po.shipping.name || "BUYER"}
                      </span>
                    </div>
                    
                    {/* Spacer for manual signature (exactly aligned with the h-24 in Column 3) */}
                    <div className="h-24 w-full flex items-center justify-center">
                      {/* Empty space for manual signing */}
                    </div>

                    {/* Signee Line and Title */}
                    <div className="flex flex-col items-center justify-center px-2 w-full">
                      <span className="text-[11px] font-bold text-transparent select-none uppercase whitespace-nowrap pb-1">
                        [Manual Signee]
                      </span>
                      <div className="w-full max-w-[150px] border-b border-slate-800 mb-1"></div>
                      <span className="text-[9px] text-slate-500 uppercase font-medium">
                        AUTHORIZED SIGNATURE
                      </span>
                    </div>
                  </div>

                  {/* Column 2: SHIPPING DEPARTMENT */}
                  <div className="flex flex-col items-center text-center w-[30%]">
                    {/* Entity Name Header - fixed consistent height */}
                    <div className="h-10 flex items-center justify-center w-full">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide leading-tight">
                        SHIPPING DEPARTMENT
                      </span>
                    </div>
                    
                    {/* Spacer for manual signature (exactly aligned with the h-24 in Column 3) */}
                    <div className="h-24 w-full flex items-center justify-center">
                      {/* Empty space for manual signing */}
                    </div>

                    {/* Signee Line and Title */}
                    <div className="flex flex-col items-center justify-center px-2 w-full">
                      <span className="text-[11px] font-bold text-transparent select-none uppercase whitespace-nowrap pb-1">
                        [Manual Signee]
                      </span>
                      <div className="w-full max-w-[150px] border-b border-slate-800 mb-1"></div>
                      <span className="text-[9px] text-slate-500 uppercase font-medium">
                        AUTHORIZED SIGNATURE
                      </span>
                    </div>
                  </div>

                  {/* Column 3: PT INFINITAS DIGITAL SOLUSI */}
                  <div className="flex flex-col items-center text-center w-[30%]">
                    {/* Entity Name Header - fixed consistent height */}
                    <div className="h-10 flex items-center justify-center w-full">
                      <span className="text-[10px] font-bold text-[#1E40AF] uppercase tracking-wide leading-tight">
                        {po.signee.company || po.vendor.name || "COMPANY"}
                      </span>
                    </div>
                    
                    {/* Active Digital Signature & Stamp Container */}
                    <div className="relative h-24 flex justify-center items-center select-none w-full">
                      <div className="absolute z-10 flex items-center justify-center">
                        {(po.signatureType || "generated") === "generated" ? (
                          <span 
                            className={`text-2xl text-[#1E40AF] select-none text-center ${
                              po.signatureFont === "alex" 
                                ? "font-[--font-alex]" 
                                : po.signatureFont === "caveat" 
                                  ? "font-[--font-caveat]" 
                                  : "font-[--font-satisfy]"
                            }`}
                          >
                            {po.signatureText || po.signee.name || "Aditia Alamsyah"}
                          </span>
                        ) : (po.signatureType || "generated") === "uploaded" && po.signatureImage ? (
                          <img 
                            src={po.signatureImage} 
                            alt="Signature TTD" 
                            className="select-none mix-blend-multiply" 
                            style={{ maxWidth: '120px', maxHeight: '64px', width: 'auto', height: 'auto' }}
                          />
                        ) : (
                          <div className="w-24 border-b border-dashed border-slate-200 py-4 text-[9px] text-slate-350 italic">Signed Digitally</div>
                        )}
                      </div>
                      
                      <div className="absolute z-20 pointer-events-none select-none flex items-center justify-center translate-y-2 translate-x-2">
                        {(po.stampType || "generated") === "generated" ? (
                          <CorporateStamp 
                            mainText={po.stampTextMain ?? "PT INFINITAS DIGITAL SOLUSI"} 
                            subText={po.stampTextSub ?? "APPROVED"} 
                            color={po.stampColor ?? "#059669"} 
                            angle={po.stampAngle ?? -6} 
                            size={po.stampSize ? po.stampSize * 0.72 : 72}
                          />
                        ) : (
                          po.stampImage && (
                            <img 
                              src={po.stampImage} 
                              alt="Stamp Cap" 
                              className="select-none mix-blend-multiply"
                              style={{ 
                                transform: `rotate(${po.stampAngle ?? -6}deg)`,
                                maxWidth: `${po.stampSize ? po.stampSize * 0.72 : 80}px`,
                                maxHeight: `${po.stampSize ? po.stampSize * 0.72 : 80}px`,
                                width: 'auto',
                                height: 'auto'
                              }}
                            />
                          )
                        )}
                      </div>
                    </div>

                    {/* Signee Name and Role Footer */}
                    <div className="flex flex-col items-center justify-center px-2 w-full">
                      <span className="text-[11px] font-black text-slate-900 uppercase whitespace-nowrap pb-1">
                        {po.signee.name || "-"}
                      </span>
                      <div className="w-full max-w-[150px] border-b border-slate-800 mb-1"></div>
                      <span className="text-[9px] text-slate-500 uppercase font-medium">
                        {po.signee.title || "VP BUSINESS & FINANCE"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-row border-t border-slate-100 pt-8 mt-12 mb-8 pb-4 items-start w-full gap-6 break-inside-avoid avoid-break">
                {/* Note / Bank Info */}
                <div className="w-[55%] space-y-3 font-normal pr-4">
                  {po.documentType === 'invoice' ? (
                    <>
                      <span className="text-[10px] font-extrabold text-[#1E40AF] tracking-wider block uppercase">Rekening Pembayaran:</span>
                      <div className="text-xs text-slate-700 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100">
                        <table className="w-full">
                          <tbody>
                            <tr>
                              <td className="py-1.5 w-28 text-slate-500 text-[11px] font-semibold">Nama Bank</td>
                              <td className="py-1.5 font-bold text-slate-800">{po.bankDetails?.bankName || "-"}</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 text-slate-500 text-[11px] font-semibold">Nomor Rekening</td>
                              <td className="py-1.5 font-mono font-bold text-slate-900 text-sm tracking-wide bg-white px-2 py-0.5 rounded inline-block border border-slate-200">{po.bankDetails?.accountNumber || "-"}</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 text-slate-500 text-[11px] font-semibold">Nama Rekening</td>
                              <td className="py-1.5 font-bold text-slate-800 uppercase">{po.bankDetails?.accountName || "-"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block uppercase">Note / Terms:</span>
                      <div className="text-[11px] text-slate-500 space-y-1.5 leading-relaxed">
                        {po.notes.map((noteLine, idx) => (
                          <div key={idx} className="flex flex-row items-start gap-2">
                            <span className="font-medium shrink-0 leading-[1.3] pt-0.5">{idx + 1}.</span>
                            <span className="leading-[1.3] pt-0.5">{noteLine}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Signee */}
                <div className="w-[45%] text-center flex flex-col justify-between h-full min-h-[160px]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Authorized Signature</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1 uppercase">{po.signee.company || "PT INFINITAS DIGITAL SOLUSI"}</span>
                  </div>

                  {/* Overlapping Realistic Signature & Stamp Container */}
                  <div className="relative h-28 flex justify-center items-center select-none pt-2">
                    
                    {/* Signature Layer */}
                    <div className="absolute z-10 flex items-center justify-center">
                      {(po.signatureType || "generated") === "generated" ? (
                        <span 
                          className={`text-3.5xl text-[#1E40AF] select-none text-center ${
                            po.signatureFont === "alex" 
                              ? "font-[--font-alex]" 
                              : po.signatureFont === "caveat" 
                                ? "font-[--font-caveat]" 
                                : "font-[--font-satisfy]"
                          }`}
                        >
                          {po.signatureText || po.signee.name || "Aditia Alamsyah"}
                        </span>
                      ) : (po.signatureType || "generated") === "uploaded" && po.signatureImage ? (
                        <img 
                          src={po.signatureImage} 
                          alt="Signature TTD" 
                          className="select-none mix-blend-multiply" 
                          style={{ maxWidth: '144px', maxHeight: '80px', width: 'auto', height: 'auto' }}
                        />
                      ) : (
                        <div className="w-28 border-b border-dashed border-slate-200 py-6 text-[10px] text-slate-350 italic">Signed Digitally</div>
                      )}
                    </div>

                    {/* Stamp Seal Layer */}
                    {(po.stampType || "generated") !== "blank" && (
                      <div className="absolute z-20 pointer-events-none select-none flex items-center justify-center">
                        {(po.stampType || "generated") === "generated" ? (
                          <CorporateStamp 
                            mainText={po.stampTextMain ?? "PT INFINITAS DIGITAL SOLUSI"} 
                            subText={po.stampTextSub ?? "APPROVED"} 
                            color={po.stampColor ?? "#0F5CA3"} 
                            angle={po.stampAngle ?? -6} 
                            size={po.stampSize ?? 90}
                          />
                        ) : (
                          po.stampImage && (
                            <img 
                              src={po.stampImage} 
                              alt="Stamp Cap" 
                              className="select-none mix-blend-multiply"
                              style={{ 
                                transform: `rotate(${po.stampAngle ?? -6}deg)`,
                                maxWidth: `${po.stampSize ?? 120}px`,
                                maxHeight: `${po.stampSize ?? 120}px`,
                                width: 'auto',
                                height: 'auto'
                              }}
                            />
                          )
                        )}
                      </div>
                    )}

                    {/* Stamp Indicator watermark if everything is blank */}
                    {((po.signatureType || "generated") === "blank" && (po.stampType || "generated") === "blank") && (
                      <div className="w-24 h-24 border border-dashed border-slate-250 rounded-full flex flex-col justify-center items-center text-[8px] text-slate-400 italic font-medium uppercase">
                        <span>STAMP & TTD</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center pt-2 px-4 pb-4">
                    <span className="text-xs font-bold text-slate-900 uppercase whitespace-nowrap pb-1">
                      {po.signee.name || "-"}
                    </span>
                    <div className="w-full max-w-[220px] border-b border-slate-800 mb-1.5"></div>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">
                      {po.signee.title || "Direktur"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            </div>

          {/* Live Document Canvas (Page 2: Appendix) */}
          {po.appendixEnabled && (
            <div 
              id="printable-appendix-document" 
              className={`bg-white justify-between break-before-page relative shrink-0 flex flex-col w-[794px] min-h-[1120px] p-8 ${
                isExportingPDF 
                  ? "border-none shadow-none rounded-none" 
                  : "shadow-lg rounded-xl border border-slate-200"
              }`}
            >
              <div className="space-y-6">
                {/* BRAND HEADER BAR FOR PAGE 2 */}
                <div className="flex justify-between items-center border-b border-indigo-50/50 pb-6">
                  
                  {/* Brand Visual logo matching indilus / kustom with brand name text */}
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0 flex items-center justify-center">
                      {po.logoType === "uploaded" && po.logoImage ? (
                        <img 
                          src={po.logoImage} 
                          alt={po.company.brand} 
                          className="max-w-[200px] max-h-16 w-auto object-contain" 
                        />
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0 flex items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <svg className="w-12 h-12" viewBox="0 0 100 50">
                              <path 
                                d="M25,25 C25,35 35,42 45,35 C55,28 65,15 75,25 C85,35 75,42 65,35 C55,28 45,15 25,25 Z" 
                                fill="none" 
                                stroke="#0F5CA3" 
                                strokeWidth="8" 
                                strokeLinecap="round"
                              />
                              <circle cx="21" cy="24" r="5" fill="#38BDF8" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-900 leading-tight tracking-tight uppercase">
                              {po.company.name || "PT INFINITAS DIGITAL SOLUSI"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                              {po.company.subTitle || "INFINITAS DIGITAL SOLUSI"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right text details */}
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      PO Appendix / Lampiran
                    </span>
                    <span className="text-xs font-black font-mono text-slate-800 block mt-0.5">
                      {po.metadata.poNumber || "-"}
                    </span>
                  </div>
                </div>

                {/* TITLE & HEADER */}
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#0F5CA3] tracking-wider uppercase">
                    {po.appendixTitle || "LAMPIRAN SPESIFIKASI TEKNIS & KLAUSUL"}
                  </h3>
                  <div className="h-0.5 bg-[#0F5CA3] w-24 rounded-full" />
                </div>

                {/* APPENDIX CLAUSES LIST */}
                <div className="space-y-5 pt-3">
                  {(po.appendixItems || []).map((item, idx) => (
                    <div key={item.id} className="space-y-1.5 pl-4 border-l-2 border-[#0F5CA3] py-0.5 avoid-break break-inside-avoid">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">
                        {item.content}
                      </p>
                      {item.imageUrl && (
                        <div className="pt-2 pb-1">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title}
                            className="max-h-64 object-contain rounded border border-slate-200" 
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {(po.appendixItems || []).length === 0 && (
                    <div className="text-center py-16 text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-xl">
                      Belum ada Klausul Lampiran yang ditambahkan. Silakan tambahkan pada Tab "Lampiran".
                    </div>
                  )}
                </div>

              </div>

              {/* FOOTER BLOCK WITHOUT SIGNATURE */}
              <div className="border-t border-slate-100 pt-4 mt-8 flex justify-between items-center text-[10px] text-slate-400 font-sans">
                <div>
                  Halaman 2 dari 2 — Lampiran Resmi Purchase Order
                </div>
                <div className="text-right">
                  Dokumen Lampiran Teknis
                </div>
              </div>
            </div>
          )}

          </div>

        </div>

      </div>

      {/* Modal Pratinjau PDF - 100% Reliable & Sandbox-safe Interactive Overlay */}
      <AnimatePresence>
        {previewPdfBlobUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            {/* Backdrop opacity fade */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                URL.revokeObjectURL(previewPdfBlobUrl);
                setPreviewPdfBlobUrl(null);
              }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
            />
            {/* Modal Content slide up */}
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col relative z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-slate-150 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{po.documentType === 'invoice' ? 'Pratinjau Cetak PDF Invoice' : 'Pratinjau Cetak PDF Purchase Order'}</span>
                      <span className="hidden sm:inline bg-sky-100 text-sky-800 text-[9px] px-2 py-0.5 rounded-full uppercase font-black">PREVIEW</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Berisi detail dokumen siap cetak sesuai ukuran asli A4 secara presisi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = previewPdfBlobUrl;
                      const cleanFileName = `PurchaseOrder_${po.metadata.poNumber || "Doc"}_${po.vendor.name || "Vendor"}.pdf`
                        .replace(/[/\\?%*:|"<>]/g, "_")
                        .replace(/\s+/g, "_");
                      link.download = cleanFileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 hover:shadow-xs active:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 border border-indigo-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(previewPdfBlobUrl);
                      setPreviewPdfBlobUrl(null);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
              {/* Iframe dynamic container */}
              <div className="flex-1 bg-slate-100 p-2 sm:p-4 flex justify-center items-center relative overflow-hidden">
                <iframe 
                  src={previewPdfBlobUrl} 
                  className="w-full h-full rounded-xl border border-slate-200 bg-white" 
                  title="PDF Document Live Preview"
                />
                {/* Visual indicator bar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] px-3 py-1.5 rounded-full shadow pointer-events-none select-none flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Gunakan kendali peramban Anda untuk mencetak / mengunduh dokumen secara langsung.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

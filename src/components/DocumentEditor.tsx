import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { saveDocument, getDocument, getCompanies, getContacts, getProducts, getDocuments } from "../dbService";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Trash, 
  FileText, 
  CheckCircle, 
  Edit3, 
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
  Eye,
  Receipt,
  Truck,
  Lock,
  Package,
  ShoppingCart,
  Search,
  Building,
  AlertCircle
} from "lucide-react";
import { PurchaseOrder, POItem, BankDetails, DatabaseCompany, Product } from "../types";
import { defaultPurchaseOrder } from "../defaultData";
import { generateExcelPO } from "../excelGenerator";
import { createGoogleSheetsPO } from "../googleSheetsExport";
import { useCompany } from "../CompanyContext";

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
  const finalSize = size || 145;
  const scale = finalSize / 145;
  // Indonesian style: rounded double-ring stamp
  return (
    <div 
      className="relative flex items-center justify-center shrink-0 pointer-events-none select-none printable-stamp origin-center"
      style={{ 
        transform: `rotate(${angle || 0}deg) scale(${scale})`, 
        color: color || "#059669",
        opacity: 0.88,
        width: "145px",
        height: "145px"
      }}
    >
      {/* Circle double border */}
      <div 
        className="absolute inset-0 rounded-full border-[3.8px] flex items-center justify-center"
        style={{ borderColor: "currentColor" }}
      >
        <div 
          className="absolute inset-[4.5px] rounded-full border border-dashed flex items-center justify-center"
          style={{ borderColor: "currentColor" }}
        />
      </div>

      {/* Outer Curved Text on circle path */}
      <svg className="absolute inset-0 w-full h-full rotate-[-91deg]">
        <path id="stamp-text-path-id" d="M 67.5,14 A 53.5,53.5 0 1,1 67.4,14" fill="none" />
        <text className="text-[10px] font-black uppercase tracking-wider fill-current" letterSpacing="1.2">
          <textPath href="#stamp-text-path-id" startOffset="50%" textAnchor="middle">
            {mainText ? mainText.substring(0, 42) : "PT INFINITAS DIGITAL SOLUSI"}
          </textPath>
        </text>
      </svg>

      {/* Center status layout with star dividers */}
      <div 
        className="absolute inset-[20px] rounded-full border border-double flex flex-col items-center justify-center text-center font-bold" 
        style={{ borderColor: "currentColor" }}
      >
        <span className="text-[8px] tracking-widest leading-none">★</span>
        <span className="text-[14px] font-black tracking-widest uppercase leading-none my-0.5">{subText || "APPROVED"}</span>
        <span className="text-[8px] tracking-widest leading-none">★</span>
      </div>
    </div>
  );
}

export default function DocumentEditor() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { activeCompany, companies } = useCompany();

  // State for Purchase Order Data
  const [po, setPo] = useState<PurchaseOrder>(defaultPurchaseOrder);
  const [availableCompanies, setAvailableCompanies] = useState<DatabaseCompany[]>([]);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Draft");
  const [existingPOs, setExistingPOs] = useState<any[]>([]);
  const [poInputMode, setPoInputMode] = useState<"select" | "manual">("select");
  const [existingDOs, setExistingDOs] = useState<any[]>([]);
  const [doInputMode, setDoInputMode] = useState<"select" | "manual">("select");
  
  useEffect(() => {
    if (companies.length > 0) {
      setAvailableCompanies(companies as DatabaseCompany[]);
    }
    const fetchAuxData = async () => {
      const contactsRes = await getContacts();
      setAvailableContacts(contactsRes);
      const productsRes = await getProducts();
      setAvailableProducts(productsRes as any);
      try {
        const poRes = await getDocuments("purchase_orders");
        setExistingPOs(poRes);
      } catch (err) {
        console.error("Gagal memuat list PO: ", err);
      }
      try {
        const doRes = await getDocuments("delivery_orders");
        setExistingDOs(doRes);
      } catch (err) {
        console.error("Gagal memuat list DO: ", err);
      }
    };
    fetchAuxData();
  }, [companies]);

  useEffect(() => {
    if (activeCompany && companies.length > 0) {
       // Auto-sync whenever activeCompany is set or changed.
       // We only want this to run when specifically intended, 
       // but for "locked" experience we ensure the selected ID is correct.
       if (selectedCompanyId !== activeCompany.id) {
           setSelectedCompanyId(activeCompany.id || "");
           handleCompanySelect(activeCompany.id || "");
       }
    }
  }, [activeCompany?.id, companies.length]);

  useEffect(() => {
    const loadSelections = async () => {
       const conts = await getContacts();
       setAvailableContacts(conts);
    };
    loadSelections();
  }, []);

  useEffect(() => {
    if (po.metadata?.poNumber && existingPOs.length > 0) {
      const match = existingPOs.some(item => item.data?.metadata?.poNumber === po.metadata.poNumber);
      if (match) {
        setPoInputMode("select");
      } else {
        setPoInputMode("manual");
      }
    } else if (existingPOs.length > 0) {
      setPoInputMode("select");
    } else {
      setPoInputMode("manual");
    }
  }, [id, existingPOs.length]);

  useEffect(() => {
    if (po.metadata?.deliveryOrderNumber && existingDOs.length > 0) {
      const match = existingDOs.some(item => item.data?.metadata?.deliveryOrderNumber === po.metadata.deliveryOrderNumber);
      if (match) {
        setDoInputMode("select");
      } else {
        setDoInputMode("manual");
      }
    } else if (existingDOs.length > 0) {
      setDoInputMode("select");
    } else {
      setDoInputMode("manual");
    }
  }, [id, existingDOs.length]);
  
  useEffect(() => {
    if (id && id !== "new") {
       const collectionName = type === 'invoice' ? 'invoices' : type === 'po' ? 'purchase_orders' : 'delivery_orders';
       getDocument(collectionName, id).then(doc => {
           if (doc) {
              const d = doc as any;
              setPo({ ...defaultPurchaseOrder, ...d.data } as PurchaseOrder);
              if (d.status) setSelectedStatus(d.status);
              if (d.companyId) setSelectedCompanyId(d.companyId);
           }
       });
    } else {
       // Reset or load from localstorage
       const saved = localStorage.getItem("po_document_draft_v1");
       let initialPo: PurchaseOrder = { ...defaultPurchaseOrder, documentType: type as any };

       if (saved) {
         try {
           const parsed = JSON.parse(saved);
           if (parsed.documentType === type || (!parsed.documentType && type === 'po')) {
             initialPo = parsed;
           }
         } catch (e) {}
       }

       // Sync from activeCompany if it exists (for new documents)
       if (activeCompany) {
           const company = (companies as DatabaseCompany[]).find(c => c.id === activeCompany.id);
           if (company) {
               setSelectedCompanyId(activeCompany.id || "");
               
               // Resolve authorities based on document type
               const docType = type || initialPo.documentType || 'po';
               const auth = docType === 'invoice' ? {
                   name: company.invoice_auth_name || company.authority_name,
                   title: company.invoice_auth_position || company.authority_position,
                   signature: company.invoice_auth_signature || company.authority_signature,
                   phone: company.invoice_auth_phone || company.phone
               } : docType === 'delivery_order' ? {
                   name: company.do_auth_name || company.authority_name,
                   title: company.do_auth_position || company.authority_position,
                   signature: company.do_auth_signature || company.authority_signature,
                   phone: company.do_auth_phone || company.phone
               } : { // po
                   name: company.po_auth_name || company.authority_name,
                   title: company.po_auth_position || company.authority_position,
                   signature: company.po_auth_signature || company.authority_signature,
                   phone: company.po_auth_phone || company.phone
               };

               initialPo = {
                   ...initialPo,
                   company: {
                       name: company.legal_name || company.company_name,
                       brand: company.company_name,
                       subTitle: company.address || company.legal_name || "",
                       npwp: company.npwp,
                       attn: auth.name,
                       phone: auth.phone
                   },
                   signee: {
                       ...initialPo.signee,
                       company: company.legal_name || company.company_name,
                       name: auth.name || initialPo.signee.name,
                       title: auth.title || initialPo.signee.title
                   },
                   bankDetails: (company.bank_name || company.bank_account || company.bank_account_name) ? {
                       bankName: company.bank_name || "",
                       accountNumber: company.bank_account || "",
                       accountName: company.bank_account_name || company.legal_name || company.company_name
                   } : (company.bank_info ? {
                       bankName: company.bank_info.split(' ')[0] || company.bank_info,
                       accountNumber: (company.bank_info.match(/\d+/) || [""])[0],
                       accountName: company.legal_name || company.company_name
                   } : initialPo.bankDetails),
                   stampTextMain: company.legal_name || company.company_name,
                   logoType: company.logo ? "uploaded" : "default",
                   logoImage: company.logo || initialPo.logoImage,
                   signatureType: auth.signature ? "uploaded" : "generated",
                   signatureImage: auth.signature || initialPo.signatureImage,
                   stampType: company.company_stamp ? "uploaded" : "generated",
                   stampImage: company.company_stamp || initialPo.stampImage
               };
           }
       }
       setPo(initialPo);
    }
  }, [id, type]);

  const handleSaveToDB = async () => {
     try {
         setIsExporting(true);
         const collectionName = type === 'invoice' ? 'invoices' : type === 'po' ? 'purchase_orders' : 'delivery_orders';
         const currentId = id === "new" ? undefined : id;
         const newId = await saveDocument(collectionName, { 
             type, 
             data: po, 
             status: selectedStatus, 
             companyId: selectedCompanyId || activeCompany?.id,
             updatedAt: new Date().toISOString()
         }, currentId);
         toast.success("Document saved successfully!");
         if (id === "new") {
            navigate(`/documents/${type}/${newId}`, { replace: true });
         }
     } catch (e) {
         console.error(e);
         toast.error("Failed to save document.");
     } finally {
         setIsExporting(false);
     }
  };

  const handleCompanySelect = (compId: string) => {
      setSelectedCompanyId(compId);
      const company = companies.find(c => c.id === compId);
      if (company) {
          const docType = po.documentType || type || 'po';
          const auth = docType === 'invoice' ? {
              name: company.invoice_auth_name || company.authority_name,
              title: company.invoice_auth_position || company.authority_position,
              signature: company.invoice_auth_signature || company.authority_signature,
              phone: company.invoice_auth_phone || company.phone
          } : docType === 'delivery_order' ? {
              name: company.do_auth_name || company.authority_name,
              title: company.do_auth_position || company.authority_position,
              signature: company.do_auth_signature || company.authority_signature,
              phone: company.do_auth_phone || company.phone
          } : { // po
              name: company.po_auth_name || company.authority_name,
              title: company.po_auth_position || company.authority_position,
              signature: company.po_auth_signature || company.authority_signature,
              phone: company.po_auth_phone || company.phone
          };

          setPo(prev => ({
              ...prev,
              company: {
                  name: company.legal_name || company.company_name,
                  brand: company.company_name,
                  subTitle: company.address || company.legal_name || "",
                  npwp: company.npwp,
                  attn: auth.name,
                  phone: auth.phone
              },
              signee: {
                  ...prev.signee,
                  company: company.legal_name || company.company_name,
                  name: auth.name || prev.signee.name,
                  title: auth.title || prev.signee.title
              },
              bankDetails: (company.bank_name || company.bank_account || company.bank_account_name) ? {
                  bankName: company.bank_name || "",
                  accountNumber: company.bank_account || "",
                  accountName: company.bank_account_name || company.legal_name || company.company_name
              } : (company.bank_info ? {
                  bankName: company.bank_info.split(' ')[0] || company.bank_info,
                  accountNumber: (company.bank_info.match(/\d+/) || [""])[0],
                  accountName: company.legal_name || company.company_name
              } : prev.bankDetails),
              stampTextMain: company.legal_name || company.company_name,
              logoType: company.logo ? "uploaded" : "default",
              logoImage: company.logo || prev.logoImage,
              signatureType: auth.signature ? "uploaded" : "generated",
              signatureImage: auth.signature || prev.signatureImage,
              stampType: company.company_stamp ? "uploaded" : "generated",
              stampImage: company.company_stamp || prev.stampImage
          }));
      }
  };

  const handleContactSelect = (contactId: string, target: "vendor" | "shipping") => {
      const contact = availableContacts.find(c => c.id === contactId);
      if (contact) {
          setPo(prev => ({
              ...prev,
              [target]: {
                  name: contact.company_name,
                  address: contact.address || "",
                  attn: contact.pic_name || "",
                  phone: contact.phone || "",
                  npwp: contact.npwp || ""
              }
          }));
      }
  };

  const handleProductSelect = (productId: string, itemIdx: number) => {
      const product = availableProducts.find(p => p.id === productId);
      if (product) {
          const updatedItems = [...po.items];
          updatedItems[itemIdx] = {
              ...updatedItems[itemIdx],
              description: product.name,
              unit: product.unit,
              price: product.price
          };
          setPo(prev => ({ ...prev, items: updatedItems }));
          toast.success(`Berhasil memuat data produk: ${product.name}`);
      }
  };

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
  const [previewZoom, setPreviewZoom] = useState<number>(80);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  const docType = (type as any) || po.documentType || 'po';
  const getTheme = () => {
    const baseColor = activeCompany?.themeColor || 'primary';
    
    // Support custom hex codes
    if (baseColor.startsWith('#')) {
      return {
        primary: 'custom',
        bg: 'bg-primary',
        hover: 'hover:bg-primary/90',
        lightBg: 'bg-primary/5',
        lightText: 'text-primary',
        border: 'border-primary/20',
        accent: 'custom',
        hex: baseColor,
        isCustom: true,
        title: themeLabel('title'),
        label: themeLabel('label')
      };
    }

    function themeLabel(kind: 'title' | 'label') {
      if (kind === 'title') return docType === 'invoice' ? 'Invoice Editor' : docType === 'delivery_order' ? 'DO Editor' : 'PO Editor';
      return docType === 'invoice' ? 'INVOICE' : docType === 'delivery_order' ? 'DELIVERY ORDER' : 'PURCHASE ORDER';
    }

    // Default to 'primary' brand color if anything else is requested (to enforce brand consistency)
    return {
      primary: 'primary',
      bg: 'bg-primary',
      hover: 'hover:bg-primary/90',
      lightBg: 'bg-primary/5',
      lightText: 'text-primary',
      border: 'border-primary/20',
      accent: 'primary',
      title: docType === 'invoice' ? 'Invoice Editor' : docType === 'delivery_order' ? 'DO Editor' : 'PO Editor',
      label: docType === 'invoice' ? 'INVOICE' : docType === 'delivery_order' ? 'DELIVERY ORDER' : 'PURCHASE ORDER'
    };
  };
  const theme = getTheme();

  const isInvoice = type === 'invoice';
  const isDO = type === 'delivery_order';
  const isPO = type === 'po';

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
      <header className="sticky top-0 bg-white border-b border-slate-200 z-30 px-6 py-4 flex flex-col sm:flex-row justify-end items-center gap-4">

        {/* Master Actions */}
        <div className="flex flex-nowrap items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {/* Save DB */}
          <button 
            onClick={handleSaveToDB}
            disabled={isExporting}
            className={`flex items-center gap-2 text-sm font-semibold border text-white px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shrink-0 ${!theme.isCustom ? `${theme.bg} border-${theme.primary}-700 hover:${theme.hover}` : ''}`}
            style={{ 
              backgroundColor: theme.isCustom ? theme.hex : undefined,
              borderColor: theme.isCustom ? theme.hex : undefined 
            }}
          >
            <CheckCircle className={`w-4 h-4 text-white ${isExporting ? "animate-pulse" : ""}`} />
            <span>{isExporting ? "Menyimpan..." : "Simpan DB"}</span>
          </button>

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

      {/* Mobile Mode Switcher (Tab segmented control) */}
      <div className="lg:hidden px-6 pt-4 shrink-0">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex border border-slate-200/60 shadow-xs">
          <button 
            type="button"
            onClick={() => setViewMode("edit")}
            className={`flex-1 py-3 text-center rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'edit' 
                ? 'bg-white text-slate-800 shadow-md border border-slate-200/20' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            <Edit3 size={14} className={viewMode === 'edit' ? 'text-indigo-600' : ''} strokeWidth={2.5} />
            Isi / Edit Data
          </button>
          <button 
            type="button"
            onClick={() => {
              setViewMode("preview");
              // Set zoom to 50% on mobile so they can see the layout properly
              if (previewZoom > 60) setPreviewZoom(50);
            }}
            className={`flex-1 py-3 text-center rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'preview' 
                ? 'bg-white text-indigo-700 shadow-md border border-slate-200/20' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            <Eye size={14} className={viewMode === 'preview' ? 'text-indigo-600' : ''} strokeWidth={2.5} />
            Lihat Pratinjau ({previewZoom}%)
          </button>
        </div>
      </div>

      {/* Main body: Split screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        
        {/* Left pane: Forms controls / Settings (Lg: 5 columns) */}
        <div className={`lg:col-span-5 min-w-0 space-y-6 flex flex-col ${viewMode === 'edit' ? 'block' : 'hidden lg:flex'}`}>
          {/* Standard Form Editor Panels container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            
            {/* Document Meta Selection (Company) */}
            <div className={`p-4 border-b border-slate-100 ${theme.lightBg}/30 space-y-4`}>
                <div className="w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Company Profile (Issuer)</label>
                    {activeCompany ? (
                        <div className="flex flex-col gap-1.5">
                            <div 
                                className={`w-full bg-white border rounded-lg px-3 py-2 text-sm font-bold flex items-center justify-between shadow-sm`}
                                style={{ 
                                    borderColor: theme.isCustom ? theme.hex + '66' : '',
                                    color: theme.isCustom ? theme.hex : ''
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                                        style={{ 
                                            backgroundColor: theme.isCustom ? theme.hex : '',
                                            boxShadow: theme.isCustom ? `0 0 8px ${theme.hex}` : ''
                                        }}
                                    ></div>
                                    <span>{activeCompany.company_name}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full tracking-tighter">LOCKED & SYNCED</span>
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                </div>
                            </div>
                            <p className="text-[8px] text-slate-400 font-bold uppercase italic tracking-tighter text-right">Aset tersinkronisasi otomatis dari database</p>
                        </div>
                    ) : (
                        <select 
                            value={selectedCompanyId} 
                            onChange={(e) => handleCompanySelect(e.target.value)}
                            className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-${theme.primary}-500/20 focus:border-${theme.primary}-500 transition-all outline-none`}
                        >
                            <option value="">Select Company...</option>
                            {availableCompanies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                        </select>
                    )}
                    {activeCompany && <p className="text-[9px] text-slate-400 mt-1 italic leading-tight">Berubah otomatis via Sidebar</p>}
                </div>
            </div>

            {/* Document Type Info (Locked by URL) */}
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <span className={`text-[10px] font-black text-${theme.primary}-700 tracking-widest uppercase flex items-center gap-2`}>
                <div className={`w-1.5 h-1.5 rounded-full ${theme.bg}`}></div>
                Konfigurasi {theme.label}
              </span>
              <div className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${theme.bg} text-white shadow-xs`}>
                 LOCKED: {theme.label}
              </div>
            </div>

            {/* Tab Swappers */}
            <div className="flex overflow-x-auto lg:grid lg:grid-cols-6 border-b border-slate-100 bg-slate-50/40 p-1.5 gap-1.5 scrollbar-none snap-x">
              {[
                { id: "details", label: "Metadata", icon: FileText },
                { id: "addresses", label: "Kontak", icon: MapPin },
                { id: "items", label: "Barang", icon: FileSpreadsheet },
                { id: "notes", label: "Tambahan", icon: Info },
                { id: "appendix", label: "Lampiran", icon: Paperclip },
                { id: "signature", label: "Logo/TTD", icon: PenTool }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-2.5 lg:py-3 text-[11px] lg:text-[9.5px] font-extrabold rounded-xl transition-all cursor-pointer shrink-0 min-w-[85px] lg:min-w-0 snap-center ${
                      isActive 
                        ? `bg-white text-${theme.primary}-600 shadow-md shadow-slate-200/55 border border-slate-200/40` 
                        : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? `text-${theme.primary}-600` : "text-slate-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="tracking-tight">{tab.label}</span>
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
                  <h3 className={`text-sm font-bold text-slate-800 border-l-4 border-${theme.primary}-500 pl-2`}>
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
                            className={`w-full px-3.5 py-2 border border-slate-200 focus:border-${theme.primary}-500 rounded-xl text-xs focus:ring-1 focus:ring-${theme.primary}-500 outline-none transition-all`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Tanggal Terbit (Date)</label>
                          <input 
                            type="date" 
                            value={po.metadata.issueDate}
                            onChange={(e) => handleMetaChange("issueDate", e.target.value)}
                            className={`w-full px-3.5 py-2 border border-slate-200 focus:border-${theme.primary}-500 rounded-xl text-xs focus:ring-1 focus:ring-${theme.primary}-500 outline-none transition-all`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Nomor PO (Opsional)</label>
                            {po.documentType !== "invoice" && existingPOs.filter(item => {
                              const targetCompId = selectedCompanyId || activeCompany?.id;
                              return !targetCompId || item.companyId === targetCompId;
                            }).length > 0 && (
                              <button
                                type="button"
                                onClick={() => setPoInputMode(poInputMode === "select" ? "manual" : "select")}
                                className={`text-[10px] font-black uppercase tracking-wider text-${theme.primary}-600 hover:underline cursor-pointer`}
                              >
                                {poInputMode === "select" ? "Ketik Manual" : "Pilih PO Terdaftar"}
                              </button>
                            )}
                          </div>
                          {po.documentType !== "invoice" && poInputMode === "select" && existingPOs.filter(item => {
                            const targetCompId = selectedCompanyId || activeCompany?.id;
                            return !targetCompId || item.companyId === targetCompId;
                          }).length > 0 ? (
                            <select
                              value={po.metadata.poNumber || ""}
                              onChange={(e) => handleMetaChange("poNumber", e.target.value)}
                              className={`w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-${theme.primary}-500 rounded-xl text-xs focus:ring-1 focus:ring-${theme.primary}-500 outline-none transition-all`}
                            >
                              <option value="">-- Pilih Nomor PO --</option>
                              {existingPOs.filter(item => {
                                const targetCompId = selectedCompanyId || activeCompany?.id;
                                return !targetCompId || item.companyId === targetCompId;
                              }).map((p) => {
                                const num = p.data?.metadata?.poNumber;
                                if (!num) return null;
                                return (
                                  <option key={p.id} value={num}>
                                    {num} ({p.data?.vendor?.name || p.data?.client?.name || "Tanpa Rekanan"})
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              value={po.metadata.poNumber || ""}
                              onChange={(e) => handleMetaChange("poNumber", e.target.value)}
                              placeholder="Ketik nomor PO..."
                              className={`w-full px-3.5 py-2 border border-slate-200 focus:border-${theme.primary}-500 rounded-xl text-xs focus:ring-1 focus:ring-${theme.primary}-500 outline-none transition-all`}
                            />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Nomor DO (Opsional)</label>
                            {existingDOs.filter(item => {
                              const targetCompId = selectedCompanyId || activeCompany?.id;
                              return !targetCompId || item.companyId === targetCompId;
                            }).length > 0 && (
                              <button
                                type="button"
                                onClick={() => setDoInputMode(doInputMode === "select" ? "manual" : "select")}
                                className={`text-[10px] font-black uppercase tracking-wider text-${theme.primary}-600 hover:underline cursor-pointer`}
                              >
                                {doInputMode === "select" ? "Ketik Manual" : "Pilih DO Terdaftar"}
                              </button>
                            )}
                          </div>
                          {doInputMode === "select" && existingDOs.filter(item => {
                            const targetCompId = selectedCompanyId || activeCompany?.id;
                            return !targetCompId || item.companyId === targetCompId;
                          }).length > 0 ? (
                            <select
                              value={po.metadata.deliveryOrderNumber || ""}
                              onChange={(e) => handleMetaChange("deliveryOrderNumber", e.target.value)}
                              className={`w-full px-3.5 py-2 bg-white border border-slate-200 focus:border-${theme.primary}-500 rounded-xl text-xs focus:ring-1 focus:ring-${theme.primary}-500 outline-none transition-all`}
                            >
                              <option value="">-- Pilih Nomor DO --</option>
                              {existingDOs.filter(item => {
                                const targetCompId = selectedCompanyId || activeCompany?.id;
                                return !targetCompId || item.companyId === targetCompId;
                              }).map((p) => {
                                const num = p.data?.metadata?.deliveryOrderNumber;
                                if (!num) return null;
                                return (
                                  <option key={p.id} value={num}>
                                    {num} ({p.data?.vendor?.name || p.data?.client?.name || "Tanpa Rekanan"})
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              value={po.metadata.deliveryOrderNumber || ""}
                              onChange={(e) => handleMetaChange("deliveryOrderNumber", e.target.value)}
                              placeholder="Ketik nomor DO..."
                              className={`w-full px-3.5 py-2 border border-slate-200 focus:border-${theme.primary}-500 rounded-xl text-xs focus:ring-1 focus:ring-${theme.primary}-500 outline-none transition-all`}
                            />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Purchased Payment</label>
                          <input 
                            type="text" 
                            value={po.metadata.paymentTerm || ""}
                            onChange={(e) => handleMetaChange("paymentTerm", e.target.value)}
                            className={`w-full px-3.5 py-2 border border-slate-200 focus:border-${theme.primary}-500 rounded-xl text-xs focus:ring-1 focus:ring-${theme.primary}-500 outline-none transition-all`}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 tracking-wider uppercase block">Due Dated</label>
                          <input 
                            type="date" 
                            value={po.metadata.dueDate || ""}
                            onChange={(e) => handleMetaChange("dueDate", e.target.value)}
                            className={`w-full px-3.5 py-2 border border-slate-200 focus:border-${theme.primary}-500 rounded-xl text-xs focus:ring-1 focus:ring-${theme.primary}-500 outline-none transition-all`}
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
                  {/* Issuer Segment (FROM) */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 
                          className="text-sm font-black flex items-center gap-1.5 pl-2 border-l-4"
                          style={{ 
                              color: theme.isCustom ? theme.hex : '',
                              borderColor: theme.isCustom ? theme.hex : ''
                          }}
                        >
                          <Building className="w-4 h-4 text-primary" /> FROM (Pengirim / Unit Bisnis)
                        </h3>
                        {activeCompany && (
                          <span className="text-[9px] font-black bg-primary text-white px-2 py-0.5 rounded-full tracking-widest flex items-center gap-1">
                            <Lock size={8} /> SYNCED FROM {type?.toUpperCase()} AUTH
                          </span>
                        )}
                      </div>
                    
                      <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                        <div className="space-y-1 relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Penerbit Dokumen (Issuer)</label>
                          <input 
                            type="text" 
                            readOnly={!!activeCompany}
                            value={po.company.name}
                            className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none ${activeCompany ? 'bg-slate-100/50 font-bold text-indigo-700' : 'bg-white focus:ring-1 focus:ring-indigo-500 font-medium'}`}
                            placeholder="Data diambil otomatis dari profil bisnis aktif"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Alamat / Detail Bisnis</label>
                          <textarea 
                            rows={2}
                            readOnly={!!activeCompany}
                            value={po.company.subTitle}
                            className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none resize-none ${activeCompany ? 'bg-slate-100/50 text-slate-500 italic' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                            placeholder="Alamat akan muncul di header dokumen"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">NPWP Issuer</label>
                            <input 
                              type="text" 
                              readOnly={!!activeCompany}
                              value={po.company.npwp || ""}
                               onChange={(e) => setPo(prev => ({ ...prev, company: { ...prev.company, npwp: e.target.value } }))}
                              className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none ${activeCompany ? 'bg-slate-100/50 text-slate-500 font-medium' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                              placeholder="NPWP Perusahaan"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block">Telepon / ATTN</label>
                            <input 
                              type="text" 
                              readOnly={!!activeCompany}
                              value={`${po.company.attn || ''} ${po.company.phone ? `(${po.company.phone})` : ''}`.trim()}
                              className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none ${activeCompany ? 'bg-slate-100/50 text-slate-500 font-medium' : 'bg-white focus:ring-1 focus:ring-indigo-500'}`}
                              placeholder="Nama PIC & No Telp"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <h3 
                              className="text-sm font-black flex items-center gap-1.5 pl-2 border-l-4"
                              style={{ 
                                  color: theme.isCustom ? theme.hex : '',
                                  borderColor: theme.isCustom ? theme.hex : ''
                              }}
                            >
                              <User className="w-4 h-4" /> SENT TO (Penerima / Client)
                            </h3>
                            <button 
                                onClick={() => navigate('/contacts')}
                                className="text-[9px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                            >
                                <Plus size={10} /> Tambah Kontak
                            </button>
                          </div>

                          <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                              <Search className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <select 
                                onChange={(e) => handleContactSelect(e.target.value, 'vendor')}
                                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all appearance-none"
                            >
                                <option value="">Pilih dari Database Kontak...</option>
                                {availableContacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.company_name} ({c.type})</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                          </div>
                      </div>
                    
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nama Instansi / Perusahaan</label>
                          <input 
                            type="text" 
                            value={po.vendor.name}
                            onChange={(e) => handleClientChange("vendor", "name", e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all"
                            placeholder="Contoh: PT Client Sejahtera"
                          />
                        </div>
                      
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Alamat Pengiriman / Penagihan</label>
                          <textarea 
                            rows={3}
                            value={po.vendor.address}
                            onChange={(e) => handleClientChange("vendor", "address", e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all resize-none"
                            placeholder="Alamat lengkap tujuan dokumen..."
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Ditujukan Kepada (Attn)</label>
                          <input 
                            type="text" 
                            value={po.vendor.attn}
                            onChange={(e) => handleClientChange("vendor", "attn", e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all"
                            placeholder="Nama PIC / Bagian"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nomor HP / WhatsApp</label>
                          <input 
                            type="text" 
                            value={po.vendor.phone || ""}
                            onChange={(e) => handleClientChange("vendor", "phone", e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all"
                            placeholder="0812xxxxxx"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">NPWP (Client / Vendor)</label>
                          <input 
                            type="text" 
                            value={po.vendor.npwp || ""}
                            onChange={(e) => handleClientChange("vendor", "npwp", e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all"
                            placeholder="01.234.567.8-901.234"
                          />
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
                          <label className="text-[10px] text-slate-500 font-medium block flex justify-between">
                             <span>Nama Barang / Deskripsi</span>
                             <span className="text-indigo-600 font-bold flex items-center gap-1"><Package size={8}/> Ambil dari Katalog</span>
                          </label>
                          <div className="relative">
                            <select 
                                onChange={(e) => handleProductSelect(e.target.value, idx)}
                                className="absolute right-2 top-1.5 bg-white border border-indigo-200 rounded text-[9px] font-bold text-indigo-700 px-1 hover:border-indigo-400 outline-none w-24"
                            >
                                <option value="">Pilih Produk...</option>
                                {availableProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <input 
                              type="text" 
                              value={item.description}
                              onChange={(e) => handleItemPropertyChange(item.id, "description", e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-indigo-500 pr-28"
                              placeholder="Ketik manual atau pilih dari katalog →"
                            />
                          </div>
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
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-800 border-l-4 border-primary pl-2 uppercase tracking-tight">Otoritas Tanda Tangan</h3>
                      <span className="text-[9px] font-black bg-secondary/10 text-secondary border border-secondary/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                        Type: {type === 'invoice' ? 'Invoice Authority' : type === 'delivery_order' ? 'DO Authority' : 'PO Authority'}
                      </span>
                    </div>
                    
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

              {/* TAB 6: SIGNATURE (TTD) & CORPORATE SEAL (CAP) */}
              {activeTab === "signature" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {activeCompany ? (
                    <div className="bg-indigo-600/5 border border-indigo-600/20 rounded-2xl p-4 flex flex-col gap-3">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-indigo-600/10 rounded-xl">
                           <Lock className="w-5 h-5 text-indigo-600" />
                         </div>
                         <div>
                           <p className="text-xs font-black text-indigo-700 uppercase tracking-widest leading-none">Aset Profil Terkunci</p>
                           <p className="text-[10px] text-slate-500 font-medium mt-1">Logo, Tanda Tangan, dan Stempel disinkronkan otomatis dari profil perusahaan {activeCompany.company_name}.</p>
                         </div>
                       </div>
                       <button 
                         onClick={() => handleCompanySelect(activeCompany.id!)}
                         className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-indigo-200 rounded-xl text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                       >
                         <RefreshCw className="w-3 h-3" /> MUAT ULANG ASET DARI PROFIL
                       </button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                       <AlertCircle className="w-5 h-5 text-amber-600" />
                       <p className="text-[10px] text-amber-700 font-bold leading-tight">Pilih perusahaan issuer di Tab Informasi untuk mengaktifkan aset otomatis.</p>
                    </div>
                  )}

                  {/* SECTION 2: TANDA TANGAN (TTD) */}
                  <div className="space-y-3.5 pb-5 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <User className="w-4 h-4 text-indigo-500" />
                        1. Tanda Tangan (TTD) Direktur
                      </h3>
                    </div>
                    
                    {!activeCompany ? (
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
                    ) : (
                      <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl border border-indigo-100 mb-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Metode TTD Terkunci dari Profil Bisnis</span>
                      </div>
                    )}

                    {(po.signatureType || "generated") === "generated" && !activeCompany && (
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
                              {!activeCompany && (
                                <button 
                                  onClick={() => handleSignaturePropertyChange("signatureImage", undefined)}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white hover:bg-red-600 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm"
                                  title="Hapus gambar"
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="h-10 w-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-400 italic">No TTD</div>
                          )}
                          <div className="flex-1">
                            {!activeCompany ? (
                              <>
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
                              </>
                            ) : po.signatureImage && (
                              <p className="text-[10px] text-indigo-700 font-bold bg-white p-2 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5" /> Tanda Tangan Aktif dari Profil
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: CAP STEMPEL PERUSAHAAN */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <PenTool className="w-4 h-4 text-indigo-500" />
                      2. Stempel / Cap Resmi Perusahaan
                    </h3>

                    {!activeCompany ? (
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
                    ) : (
                      <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-xl border border-indigo-100 mb-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Aset Stempel Terkunci dari Profil Bisnis</span>
                      </div>
                    )}

                    {(po.stampType || "generated") === "generated" && !activeCompany && (
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
                              {!activeCompany && (
                                <button 
                                  onClick={() => handleSignaturePropertyChange("stampImage", undefined)}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white hover:bg-red-650 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm"
                                  title="Hapus gambar"
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="h-10 w-16 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-[9px] text-slate-400 italic">No Cap</div>
                          )}
                          <div className="flex-1">
                            {!activeCompany ? (
                              <>
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
                              </>
                            ) : po.stampImage && (
                              <p className="text-[10px] text-indigo-700 font-bold bg-white p-2 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5" /> Stempel Aktif dari Profil
                              </p>
                            )}
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
                            <span>Ukuran Cap / Stempel (Standard 145px)</span>
                            <span className="font-mono text-[10px] font-bold text-slate-800">{po.stampSize || 145}px</span>
                          </div>
                          <input 
                            type="range" 
                            min="80" 
                            max="200" 
                            value={po.stampSize || 145}
                            onChange={(e) => handleSignaturePropertyChange("stampSize", parseInt(e.target.value) || 145)}
                            className="w-full accent-indigo-600 cursor-ew-resize h-1 bg-slate-200 rounded-lg appearance-none"
                          />
                          <p className="text-[8px] text-slate-400 mt-0.5 font-sans">Ukuran disarankan 145px untuk proporsi cap resmi.</p>
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
        <div className={`lg:col-span-7 min-w-0 bg-slate-200/50 rounded-2xl border border-slate-300/60 p-3 sm:p-6 overflow-x-auto w-full max-w-full min-h-[500px] scrollbar-thin ${viewMode === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <div className="flex flex-col items-start sm:items-center min-w-min gap-6 origin-top py-4">
            {/* Mobile indicator for document size */}
            <div className="w-[794px] max-w-none flex items-center justify-between px-3.5 py-2.5 bg-indigo-50 border border-indigo-100/60 rounded-xl text-indigo-950 text-[11px] font-semibold leading-relaxed shadow-xs shrink-0 select-none">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span><strong>Layout Ukuran Asli (A4)</strong>: Ukuran dokumen dikunci demi akurasi cetak & PDF sempurna.</span>
              </span>
              <span className="hidden sm:inline bg-indigo-100 text-indigo-900 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Akurasi 100%</span>
            </div>

            {/* Active Zoom Controller */}
            <div className="w-[794px] max-w-none flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 shadow-xs rounded-xl text-slate-800 text-[11px] font-semibold leading-none shrink-0 select-none">
              <span className="flex items-center gap-2">
                <Settings size={14} className="text-slate-400" />
                <span>Skala Pratinjau Tampilan: <strong className="text-indigo-600">{previewZoom}%</strong></span>
              </span>
              <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewZoom(prev => Math.max(50, prev - 10))}
                  disabled={previewZoom <= 50}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-md text-[10px] font-black border border-slate-200/60 shadow-xxs transition-all cursor-pointer select-none"
                >
                  DIPERKECIL (-10%)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(80)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black border transition-all cursor-pointer select-none ${
                    previewZoom === 80 
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-600/10' 
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200/60'
                  }`}
                >
                  MUAT PENUH (80%)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(100)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black border transition-all cursor-pointer select-none ${
                    previewZoom === 100
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-600/10'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200/60'
                  }`}
                >
                  ASLI (100%)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(prev => Math.min(150, prev + 10))}
                  disabled={previewZoom >= 150}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded-md text-[10px] font-black border border-slate-200/60 shadow-xxs transition-all cursor-pointer select-none"
                >
                  DIPERBESAR (+10%)
                </button>
              </div>
            </div>

            {/* Download wrapper containing Page 1 (and optionally Page 2) */}
            <div 
              id="po-download-wrapper" 
              className={`w-[794px] shrink-0 flex flex-col items-center ${isExportingPDF ? 'gap-0' : 'gap-6'}`}
              style={isExportingPDF ? {} : {
                zoom: `${previewZoom}%`,
                WebkitZoom: `${previewZoom}%`,
                MozTransform: `scale(${previewZoom / 100})`,
                MozTransformOrigin: 'top center'
              }}
            >

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
              <div 
                className="flex justify-between items-center border-b pb-6"
                style={{ borderBottomColor: theme.isCustom ? theme.hex + '33' : '' }}
              >
                
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
                        <div 
                          className="relative shrink-0 flex items-center justify-center p-2 rounded-xl bg-slate-50 border"
                          style={{ borderColor: theme.isCustom ? theme.hex + '33' : '' }}
                        >
                          <svg className="w-14 h-14" viewBox="0 0 100 50">
                            <path 
                              d="M25,25 C25,35 35,42 45,35 C55,28 65,15 75,25 C85,35 75,42 65,35 C55,28 45,15 25,25 Z" 
                              fill="none" 
                              stroke={theme.isCustom ? theme.hex : "#0F5CA3"} 
                              strokeWidth="8" 
                              strokeLinecap="round"
                            />
                            <circle cx="21" cy="24" r="5" fill={theme.isCustom ? theme.hex : "#38BDF8"} />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-900 leading-tight tracking-tight uppercase">
                            {po.company.name || "PT INFINITAS DIGITAL SOLUSI"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                            {po.company.subTitle || "INFINITAS DIGITAL SOLUSI"}
                          </span>
                          <span 
                            className="text-[9px] font-medium leading-none mt-1.5 opacity-90"
                            style={{ color: theme.isCustom ? theme.hex : '#0F5CA3' }}
                          >
                            Standard Quality & Digital Integration Vendor
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right text details */}
                <div className="text-right">
                  <span 
                    className="text-xs font-bold uppercase tracking-wider block mb-1"
                    style={{ color: theme.isCustom ? theme.hex : '#1E40AF' }}
                  >
                    {po.documentType === 'invoice' ? 'INVOICE' : po.documentType === 'delivery_order' ? 'DELIVERY ORDER' : 'Purchase Order'}
                  </span>
                  
                  {po.documentType === 'invoice' ? (
                    <div className="space-y-0.5 text-xs text-slate-700 pt-1">
                      <div className="flex justify-end gap-2 items-center">
                        <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider">No. Invoice</span>
                        <span 
                          className="font-black font-mono px-1.5 py-0.5 rounded border"
                          style={{ 
                            backgroundColor: theme.isCustom ? theme.hex + '11' : '', 
                            color: theme.isCustom ? theme.hex : '',
                            borderColor: theme.isCustom ? theme.hex + '33' : ''
                          }}
                        >
                          {po.metadata.invoiceNumber || "-"}
                        </span>
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
                        <span 
                          className="font-black font-mono px-1.5 py-0.5 rounded border"
                          style={{ 
                            backgroundColor: theme.isCustom ? theme.hex + '11' : '', 
                            color: theme.isCustom ? theme.hex : '',
                            borderColor: theme.isCustom ? theme.hex + '33' : ''
                          }}
                        >
                          {po.metadata.deliveryOrderNumber || "-"}
                        </span>
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
                
                {/* FROM BOX CARDS */}
                <div 
                  className="w-[48%] border rounded-xl overflow-hidden shadow-sm flex flex-col"
                  style={{ 
                    backgroundColor: theme.isCustom ? theme.hex + '05' : '',
                    borderColor: theme.isCustom ? theme.hex + '22' : '#e2e8f0' 
                  }}
                >
                  <div 
                    className="px-4 py-2.5 flex items-center justify-start gap-1.5 font-black text-xs tracking-wide border-b"
                    style={{ 
                      backgroundColor: theme.isCustom ? theme.hex + '0f' : '', 
                      color: theme.isCustom ? theme.hex : '',
                      borderColor: theme.isCustom ? theme.hex + '22' : '#e2e8f0'
                    }}
                  >
                    <Building className="w-4 h-4 flex-shrink-0 stroke-[2.5]" /> <span>FROM</span>
                  </div>
                  <div className="p-4 space-y-2 flex-grow min-h-[140px]">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {po.company.name || "[Nama Unit Bisnis Kosong]"}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {po.company.subTitle || "[Alamat Bisnis Kosong]"}
                    </p>
                    <div className="pt-1.5 text-[11px] text-slate-500 space-y-0.5 border-t border-slate-100/50 mt-1">
                      {po.company.npwp && (
                        <p className="flex items-center gap-1"><span className="font-semibold text-slate-700">NPWP:</span> {po.company.npwp}</p>
                      )}
                      <p><span className="font-semibold text-slate-700">Attn:</span> {po.company.attn || "-"}</p>
                      <p className="flex items-center gap-1"><span className="font-semibold text-slate-700">Phone:</span> {po.company.phone || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* SENT TO BOX CARDS */}
                <div 
                  className="w-[48%] text-slate-900 hover:shadow transition-shadow border rounded-xl overflow-hidden shadow-sm flex flex-col"
                  style={{ 
                    backgroundColor: theme.isCustom ? theme.hex + '05' : '',
                    borderColor: theme.isCustom ? theme.hex + '22' : '' 
                  }}
                >
                  <div 
                    className="text-white border-b px-4 py-2.5 flex items-center justify-start gap-1.5 font-black text-xs tracking-wide cursor-default"
                    style={{ 
                      backgroundColor: theme.isCustom ? theme.hex : '',
                      borderColor: theme.isCustom ? theme.hex + '33' : ''
                    }}
                  >
                    <User className="w-[18px] h-[18px] text-white/80 flex-shrink-0 stroke-[2.5]" /> <span>{po.documentType === 'invoice' ? 'BILLED TO' : 'SENT TO'}</span>
                  </div>
                  <div className="p-4 space-y-2 flex-grow min-h-[140px]">
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      {po.vendor.name || "[Nama Penerima Kosong]"}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {po.vendor.address || "[Alamat Penerima Kosong]"}
                    </p>
                    <div className="pt-1.5 text-[11px] text-slate-500 space-y-0.5">
                      {po.vendor.npwp && (
                        <p className="flex items-center gap-1"><span className="font-semibold text-slate-700">NPWP:</span> {po.vendor.npwp}</p>
                      )}
                      <p><span className="font-semibold text-slate-700">Attn:</span> {po.vendor.attn || "-"}</p>
                      <p className="flex items-center gap-1"><span className="font-semibold text-slate-700">Phone:</span> {po.vendor.phone || "-"}</p>
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
                    <tr 
                      className="text-slate-400 border-b border-slate-200 font-bold tracking-wider text-[10px]"
                      style={{ backgroundColor: theme.isCustom ? theme.hex + '0a' : '' }}
                    >
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
                      <span 
                        className="text-[10px] tracking-wide uppercase font-extrabold"
                        style={{ color: theme.isCustom ? theme.hex : '' }}
                      >
                        Total Amount:
                      </span>
                      <span 
                        className="font-mono text-lg"
                        style={{ color: theme.isCustom ? theme.hex : '' }}
                      >
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
                  {/* Column 1: RECIPIENT */}
                  <div className="flex flex-col items-center text-center w-[30%]">
                    {/* Entity Name Header - fixed consistent height */}
                    <div className="h-10 flex items-center justify-center w-full">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wide leading-tight px-2">
                        {po.vendor.name || (po.documentType === 'po' ? 'SUPPLIER' : 'CLIENT')}
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

                  {/* Column 3: ISSUER */}
                  <div className="flex flex-col items-center text-center w-[30%]">
                    {/* Entity Name Header - fixed consistent height */}
                    <div className="h-10 flex items-center justify-center w-full">
                      <span 
                        className="text-[10px] font-bold uppercase tracking-wide leading-tight"
                        style={{ color: theme.isCustom ? theme.hex : '#1E40AF' }}
                      >
                        {po.company.name || "ISSUER"}
                      </span>
                    </div>
                    
                    {/* Active Digital Signature & Stamp Container */}
                    <div className="relative h-24 flex justify-center items-center select-none w-full">
                      <div className="absolute z-10 flex items-center justify-center">
                        {(po.signatureType || "generated") === "generated" ? (
                          <span 
                            className="text-2xl select-none text-center"
                            style={{ 
                              color: theme.isCustom ? theme.hex : '#1E40AF',
                              fontFamily: po.signatureFont === "alex" ? "var(--font-alex)" : po.signatureFont === "caveat" ? "var(--font-caveat)" : "var(--font-satisfy)"
                            }}
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
                            size={po.stampSize ? po.stampSize * 0.72 : 104}
                          />
                        ) : (
                          po.stampImage && (
                            <img 
                              src={po.stampImage} 
                              alt="Stamp Cap" 
                              className="select-none mix-blend-multiply"
                              style={{ 
                                transform: `rotate(${po.stampAngle ?? -6}deg)`,
                                maxWidth: `${po.stampSize ? po.stampSize * 0.72 : 104}px`,
                                maxHeight: `${po.stampSize ? po.stampSize * 0.72 : 104}px`,
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

                {/* QR Code Verification */}
                {id && (
                <div className="w-[15%] flex justify-center items-end h-full min-h-[160px] pb-4">
                  <div className="flex flex-col items-center">
                    <QRCodeSVG value={`https://adm.indilus.co.id/verify/${id}`} size={60} level="M" />
                    <span className="text-[7px] text-slate-400 mt-1 uppercase text-center leading-tight">Verify<br/>Document</span>
                  </div>
                </div>
                )}

                {/* Signee */}
                <div className="w-[30%] text-center flex flex-col justify-between h-full min-h-[160px]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">Authorized Signature</span>
                    <span className="text-xs font-bold text-slate-800 block mt-1 uppercase">{po.company.name || "ISSUER"}</span>
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
                            size={po.stampSize ?? 145}
                          />
                        ) : (
                          po.stampImage && (
                            <img 
                              src={po.stampImage} 
                              alt="Stamp Cap" 
                              className="select-none mix-blend-multiply"
                              style={{ 
                                transform: `rotate(${po.stampAngle ?? -6}deg)`,
                                maxWidth: `${po.stampSize ?? 145}px`,
                                maxHeight: `${po.stampSize ?? 145}px`,
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

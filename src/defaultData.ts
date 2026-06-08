import { PurchaseOrder } from "./types";

export const defaultPurchaseOrder: PurchaseOrder = {
  documentType: "po",
  company: {
    name: "PT INFINITAS DIGITAL SOLUSI",
    brand: "indilus",
    subTitle: "INFINITAS DIGITAL SOLUSI"
  },
  vendor: {
    name: "UD PUTRA CIPTA KARYA SEJAHTERA",
    address: "Jl Jakha No 22 Rt 04 Rw 01 Desa Kalimati Kec Adiwerna Kab. Tegal",
    attn: "Akhmad Hilal Maftuh"
  },
  shipping: {
    name: "PT. KONET TECH UTAMA",
    address: "Kawasan Industri Jababeka tahap II Blok MM No.6, Desa/Kelurahan Pasir Sari, Kec. Cikarang Selatan, Kabupaten Bekasi - Jawa Barat",
    attn: "Pak Wawan",
    phone: "+62 811-1312-234"
  },
  metadata: {
    poNumber: "010/PO/IND/VI/2026",
    issueDate: "2026-06-08",
    paymentTerm: "Up to 40 Days After Delivery",
    priceTerm: "Franco Jakarta"
  },
  items: [
    {
      id: "1",
      description: "Stainless Belt 80cm Lengkap",
      qty: 2000,
      unit: "Pcs",
      price: 4000
    }
  ],
  notes: [
    "All Shipments Must Include: a. Invoice, b. Receipt, c. Delivery Order, d. Quality Control",
    "We will return the goods if they do not match the order",
    "Purchase Order Number must be stated on the Note/Invoice/Receipt",
    "If the delivery will be carried out in stages, then Each shipment of goods must be accompanied by a copy of the Purchase Order."
  ],
  bankDetails: {
    bankName: "BNI",
    accountNumber: "8881999939",
    accountName: "PT INFINITAS DIGITAL SOLUSI"
  },
  signee: {
    company: "PT INFINITAS DIGITAL SOLUSI",
    name: "ADITIA ALAMSYAH",
    title: "DIREKTUR"
  },
  appendixEnabled: true,
  appendixTitle: "ANGARAN / LAMPIRAN SPESIFIKASI TEKNIS",
  appendixItems: [
    {
      id: "app-1",
      title: "1. Standar Toleransi & Kualitas Material",
      content: "Seluruh material besi stainless belt wajib lolos uji korosi air laut garam minimum 48 jam. Toleransi dimensi ketebalan plat adalah +/- 0.05 mm semenjak barang diterima."
    },
    {
      id: "app-2",
      title: "2. Pengemasan & Pelabelan Kargo",
      content: "Setiap paket kargo 50 Pcs wajib dibungkus foam-sheet tebal 2mm dan dilapisi kardus double wall corrugation untuk mencegah goresan / deformasi gesekan selama transit."
    },
    {
      id: "app-3",
      title: "3. Klausul Retur & Kompensasi Keterlambatan",
      content: "Apabila ditemukan kerusakan fisik di atas 2% dari total pengiriman, Vendor wajib mengganti unit baru dalam jangka waktu maksimal 7-hari kalender tanpa biaya tambahan."
    }
  ],
  logoType: "default",
  signatureType: "generated",
  signatureFont: "satisfy",
  signatureText: "Aditia Alamsyah",
  stampType: "generated",
  stampTextMain: "PT INFINITAS DIGITAL SOLUSI",
  stampTextSub: "APPROVED",
  stampColor: "#059669", // Beautiful emerald teal stamp color
  stampAngle: -6,
  ppnEnabled: true,
  ppnPercent: 11
};

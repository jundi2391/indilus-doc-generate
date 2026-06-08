import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { PurchaseOrder } from "./types";

export const generateExcelPO = async (po: PurchaseOrder) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Purchase Order");

  // Show grid lines explicitly
  worksheet.views = [{ showGridLines: true }];

  // Column Setup
  // Col 1: A (Padding)
  // Col 2: B (Desc Pt 1 - merged)
  // Col 3: C (Desc Pt 2 - merged)
  // Col 4: D (Desc Pt 3 - merged)
  // Col 5: E (Qty)
  // Col 6: F (Unit)
  // Col 7: G (Price)
  // Col 8: H (Total)
  // Col 9: I (Padding)

  worksheet.getColumn(1).width = 3;   // A
  worksheet.getColumn(2).width = 15;  // B
  worksheet.getColumn(3).width = 15;  // C
  worksheet.getColumn(4).width = 12;  // D (B-D merged)
  worksheet.getColumn(5).width = 10;  // E (Qty)
  worksheet.getColumn(6).width = 10;  // F (Unit)
  worksheet.getColumn(7).width = 15;  // G (Price)
  worksheet.getColumn(8).width = 18;  // H (Total)
  worksheet.getColumn(9).width = 3;   // I

  // Define some colors
  const primaryColor = "0F5CA3"; // indilus blue
  const primaryLight = "F0F9FF"; // Light Sky Blue for Vendor
  const infoHeaderBg = "1E40AF"; // Solid Dark blue for Sent To
  const neutralLight = "F8FAFC"; // Slate 50 for Table Header
  const borderLight = "CBD5E1";  // Slate 300
  const textDark = "0F172A";     // Slate 900
  const textMuted = "475569";    // Slate 600

  // Fonts
  const fontTitle = { name: "Arial", size: 22, bold: true, color: { argb: primaryColor } };
  const fontHeader = { name: "Arial", size: 14, bold: true, color: { argb: infoHeaderBg } };
  const fontNormalBold = { name: "Arial", size: 10, bold: true, color: { argb: textDark } };
  const fontNormal = { name: "Arial", size: 10, color: { argb: textDark } };
  const fontSmallMuted = { name: "Arial", size: 8, color: { argb: textMuted } };
  const fontTableHeader = { name: "Arial", size: 10, bold: true, color: { argb: "000000" } };

  // Helper: apply border to a range
  const applyBorderToMerged = (startRow: number, startCol: number, endRow: number, endCol: number) => {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = worksheet.getCell(r, c);
        const borders: Partial<ExcelJS.Borders> = {};
        if (r === startRow) borders.top = { style: "thin", color: { argb: borderLight } };
        if (r === endRow) borders.bottom = { style: "thin", color: { argb: borderLight } };
        if (c === startCol) borders.left = { style: "thin", color: { argb: borderLight } };
        if (c === endCol) borders.right = { style: "thin", color: { argb: borderLight } };
        cell.border = borders;
      }
    }
  };

  // --- BRAND/HEADER ---
  // B2:D3 Merged: indilus branding
  worksheet.mergeCells("B2:D3");
  const cellBrand = worksheet.getCell("B2");
  cellBrand.value = po.company.brand.toUpperCase();
  cellBrand.font = fontTitle;
  cellBrand.alignment = { vertical: "middle", horizontal: "left" };

  // B4:D4 Subtitle
  worksheet.mergeCells("B4:D4");
  const cellSub = worksheet.getCell("B4");
  cellSub.value = "INFINITAS DIGITAL SOLUSI";
  cellSub.font = { name: "Arial", size: 8, bold: true, color: { argb: "64748B" } };
  cellSub.alignment = { vertical: "top" };

  // F2:H2 Purchase Order Label
  worksheet.mergeCells("F2:H2");
  const cellPOTitle = worksheet.getCell("F2");
  cellPOTitle.value = "PURCHASE ORDER";
  cellPOTitle.font = fontHeader;
  cellPOTitle.alignment = { vertical: "middle", horizontal: "right" };

  // F3:H3 PO Number Info
  worksheet.mergeCells("F3:H3");
  const cellPONum = worksheet.getCell("F3");
  cellPONum.value = po.metadata.poNumber;
  cellPONum.font = { name: "Arial", size: 10, bold: true, color: { argb: textDark } };
  cellPONum.alignment = { vertical: "middle", horizontal: "right" };

  // F4:H4 Issued Info
  worksheet.mergeCells("F4:H4");
  const cellPOIssued = worksheet.getCell("F4");
  const dateFormatted = new Date(po.metadata.issueDate).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  cellPOIssued.value = `Issued: ${dateFormatted}`;
  cellPOIssued.font = fontSmallMuted;
  cellPOIssued.alignment = { vertical: "middle", horizontal: "right" };

  // Row heights for header
  worksheet.getRow(2).height = 20;
  worksheet.getRow(3).height = 20;
  worksheet.getRow(4).height = 15;

  // --- VENDOR & SHIPPING DETAILS ---

  // B6:D6 Vendor Header Blue Panel
  worksheet.mergeCells("B6:D6");
  const cellVendorH = worksheet.getCell("B6");
  cellVendorH.value = "✓  VENDOR";
  cellVendorH.font = { name: "Arial", size: 10, bold: true, color: { argb: "0284C7" } };
  cellVendorH.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: primaryLight }
  };
  cellVendorH.alignment = { vertical: "middle", indent: 1 };

  // F6:H6 Sent To Header Dark Blue Panel
  worksheet.mergeCells("F6:H6");
  const cellShippingH = worksheet.getCell("F6");
  cellShippingH.value = "✓  SENT TO";
  cellShippingH.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
  cellShippingH.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: infoHeaderBg }
  };
  cellShippingH.alignment = { vertical: "middle", indent: 1 };

  worksheet.getRow(6).height = 22;

  // Render Vendor Data (Row 7 to 11)
  const renderCardDetails = (startRow: number) => {
    // Left Box - Vendor details
    worksheet.mergeCells(`B${startRow}:D${startRow}`);
    const cellV1 = worksheet.getCell(`B${startRow}`);
    cellV1.value = po.vendor.name;
    cellV1.font = fontNormalBold;
    cellV1.alignment = { wrapText: true, vertical: "top" };

    worksheet.mergeCells(`B${startRow+1}:D${startRow+3}`);
    const cellV2 = worksheet.getCell(`B${startRow+1}`);
    cellV2.value = po.vendor.address;
    cellV2.font = fontNormal;
    cellV2.alignment = { wrapText: true, vertical: "top" };

    worksheet.mergeCells(`B${startRow+4}:D${startRow+4}`);
    const cellV3 = worksheet.getCell(`B${startRow+4}`);
    cellV3.value = `Attn : ${po.vendor.attn}`;
    worksheet.getCell(`B${startRow+4}`).font = fontNormal;

    // Right Box - Sent To details
    worksheet.mergeCells(`F${startRow}:H${startRow}`);
    const cellS1 = worksheet.getCell(`F${startRow}`);
    cellS1.value = po.shipping.name;
    cellS1.font = fontNormalBold;
    cellS1.alignment = { wrapText: true, vertical: "top" };

    worksheet.mergeCells(`F${startRow+1}:H${startRow+3}`);
    const cellS2 = worksheet.getCell(`F${startRow+1}`);
    cellS2.value = po.shipping.address;
    cellS2.font = fontNormal;
    cellS2.alignment = { wrapText: true, vertical: "top" };

    worksheet.mergeCells(`F${startRow+4}:H${startRow+4}`);
    const cellS3 = worksheet.getCell(`F${startRow+4}`);
    cellS3.value = `Attn : ${po.shipping.attn}`;
    cellS3.font = fontNormal;

    worksheet.mergeCells(`F${startRow+5}:H${startRow+5}`);
    const cellS4 = worksheet.getCell(`F${startRow+5}`);
    cellS4.value = `Phone : ${po.shipping.phone || ""}`;
    cellS4.font = fontNormal;

    // Box Borders
    applyBorderToMerged(6, 2, 11, 4);
    applyBorderToMerged(6, 6, 12, 8);
  };

  renderCardDetails(7);
  worksheet.getRow(7).height = 18;
  worksheet.getRow(8).height = 18;
  worksheet.getRow(9).height = 18;
  worksheet.getRow(10).height = 18;
  worksheet.getRow(11).height = 18;
  worksheet.getRow(12).height = 18;

  // --- CO-METADATA HEADER STRIP (PURCHASE ORDER | PURCHASED PAYMENT | PRICE TERM) ---
  const metaRowH = 14;
  const metaRowV = 15;

  worksheet.mergeCells(`B${metaRowH}:D${metaRowH}`);
  worksheet.getCell(`B${metaRowH}`).value = "PURCHASED ORDER";
  worksheet.mergeCells(`E${metaRowH}:F${metaRowH}`);
  worksheet.getCell(`E${metaRowH}`).value = "PURCHASED PAYMENT";
  worksheet.mergeCells(`G${metaRowH}:H${metaRowH}`);
  worksheet.getCell(`G${metaRowH}`).value = "PRICE TERM";

  [cellBrand, worksheet.getCell(`B${metaRowH}`), worksheet.getCell(`E${metaRowH}`), worksheet.getCell(`G${metaRowH}`)].forEach(c => {
    c.font = fontSmallMuted;
    c.alignment = { horizontal: "center", vertical: "middle" };
  });

  worksheet.mergeCells(`B${metaRowV}:D${metaRowV}`);
  worksheet.getCell(`B${metaRowV}`).value = po.metadata.poNumber;
  worksheet.mergeCells(`E${metaRowV}:F${metaRowV}`);
  worksheet.getCell(`E${metaRowV}`).value = po.metadata.paymentTerm;
  worksheet.mergeCells(`G${metaRowV}:H${metaRowV}`);
  worksheet.getCell(`G${metaRowV}`).value = po.metadata.priceTerm;

  [worksheet.getCell(`B${metaRowV}`), worksheet.getCell(`E${metaRowV}`), worksheet.getCell(`G${metaRowV}`)].forEach(c => {
    c.font = fontNormalBold;
    c.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Borders for meta strip
  applyBorderToMerged(metaRowH, 2, metaRowV, 8);
  // Add subtle light background for headers in the strip
  for (let c = 2; c <= 8; c++) {
    worksheet.getCell(metaRowH, c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "F1F5F9" }
    };
  }

  worksheet.getRow(metaRowH).height = 18;
  worksheet.getRow(metaRowV).height = 22;

  // --- ITEMS TABLE CONFIGURATION ---
  const tableHeaderRow = 17;
  worksheet.getRow(tableHeaderRow).height = 25;

  worksheet.mergeCells(`B${tableHeaderRow}:D${tableHeaderRow}`);
  worksheet.getCell(`B${tableHeaderRow}`).value = "DESCRIPTION";
  worksheet.getCell(`E${tableHeaderRow}`).value = "QTY";
  worksheet.getCell(`F${tableHeaderRow}`).value = "UNIT";
  worksheet.getCell(`G${tableHeaderRow}`).value = "PRICE";
  worksheet.getCell(`H${tableHeaderRow}`).value = "TOTAL";

  // Style header
  const tableCols = [2, 5, 6, 7, 8];
  tableCols.forEach(col => {
    const c = worksheet.getCell(tableHeaderRow, col);
    c.font = fontTableHeader;
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: neutralLight }
    };
    c.alignment = {
      vertical: "middle",
      horizontal: col === 2 ? "left" : col === 6 ? "center" : "right"
    };
    c.border = {
      top: { style: "medium", color: { argb: textDark } },
      bottom: { style: "medium", color: { argb: textDark } },
      left: { style: "thin", color: { argb: borderLight } },
      right: { style: "thin", color: { argb: borderLight } }
    };
  });

  // Render Items
  let currentRow = tableHeaderRow + 1;
  po.items.forEach((item, idx) => {
    worksheet.getRow(currentRow).height = 22;
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
    
    worksheet.getCell(`B${currentRow}`).value = item.description;
    worksheet.getCell(`E${currentRow}`).value = Number(item.qty);
    worksheet.getCell(`F${currentRow}`).value = item.unit;
    worksheet.getCell(`G${currentRow}`).value = Number(item.price);
    
    // Total calculation via formula so it's a dynamic template spreadsheet!
    worksheet.getCell(`H${currentRow}`).value = { formula: `=E${currentRow}*G${currentRow}` };

    // Format individual cells
    const rowCells = [
      { col: 2, align: "left" as const, numFormat: undefined },
      { col: 5, align: "right" as const, numFormat: "#,##0" },
      { col: 6, align: "center" as const, numFormat: undefined },
      { col: 7, align: "right" as const, numFormat: '"Rp " #,##0' },
      { col: 8, align: "right" as const, numFormat: '"Rp " #,##0' }
    ];

    rowCells.forEach(cell => {
      const c = worksheet.getCell(currentRow, cell.col);
      c.font = fontNormal;
      c.alignment = { vertical: "middle", horizontal: cell.align };
      if (cell.numFormat) c.numFmt = cell.numFormat;
      
      // Subtle bottom border for row
      c.border = {
        bottom: { style: "thin", color: { argb: "F1F5F9" } },
        left: { style: "thin", color: { argb: borderLight } },
        right: { style: "thin", color: { argb: borderLight } }
      };

      // Alternating background colors
      if (idx % 2 === 1) {
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F8FAFC" }
        };
      }
    });

    currentRow++;
  });

  // Render empty template rows (so users can fill in manually)
  const emptyRowsCount = 4;
  for (let idx = 0; idx < emptyRowsCount; idx++) {
    worksheet.getRow(currentRow).height = 22;
    worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
    
    worksheet.getCell(`B${currentRow}`).value = "";
    worksheet.getCell(`E${currentRow}`).value = "";
    worksheet.getCell(`F${currentRow}`).value = "";
    worksheet.getCell(`G${currentRow}`).value = "";
    worksheet.getCell(`H${currentRow}`).value = { formula: `=E${currentRow}*G${currentRow}` };

    const rowCells = [
      { col: 2, align: "left" as const, numFormat: undefined },
      { col: 5, align: "right" as const, numFormat: "#,##0" },
      { col: 6, align: "center" as const, numFormat: undefined },
      { col: 7, align: "right" as const, numFormat: '"Rp " #,##0' },
      { col: 8, align: "right" as const, numFormat: '"Rp " #,##0' }
    ];

    rowCells.forEach(cell => {
      const c = worksheet.getCell(currentRow, cell.col);
      c.font = fontNormal;
      c.alignment = { vertical: "middle", horizontal: cell.align };
      if (cell.numFormat) c.numFmt = cell.numFormat;
      c.border = {
        bottom: { style: "thin", color: { argb: borderLight } },
        left: { style: "thin", color: { argb: borderLight } },
        right: { style: "thin", color: { argb: borderLight } }
      };
    });

    currentRow++;
  }

  // Bottom Double Line table boundary
  tableCols.forEach(col => {
    const c = worksheet.getCell(currentRow - 1, col);
    c.border = {
      ...c.border,
      bottom: { style: "medium", color: { argb: textDark } }
    };
  });

  // --- TOTAL SUM BOX ---
  if (po.ppnEnabled) {
    // 1. Sub-total row
    worksheet.getRow(currentRow + 1).height = 22;
    worksheet.mergeCells(`F${currentRow + 1}:G${currentRow + 1}`);
    const subLabel = worksheet.getCell(`F${currentRow + 1}`);
    subLabel.value = "SUB-TOTAL";
    subLabel.font = { name: "Arial", size: 10, bold: true, color: { argb: textMuted } };
    subLabel.alignment = { horizontal: "right", vertical: "middle" };

    const subValue = worksheet.getCell(`H${currentRow + 1}`);
    subValue.value = { formula: `=SUM(H${tableHeaderRow + 1}:H${currentRow - 1})` };
    subValue.font = fontNormalBold;
    subValue.alignment = { horizontal: "right", vertical: "middle" };
    subValue.numFmt = '"Rp " #,##0';
    subValue.border = {
      top: { style: "thin", color: { argb: borderLight } },
      bottom: { style: "thin", color: { argb: borderLight } },
      left: { style: "thin", color: { argb: borderLight } },
      right: { style: "thin", color: { argb: borderLight } }
    };

    // 2. PPN tax row
    worksheet.getRow(currentRow + 2).height = 22;
    worksheet.mergeCells(`F${currentRow + 2}:G${currentRow + 2}`);
    const ppnLabel = worksheet.getCell(`F${currentRow + 2}`);
    ppnLabel.value = `PPN (${po.ppnPercent ?? 11}%)`;
    ppnLabel.font = { name: "Arial", size: 10, bold: true, color: { argb: textMuted } };
    ppnLabel.alignment = { horizontal: "right", vertical: "middle" };

    const ppnValue = worksheet.getCell(`H${currentRow + 2}`);
    ppnValue.value = { formula: `=ROUND(H${currentRow + 1} * ${(po.ppnPercent ?? 11)} / 100, 0)` };
    ppnValue.font = fontNormalBold;
    ppnValue.alignment = { horizontal: "right", vertical: "middle" };
    ppnValue.numFmt = '"Rp " #,##0';
    ppnValue.border = {
      top: { style: "thin", color: { argb: borderLight } },
      bottom: { style: "thin", color: { argb: borderLight } },
      left: { style: "thin", color: { argb: borderLight } },
      right: { style: "thin", color: { argb: borderLight } }
    };

    // 3. Total sum box
    worksheet.getRow(currentRow + 3).height = 36;
    worksheet.mergeCells(`F${currentRow + 3}:G${currentRow + 3}`);
    const totalLabel = worksheet.getCell(`F${currentRow + 3}`);
    totalLabel.value = "TOTAL AMOUNT";
    totalLabel.font = { name: "Arial", size: 11, bold: true, color: { argb: primaryColor } };
    totalLabel.alignment = { horizontal: "right", vertical: "middle" };

    const totalValue = worksheet.getCell(`H${currentRow + 3}`);
    totalValue.value = { formula: `=H${currentRow + 1}+H${currentRow + 2}` };
    totalValue.font = { name: "Arial", size: 14, bold: true, color: { argb: "1E40AF" } };
    totalValue.alignment = { horizontal: "right", vertical: "middle" };
    totalValue.numFmt = '"Rp " #,##0';
    totalValue.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "EFF6FF" }
    };
    totalValue.border = {
      top: { style: "double", color: { argb: "1E40AF" } },
      bottom: { style: "double", color: { argb: "1E40AF" } },
      left: { style: "thin", color: { argb: borderLight } },
      right: { style: "thin", color: { argb: borderLight } }
    };

    currentRow = currentRow + 5;
  } else {
    worksheet.getRow(currentRow + 1).height = 36;
    worksheet.mergeCells(`F${currentRow + 1}:G${currentRow + 1}`);

    const totalLabel = worksheet.getCell(`F${currentRow + 1}`);
    totalLabel.value = "TOTAL AMOUNT";
    totalLabel.font = { name: "Arial", size: 11, bold: true, color: { argb: primaryColor } };
    totalLabel.alignment = { horizontal: "right", vertical: "middle" };

    const totalValue = worksheet.getCell(`H${currentRow + 1}`);
    totalValue.value = { formula: `=SUM(H${tableHeaderRow + 1}:H${currentRow - 1})` };
    totalValue.font = { name: "Arial", size: 14, bold: true, color: { argb: "1E40AF" } };
    totalValue.alignment = { horizontal: "right", vertical: "middle" };
    totalValue.numFmt = '"Rp " #,##0';
    totalValue.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "EFF6FF" }
    };
    totalValue.border = {
      top: { style: "double", color: { argb: "1E40AF" } },
      bottom: { style: "double", color: { argb: "1E40AF" } },
      left: { style: "thin", color: { argb: borderLight } },
      right: { style: "thin", color: { argb: borderLight } }
    };

    currentRow = currentRow + 3;
  }

  // --- SHIPPING NOTE & TERMS (Left-hand side) ---
  worksheet.getRow(currentRow).height = 20;
  worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
  worksheet.getCell(`B${currentRow}`).value = "Note & Terms:";
  worksheet.getCell(`B${currentRow}`).font = fontNormalBold;

  let noteRow = currentRow + 1;
  po.notes.forEach(noteText => {
    worksheet.getRow(noteRow).height = 15;
    worksheet.mergeCells(`B${noteRow}:D${noteRow}`);
    const c = worksheet.getCell(`B${noteRow}`);
    c.value = "- " + noteText;
    c.font = fontSmallMuted;
    c.alignment = { wrapText: true, vertical: "top" };
    noteRow++;
  });

  // --- SIGNATURE BLOCK (Right-hand side) ---
  const sigRowStart = currentRow;
  worksheet.mergeCells(`F${sigRowStart}:H${sigRowStart}`);
  const cSig1 = worksheet.getCell(`F${sigRowStart}`);
  cSig1.value = po.signee.company;
  cSig1.font = fontNormalBold;
  cSig1.alignment = { horizontal: "center", vertical: "middle" };

  // Spacing for signature image or actual handwritten gap (Row + 4)
  worksheet.mergeCells(`F${sigRowStart + 1}:H${sigRowStart + 3}`);
  const cSigGap = worksheet.getCell(`F${sigRowStart + 1}`);
  cSigGap.value = "[ Signature / Cap ]";
  cSigGap.font = { name: "Arial", size: 8, italic: true, color: { argb: "94A3B8" } };
  cSigGap.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(`F${sigRowStart + 4}:H${sigRowStart + 4}`);
  const cSigName = worksheet.getCell(`F${sigRowStart + 4}`);
  cSigName.value = po.signee.name;
  cSigName.font = { name: "Arial", size: 10, bold: true, color: { argb: textDark }, underline: "single" };
  cSigName.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(`F${sigRowStart + 5}:H${sigRowStart + 5}`);
  const cSigTitle = worksheet.getCell(`F${sigRowStart + 5}`);
  cSigTitle.value = po.signee.title;
  cSigTitle.font = fontSmallMuted;
  cSigTitle.alignment = { horizontal: "center", vertical: "middle" };

  // --- APPENDIX SHEET GENERATOR ---
  if (po.appendixEnabled) {
    const appWorksheet = workbook.addWorksheet("Appendix - Lampiran");
    appWorksheet.views = [{ showGridLines: true }];
    
    appWorksheet.getColumn(1).width = 3;   // A
    appWorksheet.getColumn(2).width = 25;  // B (Title)
    appWorksheet.getColumn(3).width = 65;  // C (Details)
    appWorksheet.getColumn(4).width = 3;   // D
    
    // Header Info
    appWorksheet.mergeCells("B2:C2");
    const cellAppTitle = appWorksheet.getCell("B2");
    cellAppTitle.value = po.appendixTitle || "LAMPIRAN SPESIFIKASI TEKNIS";
    cellAppTitle.font = { name: "Arial", size: 16, bold: true, color: { argb: "0F5CA3" } };
    cellAppTitle.alignment = { vertical: "middle", horizontal: "left" };
    
    appWorksheet.mergeCells("B3:C3");
    const cellAppSub = appWorksheet.getCell("B3");
    cellAppSub.value = `Lampiran Resmi Purchase Order: ${po.metadata.poNumber}`;
    cellAppSub.font = { name: "Arial", size: 10, italic: true, color: { argb: "475569" } };
    cellAppSub.alignment = { vertical: "middle", horizontal: "left" };
    
    appWorksheet.getRow(2).height = 25;
    appWorksheet.getRow(3).height = 18;
    
    let appRowIdx = 5;
    (po.appendixItems || []).forEach((item) => {
      appWorksheet.getRow(appRowIdx).height = 22;
      appWorksheet.mergeCells(`B${appRowIdx}:C${appRowIdx}`);
      const cTitle = appWorksheet.getCell(`B${appRowIdx}`);
      cTitle.value = item.title;
      cTitle.font = { name: "Arial", size: 11, bold: true, color: { argb: "1E40AF" } };
      cTitle.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "F1F5F9" }
      };
      cTitle.alignment = { vertical: "middle", indent: 1 };
      
      // Border header
      for (let c = 2; c <= 3; c++) {
        appWorksheet.getCell(appRowIdx, c).border = {
          top: { style: "thin", color: { argb: "94A3B8" } },
          bottom: { style: "thin", color: { argb: "CBD5E1" } },
          left: c === 2 ? { style: "thin", color: { argb: "94A3B8" } } : undefined,
          right: c === 3 ? { style: "thin", color: { argb: "94A3B8" } } : undefined
        };
      }
      
      appRowIdx++;
      appWorksheet.getRow(appRowIdx).height = 42;
      appWorksheet.mergeCells(`B${appRowIdx}:C${appRowIdx}`);
      const cContent = appWorksheet.getCell(`B${appRowIdx}`);
      cContent.value = item.content;
      cContent.font = { name: "Arial", size: 10, color: { argb: "334155" } };
      cContent.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      
      // Border content
      for (let c = 2; c <= 3; c++) {
        appWorksheet.getCell(appRowIdx, c).border = {
          bottom: { style: "thin", color: { argb: "CBD5E1" } },
          left: c === 2 ? { style: "thin", color: { argb: "94A3B8" } } : undefined,
          right: c === 3 ? { style: "thin", color: { argb: "94A3B8" } } : undefined
        };
      }
      
      appRowIdx += 2; // leave a blank row
    });
  }

  // File download trigger
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Template_PO_${po.metadata.poNumber.replace(/\//g, "-")}.xlsx`);
};

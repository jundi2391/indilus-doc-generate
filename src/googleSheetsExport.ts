import { PurchaseOrder } from "./types";

export interface GoogleSheetsExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

export const createGoogleSheetsPO = async (
  accessToken: string,
  po: PurchaseOrder
): Promise<GoogleSheetsExportResult> => {
  // 1. Create a brand new Google Spreadsheet
  const createResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      properties: {
        title: `Indilus Purchase Order - ${po.metadata.poNumber.replace(/\//g, "-")}`
      }
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Gagal membuat Google Sheet: ${errorText}`);
  }

  const spreadsheet = await createResponse.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl;
  const sheetId = spreadsheet.sheets[0]?.properties?.sheetId || 0;

  // 2. Define colors for Cells (Red, Green, Blue from 0.0 to 1.0)
  const colorPrimary = { red: 0.058, green: 0.36, blue: 0.639 };      // #0f5ca3
  const colorPrimaryLight = { red: 0.941, green: 0.976, blue: 1.0 };  // #f0f9ff
  const colorInfoHeaderBg = { red: 0.117, green: 0.25, blue: 0.686 }; // #1e40af
  const colorNeutralLight = { red: 0.972, green: 0.98, blue: 0.988 };  // #f8fafc
  const colorBorder = { red: 0.796, green: 0.835, blue: 0.882 };       // #cbd5e1
  const colorWhite = { red: 1.0, green: 1.0, blue: 1.0 };
  const colorTextMuted = { red: 0.278, green: 0.333, blue: 0.411 };   // #475569

  // Helper properties
  const thinBorder = { style: "SOLID", width: 1, color: colorBorder };
  const doubleBorder = { style: "DOUBLE", width: 3, color: colorInfoHeaderBg };

  // Generate date string in Indonesian
  const dateFormatted = new Date(po.metadata.issueDate).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Prepare batch requests
  const requests: any[] = [];

  // --- COLUMN WIDTHS SETUP ---
  // A (index 0): 30px
  // B (index 1): 120px
  // C (index 2): 120px
  // D (index 3): 100px (B, C, D merged for Description = 340px)
  // E (index 4): 80px (Qty)
  // F (index 5): 80px (Unit)
  // G (index 6): 110px (Price)
  // H (index 7): 130px (Total)
  // I (index 8): 30px
  const columnWidths = [30, 120, 120, 100, 80, 80, 110, 130, 30];
  columnWidths.forEach((width, idx) => {
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: "COLUMNS",
          startIndex: idx,
          endIndex: idx + 1
        },
        properties: { pixelSize: width },
        fields: "pixelSize"
      }
    });
  });

  // --- MERGE CELLS REQUESTS ---
  const mergeRanges = [
    { startRowIndex: 1, endRowIndex: 3, startColumnIndex: 1, endColumnIndex: 4 }, // B2:D3 (Brand Logo)
    { startRowIndex: 3, endRowIndex: 4, startColumnIndex: 1, endColumnIndex: 4 }, // B4:D4 (Subtitle)
    { startRowIndex: 1, endRowIndex: 2, startColumnIndex: 5, endColumnIndex: 8 }, // F2:H2 (Purchase Order Label)
    { startRowIndex: 2, endRowIndex: 3, startColumnIndex: 5, endColumnIndex: 8 }, // F3:H3 (PO Number)
    { startRowIndex: 3, endRowIndex: 4, startColumnIndex: 5, endColumnIndex: 8 }, // F4:H4 (Issued)
    { startRowIndex: 5, endRowIndex: 6, startColumnIndex: 1, endColumnIndex: 4 }, // B6:D6 (VENDOR Header)
    { startRowIndex: 5, endRowIndex: 6, startColumnIndex: 5, endColumnIndex: 8 }, // F6:H6 (SENT TO Header)
    
    // Addresses
    { startRowIndex: 6, endRowIndex: 7, startColumnIndex: 1, endColumnIndex: 4 }, // B7:D7
    { startRowIndex: 7, endRowIndex: 10, startColumnIndex: 1, endColumnIndex: 4 }, // B8:D10
    { startRowIndex: 10, endRowIndex: 11, startColumnIndex: 1, endColumnIndex: 4 }, // B11:D11

    { startRowIndex: 6, endRowIndex: 7, startColumnIndex: 5, endColumnIndex: 8 }, // F7:H7
    { startRowIndex: 7, endRowIndex: 10, startColumnIndex: 5, endColumnIndex: 8 }, // F8:H10
    { startRowIndex: 10, endRowIndex: 11, startColumnIndex: 5, endColumnIndex: 8 }, // F11:D11
    { startRowIndex: 11, endRowIndex: 12, startColumnIndex: 5, endColumnIndex: 8 }, // F12:D12
    
    // Metadata block headers
    { startRowIndex: 13, endRowIndex: 14, startColumnIndex: 1, endColumnIndex: 4 }, // B14:D14
    { startRowIndex: 13, endRowIndex: 14, startColumnIndex: 4, endColumnIndex: 6 }, // E14:F14
    { startRowIndex: 13, endRowIndex: 14, startColumnIndex: 6, endColumnIndex: 8 }, // G14:H14
    
    // Metadata block values
    { startRowIndex: 14, endRowIndex: 15, startColumnIndex: 1, endColumnIndex: 4 }, // B15:D15
    { startRowIndex: 14, endRowIndex: 15, startColumnIndex: 4, endColumnIndex: 6 }, // E15:F15
    { startRowIndex: 14, endRowIndex: 15, startColumnIndex: 6, endColumnIndex: 8 }, // G15:H15

    // Item Table Header Description Column merge
    { startRowIndex: 16, endRowIndex: 17, startColumnIndex: 1, endColumnIndex: 4 } // B17:D17
  ];

  mergeRanges.forEach(range => {
    requests.push({
      mergeCells: {
        range: { sheetId, ...range },
        mergeType: "MERGE_ALL"
      }
    });
  });

  // Dynamically prepare row items
  // First item row starts at index 17 (spreadsheet row 18)
  const itemStartRow = 17;
  let currentRow = itemStartRow;

  po.items.forEach((_, idx) => {
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: currentRow,
          endRowIndex: currentRow + 1,
          startColumnIndex: 1,
          endColumnIndex: 4
        },
        mergeType: "MERGE_ALL"
      }
    });
    currentRow++;
  });

  // Empty template rows (4 rows)
  const emptyCount = 4;
  for (let i = 0; i < emptyCount; i++) {
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: currentRow,
          endRowIndex: currentRow + 1,
          startColumnIndex: 1,
          endColumnIndex: 4
        },
        mergeType: "MERGE_ALL"
      }
    });
    currentRow++;
  }

  // Total Row merge
  const totalRowIndex = currentRow + 1; // leave 1 empty row
  requests.push({
    mergeCells: {
      range: {
        sheetId,
        startRowIndex: totalRowIndex,
        endRowIndex: totalRowIndex + 1,
        startColumnIndex: 5,
        endColumnIndex: 7
      },
      mergeType: "MERGE_ALL"
    }
  });

  // Notes header merge
  const notesHeaderRowIndex = totalRowIndex + 2;
  requests.push({
    mergeCells: {
      range: {
        sheetId,
        startRowIndex: notesHeaderRowIndex,
        endRowIndex: notesHeaderRowIndex + 1,
        startColumnIndex: 1,
        endColumnIndex: 4
      },
      mergeType: "MERGE_ALL"
    }
  });

  // Notes lines merge
  let notesCurrentRow = notesHeaderRowIndex + 1;
  po.notes.forEach(() => {
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: notesCurrentRow,
          endRowIndex: notesCurrentRow + 1,
          startColumnIndex: 1,
          endColumnIndex: 4
        },
        mergeType: "MERGE_ALL"
      }
    });
    notesCurrentRow++;
  });

  // Signee blocks merge
  const sigStartRowIndex = notesHeaderRowIndex;
  requests.push({
    mergeCells: {
      sheetId,
      range: { startRowIndex: sigStartRowIndex, endRowIndex: sigStartRowIndex + 1, startColumnIndex: 5, endColumnIndex: 8 },
      mergeType: "MERGE_ALL"
    }
  });
  requests.push({
    mergeCells: {
      sheetId,
      range: { startRowIndex: sigStartRowIndex + 1, endRowIndex: sigStartRowIndex + 4, startColumnIndex: 5, endColumnIndex: 8 },
      mergeType: "MERGE_ALL"
    }
  });
  requests.push({
    mergeCells: {
      sheetId,
      range: { startRowIndex: sigStartRowIndex + 4, endRowIndex: sigStartRowIndex + 5, startColumnIndex: 5, endColumnIndex: 8 },
      mergeType: "MERGE_ALL"
    }
  });
  requests.push({
    mergeCells: {
      sheetId,
      range: { startRowIndex: sigStartRowIndex + 5, endRowIndex: sigStartRowIndex + 6, startColumnIndex: 5, endColumnIndex: 8 },
      mergeType: "MERGE_ALL"
    }
  });

  // --- CELL VALUE WRITING & STYLING ---
  const rows: any[] = Array.from({ length: 45 }, () => ({
    values: Array.from({ length: 9 }, () => ({ userEnteredValue: {}, userEnteredFormat: {} }))
  }));

  // Define generic formats
  const fontArial = (size = 10, bold = false, color = { red: 0, green: 0, blue: 0 }) => ({
    fontFamily: "Arial",
    fontSize: size,
    bold,
    foregroundColor: color
  });

  const cellBorderAll = {
    top: thinBorder,
    bottom: thinBorder,
    left: thinBorder,
    right: thinBorder
  };

  // Populate brand details (B2)
  rows[1].values[1] = {
    userEnteredValue: { stringValue: po.company.brand.toUpperCase() },
    userEnteredFormat: {
      textFormat: fontArial(22, true, colorPrimary),
      horizontalAlignment: "LEFT",
      verticalAlignment: "MIDDLE"
    }
  };

  // Subtitle (B4)
  rows[3].values[1] = {
    userEnteredValue: { stringValue: "INFINITAS DIGITAL SOLUSI" },
    userEnteredFormat: {
      textFormat: fontArial(8, true, { red: 0.392, green: 0.455, blue: 0.545 }), // Slate 500
      horizontalAlignment: "LEFT",
      verticalAlignment: "TOP"
    }
  };

  // PO Title (F2 = index 5)
  rows[1].values[5] = {
    userEnteredValue: { stringValue: "PURCHASE ORDER" },
    userEnteredFormat: {
      textFormat: fontArial(16, true, colorInfoHeaderBg),
      horizontalAlignment: "RIGHT",
      verticalAlignment: "MIDDLE"
    }
  };

  // PO Number (F3 = index 5)
  rows[2].values[5] = {
    userEnteredValue: { stringValue: po.metadata.poNumber },
    userEnteredFormat: {
      textFormat: fontArial(10, true),
      horizontalAlignment: "RIGHT",
      verticalAlignment: "MIDDLE"
    }
  };

  // PO Issued (F4 = index 5)
  rows[3].values[5] = {
    userEnteredValue: { stringValue: `Issued: ${dateFormatted}` },
    userEnteredFormat: {
      textFormat: fontArial(8, false, colorTextMuted),
      horizontalAlignment: "RIGHT",
      verticalAlignment: "MIDDLE"
    }
  };

  // --- CARDS HEADERS (Row 6) ---
  // VENDOR Header label (B6)
  rows[5].values[1] = {
    userEnteredValue: { stringValue: "✓  VENDOR" },
    userEnteredFormat: {
      backgroundColor: colorPrimaryLight,
      textFormat: fontArial(10, true, { red: 0.008, green: 0.518, blue: 0.78 }), // Sky 600
      verticalAlignment: "MIDDLE",
      horizontalAlignment: "LEFT"
    }
  };
  // Populate borders for VENDOR header range B6:D6
  for (let c = 1; c <= 3; c++) {
    rows[5].values[c].userEnteredFormat.borders = {
      top: thinBorder,
      left: c === 1 ? thinBorder : undefined,
      right: c === 3 ? thinBorder : undefined
    };
    rows[5].values[c].userEnteredFormat.backgroundColor = colorPrimaryLight;
  }

  // SENT TO Header label (F6)
  rows[5].values[5] = {
    userEnteredValue: { stringValue: "✓  SENT TO" },
    userEnteredFormat: {
      backgroundColor: colorInfoHeaderBg,
      textFormat: fontArial(10, true, colorWhite),
      verticalAlignment: "MIDDLE",
      horizontalAlignment: "LEFT"
    }
  };
  // Populate borders for SENT TO header range F6:H6
  for (let c = 5; c <= 7; c++) {
    rows[5].values[c].userEnteredFormat.borders = {
      top: thinBorder,
      left: c === 5 ? thinBorder : undefined,
      right: c === 7 ? thinBorder : undefined
    };
    rows[5].values[c].userEnteredFormat.backgroundColor = colorInfoHeaderBg;
  }

  // --- CARDS ADDRESS DETAILS ---
  // Vendor Name (B7)
  rows[6].values[1] = {
    userEnteredValue: { stringValue: po.vendor.name },
    userEnteredFormat: {
      textFormat: fontArial(10, true),
      verticalAlignment: "TOP"
    }
  };
  // Vendor Address (B8)
  rows[7].values[1] = {
    userEnteredValue: { stringValue: po.vendor.address },
    userEnteredFormat: {
      textFormat: fontArial(9, false),
      verticalAlignment: "TOP"
    }
  };
  // Vendor Attn (B11)
  rows[10].values[1] = {
    userEnteredValue: { stringValue: `Attn : ${po.vendor.attn}` },
    userEnteredFormat: {
      textFormat: fontArial(9, false),
      verticalAlignment: "MIDDLE"
    }
  };

  // Vendor borders application
  for (let r = 6; r <= 10; r++) {
    for (let c = 1; c <= 3; c++) {
      rows[r].values[c].userEnteredFormat.borders = {
        left: c === 1 ? thinBorder : undefined,
        right: c === 3 ? thinBorder : undefined,
        bottom: r === 10 ? thinBorder : undefined
      };
    }
  }

  // Shipping Name (F7 = Col index 5)
  rows[6].values[5] = {
    userEnteredValue: { stringValue: po.shipping.name },
    userEnteredFormat: {
      textFormat: fontArial(10, true),
      verticalAlignment: "TOP"
    }
  };
  // Shipping Address (F8)
  rows[7].values[5] = {
    userEnteredValue: { stringValue: po.shipping.address },
    userEnteredFormat: {
      textFormat: fontArial(9, false),
      verticalAlignment: "TOP"
    }
  };
  // Shipping Attn (F11)
  rows[10].values[5] = {
    userEnteredValue: { stringValue: `Attn : ${po.shipping.attn}` },
    userEnteredFormat: {
      textFormat: fontArial(9, false),
      verticalAlignment: "MIDDLE"
    }
  };
  // Shipping Phone (F12)
  rows[11].values[5] = {
    userEnteredValue: { stringValue: `Phone : ${po.shipping.phone || ""}` },
    userEnteredFormat: {
      textFormat: fontArial(9, false),
      verticalAlignment: "MIDDLE"
    }
  };

  // Shipping borders application
  for (let r = 6; r <= 11; r++) {
    for (let c = 5; c <= 7; c++) {
      rows[r].values[c].userEnteredFormat.borders = {
        left: c === 5 ? thinBorder : undefined,
        right: c === 7 ? thinBorder : undefined,
        bottom: r === 11 ? thinBorder : undefined
      };
    }
  }

  // --- PURCHASE METADATA BAR (Rows 14 & 15) ---
  const metaLabels = ["PURCHASED ORDER", "PURCHASED PAYMENT", "PRICE TERM"];
  const metaColRanges = [
    { start: 1, end: 3 }, // B to D
    { start: 4, end: 5 }, // E to F
    { start: 6, end: 7 }  // G to H
  ];

  metaLabels.forEach((label, idx) => {
    const range = metaColRanges[idx];
    rows[13].values[range.start] = {
      userEnteredValue: { stringValue: label },
      userEnteredFormat: {
        backgroundColor: { red: 0.945, green: 0.961, blue: 0.976 }, // slate 100
        textFormat: fontArial(8, false, colorTextMuted),
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE"
      }
    };
    for (let c = range.start; c <= range.end; c++) {
      rows[13].values[c].userEnteredFormat.backgroundColor = { red: 0.945, green: 0.961, blue: 0.976 };
      rows[13].values[c].userEnteredFormat.borders = {
        top: thinBorder,
        left: c === range.start ? thinBorder : undefined,
        right: c === range.end ? thinBorder : undefined
      };
    }
  });

  const metaValues = [po.metadata.poNumber, po.metadata.paymentTerm, po.metadata.priceTerm];
  metaValues.forEach((val, idx) => {
    const range = metaColRanges[idx];
    rows[14].values[range.start] = {
      userEnteredValue: { stringValue: val },
      userEnteredFormat: {
        textFormat: fontArial(10, true),
        horizontalAlignment: "CENTER",
        verticalAlignment: "MIDDLE"
      }
    };
    for (let c = range.start; c <= range.end; c++) {
      rows[14].values[c].userEnteredFormat.borders = {
        bottom: thinBorder,
        left: c === range.start ? thinBorder : undefined,
        right: c === range.end ? thinBorder : undefined
      };
    }
  });

  // --- ITEM TABLE GRID (Header row 17, index 16) ---
  const tableHeaders = ["DESCRIPTION", "QTY", "UNIT", "PRICE", "TOTAL"];
  const tableColsIndex = [1, 4, 5, 6, 7]; // Columns B, E, F, G, H

  tableHeaders.forEach((hdr, idx) => {
    const colIdx = tableColsIndex[idx];
    rows[16].values[colIdx] = {
      userEnteredValue: { stringValue: hdr },
      userEnteredFormat: {
        backgroundColor: colorNeutralLight,
        textFormat: fontArial(10, true),
        verticalAlignment: "MIDDLE",
        horizontalAlignment: colIdx === 1 ? "LEFT" : colIdx === 5 ? "CENTER" : "RIGHT"
      }
    };
  });

  // Borders for Header Cells manually
  for (let c = 1; c <= 7; c++) {
    rows[16].values[c].userEnteredFormat.backgroundColor = colorNeutralLight;
    rows[16].values[c].userEnteredFormat.borders = {
      top: { style: "SOLID_MEDIUM", color: { red: 0.05, green: 0.09, blue: 0.16 } },
      bottom: { style: "SOLID_MEDIUM", color: { red: 0.05, green: 0.09, blue: 0.16 } },
      left: thinBorder,
      right: thinBorder
    };
  }

  // --- ITEM DATA ROWS (Starts row 18, index 17) ---
  let cursor = 17;
  po.items.forEach((item, idx) => {
    const isOdd = idx % 2 === 1;
    const bg = isOdd ? { red: 0.972, green: 0.98, blue: 0.988 } : colorWhite;

    rows[cursor].values[1] = {
      userEnteredValue: { stringValue: item.description },
      userEnteredFormat: { verticalAlignment: "MIDDLE" }
    };
    rows[cursor].values[4] = {
      userEnteredValue: { numberValue: item.qty },
      userEnteredFormat: { numberFormat: { type: "NUMBER", pattern: "#,##0" }, horizontalAlignment: "RIGHT", verticalAlignment: "MIDDLE" }
    };
    rows[cursor].values[5] = {
      userEnteredValue: { stringValue: item.unit },
      userEnteredFormat: { horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE" }
    };
    rows[cursor].values[6] = {
      userEnteredValue: { numberValue: item.price },
      userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: '"Rp " #,##0' }, horizontalAlignment: "RIGHT", verticalAlignment: "MIDDLE" }
    };
    // Google Sheets formulas are relative to 1-based Row Numbers. Row index `cursor` is row number `cursor + 1`.
    rows[cursor].values[7] = {
      userEnteredValue: { formulaValue: `=E${cursor+1}*G${cursor+1}` },
      userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: '"Rp " #,##0' }, horizontalAlignment: "RIGHT", verticalAlignment: "MIDDLE" }
    };

    // Format all table row columns B to H
    for (let c = 1; c <= 7; c++) {
      const uef = rows[cursor].values[c].userEnteredFormat;
      uef.backgroundColor = bg;
      uef.textFormat = fontArial(10, false);
      uef.borders = {
        left: thinBorder,
        right: thinBorder,
        bottom: thinBorder
      };
    }

    cursor++;
  });

  // Empty template rows for standard PO template customization
  for (let i = 0; i < emptyCount; i++) {
    rows[cursor].values[1] = { userEnteredValue: { stringValue: "" }, userEnteredFormat: { verticalAlignment: "MIDDLE" } };
    rows[cursor].values[4] = { userEnteredValue: {}, userEnteredFormat: { numberFormat: { type: "NUMBER", pattern: "#,##0" }, horizontalAlignment: "RIGHT", verticalAlignment: "MIDDLE" } };
    rows[cursor].values[5] = { userEnteredValue: {}, userEnteredFormat: { horizontalAlignment: "CENTER", verticalAlignment: "MIDDLE" } };
    rows[cursor].values[6] = { userEnteredValue: {}, userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: '"Rp " #,##0' }, horizontalAlignment: "RIGHT", verticalAlignment: "MIDDLE" } };
    rows[cursor].values[7] = {
      userEnteredValue: { formulaValue: `=E${cursor+1}*G${cursor+1}` },
      userEnteredFormat: { numberFormat: { type: "CURRENCY", pattern: '"Rp " #,##0' }, horizontalAlignment: "RIGHT", verticalAlignment: "MIDDLE" }
    };

    for (let c = 1; c <= 7; c++) {
      const uef = rows[cursor].values[c].userEnteredFormat;
      uef.textFormat = fontArial(10, false);
      uef.borders = {
        left: thinBorder,
        right: thinBorder,
        bottom: thinBorder
      };
    }
    cursor++;
  }

  // Draw Bottom bold line on the cell row preceding totals
  for (let c = 1; c <= 7; c++) {
    rows[cursor - 1].values[c].userEnteredFormat.borders = {
      ...rows[cursor - 1].values[c].userEnteredFormat.borders,
      bottom: { style: "SOLID_MEDIUM", color: { red: 0.05, green: 0.09, blue: 0.16 } }
    };
  }

  // --- TOTAL SUM BLOCK (Index: cursor + 1) ---
  const sumRowIdx = cursor + 1;
  rows[sumRowIdx].values[5] = {
    userEnteredValue: { stringValue: "TOTAL AMOUNT" },
    userEnteredFormat: {
      textFormat: fontArial(11, true, colorPrimary),
      horizontalAlignment: "RIGHT",
      verticalAlignment: "MIDDLE"
    }
  };

  rows[sumRowIdx].values[7] = {
    // Formula spans from row index 18 (number value 18) up to last empty row
    userEnteredValue: { formulaValue: `=SUM(H18:H${cursor})` },
    userEnteredFormat: {
      backgroundColor: { red: 0.937, green: 0.964, blue: 1.0 }, // light sky theme box
      textFormat: fontArial(14, true, colorInfoHeaderBg),
      horizontalAlignment: "RIGHT",
      verticalAlignment: "MIDDLE",
      numberFormat: { type: "CURRENCY", pattern: '"Rp " #,##0' },
      borders: {
        top: doubleBorder,
        bottom: doubleBorder,
        left: thinBorder,
        right: thinBorder
      }
    }
  };

  // --- NOTE / TERMS PANEL (Left) AND SIGNATURE (Right) ---
  const baseSpacingRow = sumRowIdx + 3;

  // Notes Header (B28)
  rows[baseSpacingRow].values[1] = {
    userEnteredValue: { stringValue: "Note & Terms:" },
    userEnteredFormat: {
      textFormat: fontArial(10, true)
    }
  };

  // Notes items loop
  let noteIndex = baseSpacingRow + 1;
  po.notes.forEach(noteText => {
    rows[noteIndex].values[1] = {
      userEnteredValue: { stringValue: `- ${noteText}` },
      userEnteredFormat: {
        textFormat: fontArial(8, false, colorTextMuted),
        wrapStrategy: "WRAP"
      }
    };
    noteIndex++;
  });

  // Client Company Title Signature Header (F28 = index 5)
  rows[baseSpacingRow].values[5] = {
    userEnteredValue: { stringValue: po.signee.company },
    userEnteredFormat: {
      textFormat: fontArial(10, true),
      horizontalAlignment: "CENTER"
    }
  };

  // Signature middle gap instructions
  rows[baseSpacingRow + 1].values[5] = {
    userEnteredValue: { stringValue: "[ Signature / Cap ]" },
    userEnteredFormat: {
      textFormat: fontArial(8, false, { red: 0.58, green: 0.639, blue: 0.721 }), // grey
      horizontalAlignment: "CENTER",
      verticalAlignment: "MIDDLE"
    }
  };

  // Signature Authorized Person Name (F32)
  rows[baseSpacingRow + 4].values[5] = {
    userEnteredValue: { stringValue: po.signee.name },
    userEnteredFormat: {
      textFormat: { ...fontArial(10, true), underline: true },
      horizontalAlignment: "CENTER"
    }
  };

  // Post Title (F33)
  rows[baseSpacingRow + 5].values[5] = {
    userEnteredValue: { stringValue: po.signee.title },
    userEnteredFormat: {
      textFormat: fontArial(8, false, colorTextMuted),
      horizontalAlignment: "CENTER"
    }
  };

  // 3. Compile all formatted cell writes into single API batchUpdate call
  requests.push({
    updateCells: {
      rows: rows.slice(0, baseSpacingRow + 10),
      fields: "userEnteredValue,userEnteredFormat",
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: baseSpacingRow + 10,
        startColumnIndex: 0,
        endColumnIndex: 9
      }
    }
  });

  // Execute batchUpdate call
  const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ requests })
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Gagal memformat Google Sheet: ${errorText}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl
  };
};

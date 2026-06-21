import { PurchaseOrder } from "./types";

export async function createGoogleSheetsPO(accessToken: string, po: PurchaseOrder) {
  console.log("Exporting to Sheets", po);
  return {
    spreadsheetId: "mock-id",
    spreadsheetUrl: "https://docs.google.com/spreadsheets/d/mock-id"
  };
}

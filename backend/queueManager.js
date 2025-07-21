import { google } from "googleapis";
import { SHEET_ID, GOOGLE_CREDENTIALS_PATH } from "./config.js";
import fs from "fs";

let queue = [];
let counters = [];
let counterCount = 3; // default
let sheetRows = [];

// Authenticate with Google Sheets
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_CREDENTIALS_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth: await auth.getClient() });
}

// Initialize counters if not already
function ensureCounters() {
  if (counters.length !== counterCount) {
    counters = Array.from({ length: counterCount }, (_, i) => ({
      id: i + 1,
      status: "available",
      student: null,
      nextStudent: null,
    }));
  }
}

// Fetch students from Google Sheets and update queue/counters
export async function pollAndSync() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Sheet1",
  });
  const rows = res.data.values;
  if (!rows || rows.length < 2) return;
  const header = rows[0];
  sheetRows = rows.slice(1).map((row, i) => {
    const obj = {};
    header.forEach((h, idx) => (obj[h] = row[idx] || ""));
    obj._rowIndex = i + 2;
    return obj;
  });
  // Only students with Room Allotted = No
  const pending = sheetRows.filter((s) => (s["Room Allotted"] || "").toLowerCase() === "no");

  ensureCounters();

  // Remove students who are no longer pending from counters
  counters.forEach(counter => {
    if (
      counter.student &&
      !pending.find(s => s.RegNo === counter.student.RegNo)
    ) {
      counter.student = null;
      counter.status = "available";
    }
  });

  // Build a set of RegNos already assigned to counters
  const assignedRegNos = new Set(
    counters.filter(c => c.student).map(c => c.student.RegNo)
  );

  // Fill available counters with next students from the queue
  let queueIndex = 0;
  counters.forEach(counter => {
    if (!counter.student) {
      // Find the next pending student not already assigned
      let nextStudent = null;
      while (queueIndex < pending.length) {
        if (!assignedRegNos.has(pending[queueIndex].RegNo)) {
          nextStudent = pending[queueIndex];
          assignedRegNos.add(nextStudent.RegNo);
          break;
        }
        queueIndex++;
      }
      if (nextStudent) {
        counter.student = nextStudent;
        counter.status = "busy";
      } else {
        counter.student = null;
        counter.status = "available";
      }
    }
  });

  // Build the queue: all pending students not assigned to counters
  queue = pending.filter(s => !assignedRegNos.has(s.RegNo));

  // For display: set nextStudent for available counters
  counters.forEach(counter => {
    counter.nextStudent = counter.status === "available" ? queue[0] || null : null;
  });
}

export function getQueue() {
  return queue;
}

export function getCounters() {
  return counters.map(c => ({ ...c }));
}

export async function markDone(counterId) {
  const counter = counters.find((c) => c.id === counterId);
  if (counter && counter.student) {
    await updateSheetRoomAllotted(counter.student._rowIndex);
    // The next poll will update assignments
  }
}

export async function skipStudent(counterId) {
  const counter = counters.find((c) => c.id === counterId);
  if (counter && counter.student) {
    await updateSheetRoomSkipped(counter.student._rowIndex);
    // The next poll will update assignments
  }
}

async function updateSheetRoomAllotted(rowIndex) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Sheet1!E${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [["Yes"]] },
  });
}

async function updateSheetRoomSkipped(rowIndex) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Sheet1!E${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [["Skip"]] },
  });
}

export function setCounterCount(count) {
  counterCount = count;
  // Reset counters to match new count
  counters = [];
} 
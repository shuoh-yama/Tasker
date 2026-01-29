import { google } from "googleapis";
import { Task, TeamMember, TaskCategory, TaskPriority } from "./types";

// Environment variables
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const TAB_TITLE = process.env.GOOGLE_SHEET_TITLE || "Tasks";

// Robust Private Key Parsing
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || "";

// Aggressive cleaning:
// 1. Remove all quotes
PRIVATE_KEY = PRIVATE_KEY.replace(/["']/g, "");
// 2. Remove the header and footer (we will re-add them to be safe)
PRIVATE_KEY = PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/g, "");
PRIVATE_KEY = PRIVATE_KEY.replace(/-----END PRIVATE KEY-----/g, "");
// 3. Remove all newlines (literal \n and actual newlines) and spaces and random backslashes
PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, "");
PRIVATE_KEY = PRIVATE_KEY.replace(/\s+/g, "");
PRIVATE_KEY = PRIVATE_KEY.replace(/\\/g, "");

// 4. Re-construct the PEM format
PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----\n${PRIVATE_KEY}\n-----END PRIVATE KEY-----\n`;

if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !SHEET_ID) {
    console.error("Missing Google Sheets credentials in .env");
    console.error("Email:", !!SERVICE_ACCOUNT_EMAIL);
    console.error("Key Present:", !!PRIVATE_KEY);
    console.error("SheetID:", !!SHEET_ID);
} else {
    // console.log("Credentials loaded.");
}

const auth = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const MEMBERS_TAB = "Members";

// Headers
const TASKS_HEADERS = ["id", "memberId", "content", "weight", "isDone", "createdAt", "category", "workWeek"];
const MEMBERS_HEADERS = ["email", "name", "avatarUrl", "createdAt"]; // email is ID

async function getSheetData(range: string) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range,
        });
        return response.data.values || [];
    } catch (e) {
        console.error("Error fetching sheet data:", e);
        return [];
    }
}

async function appendRow(range: string, row: string[]) {
    await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range,
        valueInputOption: "RAW",
        requestBody: { values: [row] },
    });
}

// === Members Logic ===
export async function getMembers(): Promise<TeamMember[]> {
    const rows = await getSheetData(MEMBERS_TAB);
    if (rows.length === 0) return [];

    // Assuming Header Row: email, name, avatarUrl, createdAt, maxPoints
    return rows.slice(1).map(row => ({
        id: row[0], // Email is ID
        name: row[1],
        email: row[0],
        avatarUrl: row[2],
        maxPoints: Number(row[4]) || 15, // Column E, default 15
        color: '#3b82f6', // Default color for now
    }));
}

export async function ensureMember(user: { email: string; name: string; image?: string }) {
    const rows = await getSheetData(MEMBERS_TAB);

    // Check if headers exist
    if (rows.length === 0) {
        await appendRow(MEMBERS_TAB, MEMBERS_HEADERS);
    }

    // Find existing member row index
    const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === user.email);

    if (rowIndex === -1) {
        // New member - append row with initial name from Google account
        await appendRow(MEMBERS_TAB, [
            user.email,
            user.name, // Initial name from Google (can be edited manually in sheet)
            user.image || "",
            Date.now().toString()
        ]);
    } else {
        // Existing member - only update avatarUrl (column C), NOT name
        // Name (column B) is manually managed in the spreadsheet
        const sheetRow = rowIndex + 1; // 1-based for Sheets API

        await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${MEMBERS_TAB}!C${sheetRow}`, // Only column C (avatarUrl)
            valueInputOption: "RAW",
            requestBody: {
                values: [[user.image || ""]]
            },
        });
    }
}

// === Categories Logic ===
export interface Category {
    id: string;
    name: string;
    defaultPoints: number;
}

const CATEGORIES_TAB = "Categories";

export async function getCategories(): Promise<Category[]> {
    const rows = await getSheetData(CATEGORIES_TAB);
    if (rows.length === 0) return [];

    // Assuming Header Row: id, name, defaultPoints
    return rows.slice(1).map(row => ({
        id: row[0],
        name: row[1],
        defaultPoints: Number(row[2]) || 1,
    }));
}

// === Tasks Logic ===
export async function getTasks(filterEmail?: string): Promise<Task[]> {
    const rows = await getSheetData(TAB_TITLE); // "Tasks"

    if (rows.length === 0) {
        try {
            // Init headers if empty
            await appendRow(TAB_TITLE, TASKS_HEADERS);
        } catch (e) {
            console.error("Failed to init headers", e);
        }
        return [];
    }

    const allTasks = rows.slice(1).map((row) => ({
        id: row[0],
        memberId: row[1],
        content: row[2],
        weight: Number(row[3]),
        isDone: row[4] === "TRUE",
        createdAt: Number(row[5]),
        category: (row[6] as TaskCategory) || 'other',
        workWeek: row[7] || "2024-01-01",
        notes: row[8] || "",
        priority: (row[9] as TaskPriority) || undefined, // Column J
        repeatWeekly: row[10] === "TRUE", // Column K
    })) as Task[];

    if (filterEmail) {
        return allTasks.filter(t => t.memberId === filterEmail);
    } else if (filterEmail === null) {
        // If explicit null, return all
        return allTasks;
    } else {
        // Default: return all
        return allTasks;
    }
}

export async function addTask(task: Task) {
    const row = [
        task.id,
        task.memberId,
        task.content,
        task.weight.toString(),
        task.isDone ? "TRUE" : "FALSE",
        task.createdAt.toString(),
        task.category,
        task.workWeek,
        task.notes || "",
        task.priority || "", // Column J
        task.repeatWeekly ? "TRUE" : "FALSE", // Column K
    ];
    await appendRow(TAB_TITLE, row);
}

// Re-using exiting update/delete logic but ensure TAB_TITLE is used
export async function updateTaskStatus(id: string, isDone: boolean) {
    const rows = await getSheetData(TAB_TITLE);
    const rowIndex = rows.findIndex((r) => r[0] === id); // r[0] is ID

    if (rowIndex === -1) return;
    const sheetRow = rowIndex + 1; // 1-based index (API)

    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_TITLE}!E${sheetRow}`, // E is 'isDone'
        valueInputOption: "RAW",
        requestBody: { values: [[isDone ? "TRUE" : "FALSE"]] },
    });
}

export async function updateTask(id: string, updates: { content?: string; weight?: number; category?: string; notes?: string; priority?: string; repeatWeekly?: boolean }) {
    const rows = await getSheetData(TAB_TITLE);
    const rowIndex = rows.findIndex((r) => r[0] === id);

    if (rowIndex === -1) return;
    const sheetRow = rowIndex + 1;

    const currentRow = rows[rowIndex];
    const newContent = updates.content ?? currentRow[2];
    const newWeight = updates.weight?.toString() ?? currentRow[3];
    const newCategory = updates.category ?? currentRow[6];
    const newNotes = updates.notes ?? currentRow[8] ?? "";
    const newPriority = updates.priority ?? currentRow[9] ?? "";
    const newRepeatWeekly = updates.repeatWeekly !== undefined ? (updates.repeatWeekly ? "TRUE" : "FALSE") : (currentRow[10] || "FALSE");

    // Update columns C-D (content, weight)
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_TITLE}!C${sheetRow}:D${sheetRow}`,
        valueInputOption: "RAW",
        requestBody: { values: [[newContent, newWeight]] },
    });

    // Update columns G, I, J, K (category, notes, priority, repeatWeekly)
    await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB_TITLE}!G${sheetRow}:K${sheetRow}`,
        valueInputOption: "RAW",
        requestBody: { values: [[newCategory, "", newNotes, newPriority, newRepeatWeekly]] },
    });
}

export async function deleteTask(id: string) {
    // Same delete logic, but using TAB_TITLE
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheet = meta.data.sheets?.find(s => s.properties?.title === TAB_TITLE);
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId === undefined) return;

    const rows = await getSheetData(TAB_TITLE);
    const rowIndex = rows.findIndex((r) => r[0] === id); // r[0] is ID

    if (rowIndex === -1) return;
    const sheetRowIndex = rowIndex; // API uses 0-based for batchUpdate DELETE

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: "ROWS",
                            startIndex: sheetRowIndex,
                            endIndex: sheetRowIndex + 1,
                        },
                    },
                },
            ],
        },
    });
}

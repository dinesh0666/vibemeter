import * as vscode from "vscode";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize the AI backend.
 * Google Gemini (gemini-2.0-flash) is the primary engine powering VibeMeter.
 * VS Code Language Model API is the optional fallback.
 */
export function initAI(extensionPath: string): void {
    const envPath = path.join(extensionPath, ".env");
    let apiKey = process.env.GEMINI_API_KEY || "";

    try {
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, "utf-8");
            const match = envContent.match(/GEMINI_API_KEY=(.+)/);
            if (match) {
                apiKey = match[1].trim();
            }
        }
    } catch (err) {
        console.error("VibeMeter: Failed to read .env:", err);
    }

    if (apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
        console.log("VibeMeter: Gemini API initialized ✅");
    } else {
        console.warn("VibeMeter: No GEMINI_API_KEY found — will try VS Code LM fallback");
    }
}

/**
 * Send a prompt to Google Gemini (primary) or VS Code LM API (fallback).
 * Includes retry with exponential backoff for Gemini.
 */
export async function askAI(prompt: string): Promise<string> {
    // --- PRIMARY: Google Gemini ---
    if (genAI) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
                const result = await model.generateContent(prompt);
                return result.response.text();
            } catch (err) {
                console.warn(`VibeMeter: Gemini attempt ${attempt + 1} failed:`, err);
                if (attempt < 2) {
                    await sleep(1000 * Math.pow(2, attempt)); // 1s, 2s backoff
                }
            }
        }
        console.warn("VibeMeter: Gemini exhausted retries, trying fallback...");
    }

    // --- FALLBACK: VS Code Language Model API (Copilot) ---
    try {
        const result = await askVSCodeLM(prompt);
        if (result) { return result; }
    } catch (err) {
        console.warn("VibeMeter: VS Code LM fallback also failed:", err);
    }

    return "🤷 All AI backends are unavailable. Check your Gemini API key in .env";
}

/**
 * Fallback: VS Code built-in Language Model API.
 */
async function askVSCodeLM(prompt: string): Promise<string | null> {
    const models = await vscode.lm.selectChatModels({ vendor: "copilot" });
    const model = models[0] ?? (await vscode.lm.selectChatModels())[0];
    if (!model) { return null; }

    const messages = [vscode.LanguageModelChatMessage.User(prompt)];
    const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);

    let result = "";
    for await (const chunk of response.text) {
        result += chunk;
    }
    return result;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Re-export for backward compatibility
export { initAI as initGemini, askAI as askGemini };

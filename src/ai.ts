import * as vscode from "vscode";
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

/**
 * Get the Gemini API key from VS Code settings.
 */
function getApiKey(): string {
    return vscode.workspace.getConfiguration("vibemeter").get<string>("geminiApiKey", "").trim();
}

/**
 * Initialize the AI backend from VS Code settings.
 * Prompts the user to enter their key if not configured.
 */
export async function initAI(_extensionPath: string): Promise<void> {
    const apiKey = getApiKey();

    if (apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
        console.log("VibeMeter: Gemini API initialized ✅");
    } else {
        console.warn("VibeMeter: No Gemini API key in settings — prompting user");
        const entered = await vscode.window.showInputBox({
            prompt: "Enter your Google Gemini API key to enable the AI Vibe Coach",
            placeHolder: "AIza...",
            password: true,
            ignoreFocusOut: true,
        });
        if (entered && entered.trim()) {
            await vscode.workspace.getConfiguration("vibemeter").update(
                "geminiApiKey",
                entered.trim(),
                vscode.ConfigurationTarget.Global
            );
            genAI = new GoogleGenerativeAI(entered.trim());
            vscode.window.showInformationMessage("VibeMeter: Gemini API key saved ✅");
        } else {
            vscode.window.showWarningMessage("VibeMeter: No API key — AI Coach will use Copilot fallback.");
        }
    }
}

/**
 * Re-initialise if the setting changes while VS Code is open.
 */
export function onConfigChange(e: vscode.ConfigurationChangeEvent): void {
    if (e.affectsConfiguration("vibemeter.geminiApiKey")) {
        const apiKey = getApiKey();
        genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        console.log(apiKey ? "VibeMeter: Gemini key updated ✅" : "VibeMeter: Gemini key cleared");
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

    return "🤷 All AI backends are unavailable. Add your Gemini API key in Settings → VibeMeter."; 
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

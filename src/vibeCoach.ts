import * as vscode from "vscode";
import { askAI } from "./ai";
import { VibeState } from "./vibeEngine";

/**
 * AI Vibe Coach — sends your current session stats + code context
 * to Gemini for a fun, smart, personalized coaching session.
 */
export async function runVibeCoach(state: VibeState): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    let codeSnippet = "*(No file open)*";
    let language = "unknown";

    if (editor) {
        language = editor.document.languageId;
        const doc = editor.document;
        const cursorLine = editor.selection.active.line;
        const start = Math.max(0, cursorLine - 50);
        const end   = Math.min(doc.lineCount - 1, cursorLine + 50);
        codeSnippet = doc.getText(new vscode.Range(start, 0, end, 0));
    }

    // ─── Build the prompt ───────────────────────────────────────────────────
    const prompt = `You are a witty, hype, but genuinely smart AI coding coach.
You're the vibe check your dev session deserves — equal parts hype man and senior engineer.

Current session stats:
- Vibe Level : ${state.level} ${state.label} (${state.score}/100)
- Typing speed: ${state.keystrokesPerMin} keystrokes/min
- Total keystrokes: ${state.totalKeystrokes}
- Saves: ${state.saves}
- Active errors: ${state.errors}
- Flow time: ${state.flowMinutes} min
- Language: ${language}

Active code snippet (up to 100 lines around cursor):
\`\`\`${language}
${codeSnippet.substring(0, 3000)}
\`\`\`

Give a punchy vibe check (4-5 sentences max). Rules:
1. Comment on their vibe state — hype them if they're cooking, roast gently if they're slacking.
2. Make ONE sharp, specific observation about the visible code (naming, logic, structure, etc.).
3. End with a concrete power tip or fun challenge to level up their session.
Use emojis. Be that coach nobody asked for but everyone needed.`;

    // ─── Output channel ─────────────────────────────────────────────────────
    const ch = vscode.window.createOutputChannel("🎯 VibeMeter — AI Coach");
    ch.clear();
    ch.appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    ch.appendLine("  🎯  AI VIBE COACH — Session Check-In");
    ch.appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    ch.appendLine("");
    ch.appendLine(`  Vibe  : ${state.level} ${state.label}  (${state.score}/100)`);
    ch.appendLine(`  KPM   : ${state.keystrokesPerMin}  |  Saves: ${state.saves}  |  Errors: ${state.errors}`);
    ch.appendLine(`  Flow  : ${state.flowMinutes} min  |  Language: ${language}`);
    ch.appendLine("");
    ch.appendLine("  ⏳ Consulting the coach...");
    ch.show(true);

    try {
        const result = await askAI(prompt);

        ch.clear();
        ch.appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        ch.appendLine("  🎯  AI VIBE COACH — Session Check-In");
        ch.appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        ch.appendLine("");
        ch.appendLine(`  Vibe  : ${state.level} ${state.label}  (${state.score}/100)`);
        ch.appendLine(`  KPM   : ${state.keystrokesPerMin}  |  Saves: ${state.saves}  |  Errors: ${state.errors}`);
        ch.appendLine(`  Flow  : ${state.flowMinutes} min  |  Language: ${language}`);
        ch.appendLine("");
        ch.appendLine("  📣 The Coach Says:");
        ch.appendLine("");
        result.split("\n").forEach(line => ch.appendLine(`  ${line}`));
        ch.appendLine("");
        ch.appendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        ch.show(true);
    } catch (err) {
        ch.appendLine(`  ❌ Coach is temporarily unavailable: ${err}`);
        ch.show(true);
    }
}

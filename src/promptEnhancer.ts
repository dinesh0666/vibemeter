import * as vscode from "vscode";
import { askAI } from "./ai";

/**
 * Prompt Enhancer — Takes a rough, lazy prompt and uses Gemini
 * to rewrite it into an optimal AI prompt. Meta-prompting at its finest.
 */
export async function enhancePrompt(): Promise<string | null> {
    const editor = vscode.window.activeTextEditor;

    // Get text from selection or ask for input
    let rawPrompt = "";

    if (editor && !editor.selection.isEmpty) {
        rawPrompt = editor.document.getText(editor.selection);
    } else {
        const input = await vscode.window.showInputBox({
            prompt: "Paste your rough prompt — Gemini will supercharge it ⚡",
            placeHolder: "e.g., make a login page",
            ignoreFocusOut: true,
        });
        if (!input) { return null; }
        rawPrompt = input;
    }

    const geminiPrompt = `You're a prompt engineering expert. Rewrite this rough AI prompt into a clear, specific, and effective prompt that will get much better results from any AI coding assistant.

ROUGH PROMPT: "${rawPrompt}"

Rules:
- Keep the developer's intent, amplify the specificity
- Add context hints (language, framework, best practices)
- Structure with clear requirements
- Keep it concise but powerful
- Add a "Bonus" line for extra quality

Format your response EXACTLY:
✨ ENHANCED PROMPT:
[the enhanced prompt]

💡 WHY IT'S BETTER:
[2-3 bullet points explaining the improvements]

🎯 PROMPT SCORE: [X/10] → [Y/10]`;

    const result = await askAI(geminiPrompt);

    // If there was a selection, offer to replace it
    if (editor && !editor.selection.isEmpty) {
        const enhancedMatch = result.match(/✨ ENHANCED PROMPT:\s*\n([\s\S]*?)(?=\n💡|$)/);
        if (enhancedMatch) {
            const action = await vscode.window.showInformationMessage(
                "Replace selection with enhanced prompt?",
                "Replace", "Copy to Clipboard", "Just Show"
            );
            if (action === "Replace") {
                await editor.edit(editBuilder => {
                    editBuilder.replace(editor.selection, enhancedMatch[1].trim());
                });
            } else if (action === "Copy to Clipboard") {
                await vscode.env.clipboard.writeText(enhancedMatch[1].trim());
                vscode.window.showInformationMessage("Enhanced prompt copied! ⚡");
            }
        }
    }

    return result;
}

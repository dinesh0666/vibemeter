import * as vscode from "vscode";
import { VibeState, VibeLevel } from "./vibeEngine";

// GOD MODE cycles through dramatic frames
const GOD_FRAMES = ["⚡ GOD MODE", "💀 GOD MODE", "🔥 GOD MODE", "✨ GOD MODE", "☄️  GOD MODE"];

// Background colours for alarming states
const VIBE_BG: Partial<Record<VibeLevel, string>> = {
    "😴": "statusBarItem.errorBackground",
    "🥶": "statusBarItem.warningBackground",
};

/**
 * VibeStatusBar — live status bar that reacts to the current vibe state.
 * GOD MODE gets a dramatic cycling animation.
 */
export class VibeStatusBar {
    private item: vscode.StatusBarItem;
    private godInterval: ReturnType<typeof setInterval> | undefined;
    private godFrameIdx = 0;

    constructor() {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.item.command = "vibemeter.dashboard";
        this.item.text = "$(sparkle) VibeMeter";
        this.item.tooltip = this.makeTooltip();
        this.item.show();
    }

    /** Called every time VibeEngine emits a new state. */
    update(state: VibeState): void {
        // GOD MODE gets special treatment
        if (state.level === "⚡") {
            this.startGodMode();
        } else {
            this.stopGodMode();
            this.item.text = `${state.level}  ${state.label}`;
        }

        // Background colour
        const bg = VIBE_BG[state.level];
        this.item.backgroundColor = bg ? new vscode.ThemeColor(bg) : undefined;

        // Rich tooltip
        this.item.tooltip = new vscode.MarkdownString(
            `### ${state.level}  VibeMeter — *${state.label}*\n\n` +
            `| Metric | Value |\n|---|---|\n` +
            `| **Vibe Score** | ${state.score} / 100 |\n` +
            `| **KPM** | ${state.keystrokesPerMin} |\n` +
            `| **Saves** | ${state.saves} |\n` +
            `| **Errors** | ${state.errors} |\n` +
            `| **Flow Time** | ${state.flowMinutes} min |\n\n` +
            `---\n\n*Click to open the Vibe Dashboard ✨*\n\n` +
            `\`⌘⇧C\`  AI Coach  |  \`⌘⇧D\`  Dashboard  |  \`⌘⇧K\`  Vibe Check`
        );
        this.item.tooltip.isTrusted = true;
    }

    private makeTooltip(): vscode.MarkdownString {
        const md = new vscode.MarkdownString(
            "### 🎯 VibeMeter\nTracking your vibe...\n\n`⌘⇧D` Dashboard | `⌘⇧C` AI Coach | `⌘⇧K` Quick Check"
        );
        md.isTrusted = true;
        return md;
    }

    private startGodMode(): void {
        if (this.godInterval) { return; }
        this.godInterval = setInterval(() => {
            this.item.text = GOD_FRAMES[this.godFrameIdx % GOD_FRAMES.length];
            this.godFrameIdx++;
        }, 450);
    }

    private stopGodMode(): void {
        if (this.godInterval) {
            clearInterval(this.godInterval);
            this.godInterval = undefined;
        }
    }

    dispose(): void {
        this.stopGodMode();
        this.item.dispose();
    }
}

import * as vscode from "vscode";
import { VibeState } from "./vibeEngine";
import { Achievement } from "./hypeMachine";

interface DashboardData {
    state: VibeState;
    achievements: Achievement[];
    sessionStart: Date;
}

export class VibeDashboard {
    public static currentPanel: VibeDashboard | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    public static createOrShow(context: vscode.ExtensionContext): VibeDashboard {
        const column = vscode.ViewColumn.Beside;
        if (VibeDashboard.currentPanel) {
            VibeDashboard.currentPanel.panel.reveal(column);
            return VibeDashboard.currentPanel;
        }
        const panel = vscode.window.createWebviewPanel(
            "vibemeterDashboard",
            "\u{1F3AF} Vibe Dashboard",
            column,
            { enableScripts: true, retainContextWhenHidden: true }
        );
        VibeDashboard.currentPanel = new VibeDashboard(panel);
        return VibeDashboard.currentPanel;
    }

    public update(data: DashboardData): void {
        this.panel.webview.html = this.buildHtml(data);
    }

    private dispose(): void {
        VibeDashboard.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            this.disposables.pop()?.dispose();
        }
    }

    private buildHtml(data: DashboardData): string {
        const { state, achievements } = data;
        const sessionMins = Math.floor((Date.now() - data.sessionStart.getTime()) / 60_000);
        const unlocked = achievements.filter(a => a.unlocked);
        const locked   = achievements.filter(a => !a.unlocked);

        const scoreColor =
            state.score >= 86 ? "#a78bfa" :
            state.score >= 71 ? "#f97316" :
            state.score >= 51 ? "#3b82f6" :
            state.score >= 31 ? "#22c55e" :
            state.score >= 16 ? "#facc15" : "#ef4444";

        const achCard = (a: Achievement, lock: boolean) =>
            `<div class="card ach-card ${lock ? "locked" : "unlocked"}">` +
            `<span class="ach-emoji">${lock ? "\u{1F512}" : a.emoji}</span>` +
            `<div class="ach-info"><div class="ach-title">${a.title}</div>` +
            `<div class="ach-desc">${a.description}</div></div></div>`;

        const unlockedHtml = unlocked.map(a => achCard(a, false)).join("");
        const lockedHtml   = locked.map(a => achCard(a, true)).join("");

        const unlockedSection = unlocked.length > 0
            ? `<div class="section"><h2>\u{1F3C6} Unlocked (${unlocked.length})</h2>` +
              `<div class="ach-grid">${unlockedHtml}</div></div>`
            : "";
        const lockedSection = locked.length > 0
            ? `<div class="section"><h2>\u{1F512} Locked (${locked.length})</h2>` +
              `<div class="ach-grid">${lockedHtml}</div></div>`
            : "";

        return [
            "<!DOCTYPE html>",
            "<html lang=\"en\">",
            "<head>",
            "<meta charset=\"UTF-8\">",
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">",
            "<title>Vibe Dashboard</title>",
            "<style>",
            "*{margin:0;padding:0;box-sizing:border-box}",
            "body{font-family:var(--vscode-font-family,\'Segoe UI\',sans-serif);background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);padding:28px;line-height:1.6}",
            "::-webkit-scrollbar{width:6px}",
            "::-webkit-scrollbar-thumb{background:var(--vscode-scrollbarSlider-background);border-radius:3px}",
            ".wrap{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:28px}",
            ".hero{text-align:center;padding:40px 24px;background:var(--vscode-sideBar-background);border-radius:16px;border:1px solid var(--vscode-widget-border)}",
            ".hero-emoji{font-size:88px;display:block;animation:float 3s ease-in-out infinite}",
            "@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}",
            ".hero-label{font-size:26px;font-weight:700;margin:12px 0 4px}",
            ".hero-sub{font-size:13px;color:var(--vscode-descriptionForeground)}",
            ".score-wrap{margin-top:20px}",
            ".score-label{display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px}",
            ".score-bar{height:10px;background:var(--vscode-widget-border);border-radius:5px;overflow:hidden}",
            `.score-fill{height:100%;border-radius:5px;background:${scoreColor};width:${state.score}%;transition:width .6s ease}`,
            ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px}",
            ".card{background:var(--vscode-sideBar-background);border:1px solid var(--vscode-widget-border);border-radius:12px;padding:16px}",
            ".stat-value{font-size:32px;font-weight:700;line-height:1;margin-bottom:4px}",
            ".stat-label{font-size:12px;color:var(--vscode-descriptionForeground);text-transform:uppercase;letter-spacing:.6px}",
            "h2{font-size:12px;font-weight:600;color:var(--vscode-descriptionForeground);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}",
            ".ach-grid{display:flex;flex-direction:column;gap:8px}",
            ".ach-card{display:flex;align-items:center;gap:14px;padding:12px 16px}",
            ".ach-emoji{font-size:24px;flex-shrink:0}",
            ".ach-title{font-weight:600;font-size:14px}",
            ".ach-desc{font-size:12px;color:var(--vscode-descriptionForeground)}",
            ".unlocked{border-color:var(--vscode-focusBorder,#007acc)!important}",
            ".locked{opacity:.35}",
            ".section{display:flex;flex-direction:column;gap:10px}",
            ".footer{text-align:center;font-size:11px;color:var(--vscode-descriptionForeground);padding-top:4px}",
            "</style></head><body>",
            "<div class=\"wrap\">",
            "<div class=\"hero\">",
            `<span class="hero-emoji">${state.level}</span>`,
            `<div class="hero-label">${state.label}</div>`,
            `<div class="hero-sub">Session running for ${sessionMins} min</div>`,
            "<div class=\"score-wrap\">",
            `<div class="score-label"><span>Vibe Score</span><span>${state.score} / 100</span></div>`,
            "<div class=\"score-bar\"><div class=\"score-fill\"></div></div>",
            "</div></div>",
            "<div class=\"grid\">",
            `<div class="card"><div class="stat-value">${state.keystrokesPerMin}</div><div class="stat-label">KPM</div></div>`,
            `<div class="card"><div class="stat-value">${state.totalKeystrokes}</div><div class="stat-label">Total Keystrokes</div></div>`,
            `<div class="card"><div class="stat-value">${state.saves}</div><div class="stat-label">Saves</div></div>`,
            `<div class="card"><div class="stat-value">${state.errors}</div><div class="stat-label">Errors</div></div>`,
            `<div class="card"><div class="stat-value">${state.flowMinutes}m</div><div class="stat-label">Flow Time</div></div>`,
            `<div class="card"><div class="stat-value">${unlocked.length}/${achievements.length}</div><div class="stat-label">Achievements</div></div>`,
            "</div>",
            unlockedSection,
            lockedSection,
            "<div class=\"footer\">VibeMeter \u{2022} \u2318\u21e7C for AI Coach | \u2318\u21e7K for Quick Vibe Check</div>",
            "</div></body></html>",
        ].join("\n");
    }
}

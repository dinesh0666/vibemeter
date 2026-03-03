import * as vscode from "vscode";
import { VibeEngine } from "./vibeEngine";
import { HypeMachine } from "./hypeMachine";
import { VibeStatusBar } from "./statusBar";
import { VibeDashboard } from "./dashboard";
import { initAI } from "./ai";
import { runVibeCoach } from "./vibeCoach";

let engine:    VibeEngine    | undefined;
let hype:      HypeMachine   | undefined;
let statusBar: VibeStatusBar | undefined;
const sessionStart = new Date();

export function activate(context: vscode.ExtensionContext) {
    console.log("VibeMeter: Vibe coding mode activated 🔥");

    // ── Core setup ──────────────────────────────────────────────────────────
    initAI(context.extensionPath);

    engine    = new VibeEngine();
    hype      = new HypeMachine();
    statusBar = new VibeStatusBar();

    // Wire VibeEngine → StatusBar + HypeMachine on every update
    const stateListener = engine.onStateChange(state => {
        statusBar!.update(state);
        hype!.update(state);
    });

    // ── Commands ─────────────────────────────────────────────────────────────

    // Open Vibe Dashboard
    const dashboardCmd = vscode.commands.registerCommand("vibemeter.dashboard", () => {
        const dashboard = VibeDashboard.createOrShow(context);
        const state     = engine!.getState();
        const achievements = hype!.getAchievements();
        dashboard.update({ state, achievements, sessionStart });
    });

    // AI Vibe Coach — smart + fun session feedback
    const coachCmd = vscode.commands.registerCommand("vibemeter.coach", async () => {
        const state = engine!.getState();
        await runVibeCoach(state);
    });

    // Show current vibe snapshot as notification
    const vibeCheckCmd = vscode.commands.registerCommand("vibemeter.vibecheck", () => {
        const s = engine!.getState();
        vscode.window.showInformationMessage(
            `${s.level} ${s.label}  •  Score: ${s.score}/100  •  KPM: ${s.keystrokesPerMin}  •  Flow: ${s.flowMinutes}min`
        );
    });

    // ── Register & subscribe ─────────────────────────────────────────────────
    context.subscriptions.push(
        stateListener,
        dashboardCmd,
        coachCmd,
        vibeCheckCmd,
        statusBar,
    );
}

export function deactivate() {
    engine?.dispose();
    statusBar?.dispose();
}

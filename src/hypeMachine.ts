import * as vscode from "vscode";
import { VibeState, VibeLevel } from "./vibeEngine";

// ──────────────────────────────────────────────
//  Achievement catalogue
// ──────────────────────────────────────────────

export interface Achievement {
    id: string;
    emoji: string;
    title: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: Date;
}

const CATALOGUE: Achievement[] = [
    { id: "first_key",   emoji: "⚡", title: "Fingers Are Warm",    description: "Typed your first character",              unlocked: false },
    { id: "first_save",  emoji: "💾", title: "Commitment Issues",   description: "Actually saved your file",                unlocked: false },
    { id: "ks_100",      emoji: "🎯", title: "Warming Up",          description: "100 keystrokes in the session",           unlocked: false },
    { id: "ks_500",      emoji: "💪", title: "Absolute Unit",       description: "500 keystrokes — keys felt that",         unlocked: false },
    { id: "ks_1000",     emoji: "🚀", title: "Keyboard Destroyer",  description: "1 000 keystrokes. RIP keyboard",          unlocked: false },
    { id: "ks_5000",     emoji: "🏋️", title: "Type God",            description: "5 000 keystrokes — are you a bot?",       unlocked: false },
    { id: "saves_5",     emoji: "🗂️", title: "Save Respecter",      description: "5 saves in one session",                  unlocked: false },
    { id: "saves_10",    emoji: "🏆", title: "Save MVP",            description: "10 saves — Ctrl+S is your love language", unlocked: false },
    { id: "flow_5",      emoji: "🌊", title: "In the Flow",         description: "5 minutes of continuous flow state",      unlocked: false },
    { id: "flow_15",     emoji: "🔥", title: "Locked In",           description: "15 minutes straight in flow state",       unlocked: false },
    { id: "flow_30",     emoji: "🧘", title: "Zone Resident",       description: "30 minutes of unbroken flow",             unlocked: false },
    { id: "godmode",     emoji: "⚡", title: "GOD MODE",            description: "Reached the highest vibe level",          unlocked: false },
    { id: "no_errors",   emoji: "✅", title: "Clean Code Vibes",    description: "Zero errors — LSP is proud of you",       unlocked: false },
    { id: "comeback",    emoji: "💪", title: "The Comeback",        description: "Went from Dead Inside to In the Flow",    unlocked: false },
];

// ──────────────────────────────────────────────
//  Hype messages per event
// ──────────────────────────────────────────────

const HYPE: Record<string, string[]> = {
    level_up: [
        "Level UP! Your vibe is evolving 🔥",
        "We going higher! Don't stop now 🚀",
        "The vibes are immaculate rn ✨",
        "You just powered up. Nobody can stop you 💪",
        "The code flows through you 🌊",
    ],
    level_down: [
        "Took a micro-nap mid-sprint, eh? 😴",
        "Vibe dipped a bit — shake it off 🎯",
        "Even legends recharge. Come back stronger ⚡",
        "It's a dip, not a stop. Keep pushing 🙏",
    ],
    idle_nudge: [
        "Hey… you alive in there? 👀",
        "Your code misses you 😢",
        "The cursor is lonely. Come back 🖱️",
        "Tab still open… vibe fading… 🌫️",
        "Bro left the code on read 💀",
    ],
    godmode: [
        "⚡ GOD MODE ACTIVATED. Absolute unit energy 💀",
        "⚡ You are the algorithm now. Don't stop.",
        "⚡ GODMODE — your keyboard is scared of you.",
    ],
};

// ──────────────────────────────────────────────
//  HypeMachine
// ──────────────────────────────────────────────

export class HypeMachine {
    private lastLevel: VibeLevel | null = null;
    private lastIdleNudge = 0;
    private lowestLevelSeen: number = 5; // track comeback
    private achievements: Achievement[] = CATALOGUE.map(a => ({ ...a }));

    private static readonly LEVEL_RANK: Record<VibeLevel, number> = {
        "😴": 0, "🥶": 1, "🧘": 2, "🌊": 3, "🔥": 4, "⚡": 5,
    };

    /** Called every time VibeEngine fires a state update. */
    public update(state: VibeState): void {
        const rank = HypeMachine.LEVEL_RANK[state.level];

        // ── Level change hype ──────────────────
        if (this.lastLevel !== null && this.lastLevel !== state.level) {
            const prevRank = HypeMachine.LEVEL_RANK[this.lastLevel];

            if (rank > prevRank) {
                // levelled up
                if (state.level === "⚡") {
                    this.hype(this.pick(HYPE.godmode));
                } else {
                    this.hype(this.pick(HYPE.level_up));
                }
            } else if (rank < prevRank) {
                this.hype(this.pick(HYPE.level_down));
            }
        }

        // Track the lowest level seen (for comeback achievement)
        if (rank < this.lowestLevelSeen) { this.lowestLevelSeen = rank; }

        this.lastLevel = state.level;

        // ── Idle nudge (at most every 3 min) ──
        if (state.idleSeconds > 180) {
            const now = Date.now();
            if (now - this.lastIdleNudge > 180_000) {
                this.lastIdleNudge = now;
                this.hype(this.pick(HYPE.idle_nudge));
            }
        }

        // ── Achievement checks ──────────────────
        this.checkAchievements(state);
    }

    /** Returns a snapshot of all achievements (for the dashboard). */
    public getAchievements(): Achievement[] {
        return this.achievements.map(a => ({ ...a }));
    }

    // ── Private ──────────────────────────────────

    private checkAchievements(state: VibeState): void {
        const unlock = (id: string) => {
            const a = this.achievements.find(x => x.id === id);
            if (a && !a.unlocked) {
                a.unlocked = true;
                a.unlockedAt = new Date();
                this.celebrate(a);
            }
        };

        if (state.totalKeystrokes >= 1)    { unlock("first_key");  }
        if (state.saves >= 1)              { unlock("first_save"); }
        if (state.totalKeystrokes >= 100)  { unlock("ks_100");     }
        if (state.totalKeystrokes >= 500)  { unlock("ks_500");     }
        if (state.totalKeystrokes >= 1000) { unlock("ks_1000");    }
        if (state.totalKeystrokes >= 5000) { unlock("ks_5000");    }
        if (state.saves >= 5)              { unlock("saves_5");    }
        if (state.saves >= 10)             { unlock("saves_10");   }
        if (state.flowMinutes >= 5)        { unlock("flow_5");     }
        if (state.flowMinutes >= 15)       { unlock("flow_15");    }
        if (state.flowMinutes >= 30)       { unlock("flow_30");    }
        if (state.level === "⚡")          { unlock("godmode");    }
        if (state.errors === 0 && state.totalKeystrokes > 50) { unlock("no_errors"); }

        // Comeback: was dead inside, now in the flow+
        if (this.lowestLevelSeen <= 0 && HypeMachine.LEVEL_RANK[state.level] >= 3) {
            unlock("comeback");
        }
    }

    private celebrate(a: Achievement): void {
        vscode.window.showInformationMessage(
            `${a.emoji} Achievement Unlocked! **${a.title}** — ${a.description}`
        );
    }

    private hype(msg: string): void {
        vscode.window.showInformationMessage(`🎯 VibeMeter: ${msg}`);
    }

    private pick<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}

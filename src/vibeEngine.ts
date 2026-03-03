import * as vscode from "vscode";

// ──────────────────────────────────────────────
//  Types
// ──────────────────────────────────────────────

export type VibeLevel = "😴" | "🥶" | "🧘" | "🌊" | "🔥" | "⚡";

export interface VibeState {
    level: VibeLevel;
    label: string;
    score: number;              // 0–100
    keystrokesPerMin: number;   // KPM in last 60 s
    totalKeystrokes: number;    // session total
    saves: number;              // session saves
    errors: number;             // current editor errors
    flowMinutes: number;        // consecutive mins at 🌊+
    idleSeconds: number;        // seconds since last activity
}

// ──────────────────────────────────────────────
//  Vibe level thresholds (ascending)
// ──────────────────────────────────────────────

const VIBE_SCALE: { min: number; emoji: VibeLevel; label: string }[] = [
    { min: 0,  emoji: "😴", label: "Dead Inside"  },
    { min: 16, emoji: "🥶", label: "Cold Start"   },
    { min: 31, emoji: "🧘", label: "Vibing"       },
    { min: 51, emoji: "🌊", label: "In the Flow"  },
    { min: 71, emoji: "🔥", label: "On Fire"      },
    { min: 86, emoji: "⚡", label: "GOD MODE"     },
];

function scoreToLevel(score: number): { emoji: VibeLevel; label: string } {
    return [...VIBE_SCALE].reverse().find(v => score >= v.min) ?? VIBE_SCALE[0];
}

// ──────────────────────────────────────────────
//  Engine
// ──────────────────────────────────────────────

export class VibeEngine {
    // rolling 60 s keystroke timestamps
    private keystrokeBuffer: number[] = [];
    private totalKeystrokes = 0;
    private saves = 0;
    private errors = 0;
    private lastActivityAt = Date.now();

    // flow tracking
    private flowStartAt: number | null = null;
    private flowMinutes = 0;

    private readonly _onStateChange = new vscode.EventEmitter<VibeState>();
    /** Fires every ~5 s (or immediately after a save). */
    public readonly onStateChange = this._onStateChange.event;

    private disposables: vscode.Disposable[] = [];
    private tickInterval: ReturnType<typeof setInterval>;

    constructor() {
        // Keystroke tracking via text-document changes
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument(e => {
                if (e.contentChanges.length > 0) {
                    this.recordKeystroke();
                }
            })
        );

        // Save tracking
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(() => {
                this.saves++;
                this.lastActivityAt = Date.now();
                this.fire();
            })
        );

        // Error / warning tracking
        this.disposables.push(
            vscode.languages.onDidChangeDiagnostics(() => {
                this.syncErrors();
                this.fire();
            })
        );

        // Periodic tick (5 s)
        this.tickInterval = setInterval(() => this.fire(), 5000);
    }

    // ── Private helpers ──────────────────────

    private recordKeystroke(): void {
        const now = Date.now();
        this.keystrokeBuffer.push(now);
        this.totalKeystrokes++;
        this.lastActivityAt = now;

        // prune to last 60 s
        const cutoff = now - 60_000;
        this.keystrokeBuffer = this.keystrokeBuffer.filter(t => t > cutoff);
    }

    private syncErrors(): void {
        let count = 0;
        for (const [, diags] of vscode.languages.getDiagnostics()) {
            count += diags.filter(d => d.severity === vscode.DiagnosticSeverity.Error).length;
        }
        this.errors = count;
    }

    private getKpm(): number {
        const cutoff = Date.now() - 60_000;
        return this.keystrokeBuffer.filter(t => t > cutoff).length;
    }

    private getIdleSeconds(): number {
        return Math.floor((Date.now() - this.lastActivityAt) / 1000);
    }

    private computeScore(): number {
        const kpm  = this.getKpm();
        const idle = this.getIdleSeconds();

        // Typing speed (0-60 pts, caps at 60 KPM)
        let score = Math.min(kpm, 60);

        // Save bonus (each save = 2 pts, max 20)
        score += Math.min(this.saves * 2, 20);

        // Error penalty (each error = -5 pts, max -30)
        score -= Math.min(this.errors * 5, 30);

        // Idle penalty
        if      (idle > 300) { score -= 30; }
        else if (idle > 120) { score -= 15; }
        else if (idle > 60)  { score -= 5;  }

        return Math.max(0, Math.min(100, score));
    }

    private fire(): void {
        const score = this.computeScore();
        const { emoji, label } = scoreToLevel(score);

        // Flow time tracking (🌊 and above)
        if (score >= 51) {
            if (!this.flowStartAt) { this.flowStartAt = Date.now(); }
            this.flowMinutes = Math.floor((Date.now() - this.flowStartAt) / 60_000);
        } else {
            this.flowStartAt = null;
        }

        this._onStateChange.fire({
            level:            emoji,
            label,
            score,
            keystrokesPerMin: this.getKpm(),
            totalKeystrokes:  this.totalKeystrokes,
            saves:            this.saves,
            errors:           this.errors,
            flowMinutes:      this.flowMinutes,
            idleSeconds:      this.getIdleSeconds(),
        });
    }

    /** Snapshot the current state on demand. */
    public getState(): VibeState {
        const score = this.computeScore();
        const { emoji, label } = scoreToLevel(score);
        return {
            level:            emoji,
            label,
            score,
            keystrokesPerMin: this.getKpm(),
            totalKeystrokes:  this.totalKeystrokes,
            saves:            this.saves,
            errors:           this.errors,
            flowMinutes:      this.flowMinutes,
            idleSeconds:      this.getIdleSeconds(),
        };
    }

    dispose(): void {
        clearInterval(this.tickInterval);
        this._onStateChange.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}

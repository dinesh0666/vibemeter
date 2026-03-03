import { askAI } from "./ai";

interface PromptEntry {
    prompt: string;
    timestamp: Date;
}

/**
 * PromptDiary stores an array of prompt strings with timestamps,
 * scores them using Gemini, and assigns fun vibe coder ranks.
 */
export class PromptDiary {
    private entries: PromptEntry[] = [];
    private lastRank: string = "Unranked Newbie";

    /**
     * Logs a prompt string with the current timestamp.
     */
    logPrompt(prompt: string): void {
        this.entries.push({
            prompt,
            timestamp: new Date(),
        });
    }

    /**
     * Takes the last 5 prompts, sends them to Gemini, and asks for a rating
     * on clarity, creativity, and laziness (1-10), plus a fun vibe coder rank.
     */
    async scoreLatestPrompts(): Promise<string> {
        const latest = this.entries.slice(-5);

        if (latest.length === 0) {
            return "No prompts logged yet! Use 'VibeMeter: Log My Copilot Prompt' to start tracking.";
        }

        const promptList = latest
            .map((e, i) => `${i + 1}. "${e.prompt}" (at ${e.timestamp.toLocaleTimeString()})`)
            .join("\n");

        const geminiPrompt = `Rate these Copilot prompts (be brief & witty):
${promptList}

Score 1-10: Clarity, Creativity, Laziness.
Pick a rank: "Chaos Wizard", "Prompt Sensei", "Stack Overflow in a Trenchcoat", "Lazy Genius", "Copy-Paste Paladin", "10x Dreamer", "Bug Whisperer", or invent one.

Format:
🎯 Clarity: X/10
🎨 Creativity: X/10
😴 Laziness: X/10
🏆 Rank: [name]
💬 [witty one-liner]`;

        const result = await askAI(geminiPrompt);

        // Extract rank from response
        const rankMatch = result.match(/Rank:\s*(.+)/);
        if (rankMatch) {
            this.lastRank = rankMatch[1].trim();
        }

        return result;
    }

    /**
     * Returns the total prompts logged today and the last assigned rank.
     */
    getSummary(): { totalToday: number; lastRank: string } {
        const today = new Date();
        const todayEntries = this.entries.filter((e) => {
            return (
                e.timestamp.getDate() === today.getDate() &&
                e.timestamp.getMonth() === today.getMonth() &&
                e.timestamp.getFullYear() === today.getFullYear()
            );
        });

        return {
            totalToday: todayEntries.length,
            lastRank: this.lastRank,
        };
    }

    /**
     * Returns all logged entries for display.
     */
    getEntries(): { prompt: string; timestamp: Date }[] {
        return [...this.entries];
    }
}

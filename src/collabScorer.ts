import { exec } from "child_process";
import { promisify } from "util";
import { askAI } from "./ai";

const execAsync = promisify(exec);

/**
 * Runs "git diff HEAD~1 HEAD" and returns the output string.
 * Returns null if there's no git history or the command fails.
 */
export async function getGitDiff(cwd?: string): Promise<string | null> {
    try {
        const options = cwd ? { cwd } : {};
        const { stdout } = await execAsync("git diff HEAD~1 HEAD", options);
        return stdout.trim() || null;
    } catch (error) {
        return null;
    }
}

/**
 * Gets the git diff, sends it to Gemini, and asks for an AI vs human
 * contribution analysis with a witty summary and percentage breakdown.
 */
export async function analyzeCollabScore(cwd?: string): Promise<{
    summary: string;
    aiPercentage: number;
    moodEmoji: string;
}> {
    const diff = await getGitDiff(cwd);

    if (!diff) {
        return {
            summary: "No git history found yet! Make some commits and try again. 🐣",
            aiPercentage: 0,
            moodEmoji: "🐣",
        };
    }

    // Truncate diff if too long (Gemini has token limits)
    const truncatedDiff = diff.length > 10000 ? diff.substring(0, 10000) + "\n... (truncated)" : diff;

    const prompt = `Analyze this git diff. Estimate AI-generated vs human-written percentage.

Diff (truncated):
\`\`\`
${truncatedDiff}
\`\`\`

AI indicators: verbose comments, boilerplate, consistent naming, generic error handling.
Human indicators: quirky names, inconsistent style, hacky shortcuts, TODOs.

Respond EXACTLY:
AI_PERCENTAGE: [0-100]
MOOD: [single emoji]
SUMMARY: [witty one-liner with % breakdown]`;

    const result = await askAI(prompt);

    // Parse the response
    const aiMatch = result.match(/AI_PERCENTAGE:\s*(\d+)/);
    const moodMatch = result.match(/MOOD:\s*(.+)/);
    const summaryMatch = result.match(/SUMMARY:\s*(.+)/);

    const aiPercentage = aiMatch ? parseInt(aiMatch[1], 10) : 50;
    const moodEmoji = moodMatch ? moodMatch[1].trim() : "🤖";
    const summary = summaryMatch
        ? summaryMatch[1].trim()
        : `AI contributed ~${aiPercentage}% of this code. The vibes are... interesting.`;

    return {
        summary,
        aiPercentage,
        moodEmoji,
    };
}

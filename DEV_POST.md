---
title: This VS Code Extension Gives Your Coding Session a Vibe Score (and Loses Its Mind at GOD MODE)
published: false
tags: devchallenge, geminireflections, gemini
---

*This is a submission for the [Built with Google Gemini: Writing Challenge](https://dev.to/challenges/mlh-built-with-google-gemini-02-25-26)*

## What I Built with Google Gemini

**VibeMeter** — a VS Code extension that elevates vibe coding. It watches how you code in real-time, tracks your flow state, fires achievements when you hit milestones, and calls in an AI coach to roast or praise your session when you need it.

Here's what it does:

- ⚡ **Live Vibe Score (0–100)** — computed from your typing speed, saves, active errors, and idle time. Updates every 5 seconds.
- 🔥 **Flow State Levels** — six levels that evolve as you code: 😴 Dead Inside → 🥶 Cold Start → 🧘 Vibing → 🌊 In the Flow → 🔥 On Fire → ⚡ GOD MODE
- 🏆 **Achievement System** — 14 unlockable achievements that fire as toast notifications mid-session ("Keyboard Destroyer", "Zone Resident", "GOD MODE", "The Comeback")
- 🤖 **AI Vibe Coach** — powered by Google Gemini. Sends your session stats + active code context and returns a witty, personalised coaching message
- 📊 **Live Dashboard** — animated hero display, colour-coded score bar, 6-stat grid, and an achievement wall

The status bar reacts immediately — reach GOD MODE and it cycles through `⚡ GOD MODE 💀 GOD MODE 🔥 GOD MODE` at 450ms intervals. It's dramatic. That's the point.

![VibeMeter Demo](https://raw.githubusercontent.com/dinesh0666/vibemeter/main/assets/demo.gif)

---

### The Core Idea: Measure Flow, Not Just Output

Most productivity tools count lines of code, commits, or PRs. But those are lagging indicators. What actually matters mid-session is **flow state** — that effortless, locked-in zone where the code just pours out.

VibeMeter tries to detect that in real-time:

```typescript
private computeScore(): number {
    const kpm  = this.getKpm();       // keystrokes in last 60s
    const idle = this.getIdleSeconds();

    let score = Math.min(kpm, 60);          // typing speed: 0–60 pts (caps at 60 KPM)
    score += Math.min(this.saves * 2, 20);  // save bonus: max 20 pts
    score -= Math.min(this.errors * 5, 30); // error penalty: max –30 pts

    if      (idle > 300) { score -= 30; }   // 5+ min idle: big drop
    else if (idle > 120) { score -= 15; }
    else if (idle > 60)  { score -= 5;  }

    return Math.max(0, Math.min(100, score));
}
```

It's not perfect science — it's a vibe. The algorithm rewards momentum and punishes stagnation, which is exactly what flow state is.

---

### How Gemini Powers the AI Coach

When you hit `⌘⇧C` (Mac) or `Ctrl+Alt+C` (Windows), the AI Vibe Coach fires. It:

1. Grabs your current session stats (score, KPM, saves, errors, flow time)
2. Grabs up to 100 lines of code around your cursor
3. Sends both to `gemini-2.0-flash` with a prompt that makes it act as a witty senior engineer slash hype man

The prompt engineering here was the most fun part. The brief to Gemini:

```
You are a witty, hype, but genuinely smart AI coding coach.
You're the vibe check your dev session deserves — equal parts hype man and senior engineer.

Rules:
1. Comment on their vibe state — hype them if they're cooking, roast gently if they're slacking.
2. Make ONE sharp, specific observation about the visible code (naming, logic, structure, etc.).
3. End with a concrete power tip or fun challenge to level up their session.
Use emojis. Be that coach nobody asked for but everyone needed.
```

The result is coaching that actually reads the room. At 80 KPM with zero errors, Gemini is hyping you. At 10 KPM with 6 errors and 4 minutes idle, it's dishing out a gentle roast and a push. Surprisingly motivating.

---

### The Achievement System

The `HypeMachine` class listens to every `VibeEngine` state update and checks 14 different conditions. Some are simple counters:

```typescript
if (state.totalKeystrokes >= 1000) { unlock("ks_1000"); } // "Keyboard Destroyer 🚀"
if (state.flowMinutes >= 30)        { unlock("flow_30");  } // "Zone Resident 🧘"
if (state.level === "⚡")           { unlock("godmode");  } // "GOD MODE ⚡"
```

Others are more nuanced — the **"The Comeback"** achievement tracks if you started at Dead Inside (😴) and climbed back to In the Flow (🌊) or higher in the same session. That one feels earned.

Level changes also trigger hype messages:

```typescript
const HYPE = {
    level_up:   ["Level UP! Your vibe is evolving 🔥", "The vibes are immaculate rn ✨", ...],
    level_down: ["Took a micro-nap mid-sprint, eh? 😴", "Vibe dipped a bit — shake it off 🎯", ...],
    idle_nudge: ["Hey… you alive in there? 👀", "The cursor is lonely. Come back 🖱️", ...],
    godmode:    ["⚡ GOD MODE ACTIVATED. Absolute unit energy 💀", ...],
};
```

These fire as VS Code `showInformationMessage` toasts — non-intrusive, fun, and just visible enough to deliver a little dopamine hit mid-session.

---

## What I Learned

### 1. Context Is Everything in AI Coaching

My first version of the coach prompt sent only session stats — pure numbers. The responses were generic ("you're doing great!"). The moment I added the actual **code around the cursor**, the responses became specific and genuinely useful. Gemini would call out a suspicious variable name, notice a deeply nested callback, or compliment clean destructuring. That specificity is what makes it feel like a real coach rather than a motivational poster.

**Lesson**: Give the model context, not just data. Numbers alone don't let it reason. Code + numbers lets it actually see what's happening.

### 2. Structured Prompts Beat Conversational Ones

For the coach, I gave Gemini three explicit rules and told it to use emojis. Responses are now consistently punchy — 4–5 sentences, always ending with an actionable tip. Without that structure, responses were all over the place in length and tone.

This is the same lesson I'd take into any AI feature: **treat the prompt like an API contract, not a conversation starter.**

### 3. Real-Time Event Architecture Is Different from Request-Response

The `VibeEngine` fires a state update every 5 seconds via a VS Code `EventEmitter`. The status bar and hype machine both subscribe to it. This reactive pattern — where multiple consumers listen to one source of truth — is fundamentally different from the request-response model most AI apps use.

The interesting design challenge: the event fires frequently, but you don't want achievement toasts firing on every tick. The solution was tracking state *transitions* (level changed? fire hype) rather than state *values* (score is 85? always fire).

### 4. Idle Detection Is Harder Than It Sounds

First version penalised idle time from `Date.now()` at activation. So if you opened VS Code, didn't type for 30 seconds, and then started — you were already "Dead Inside" before writing a single character.

Fix: only start the idle clock from the first keystroke. Sounds obvious in retrospect. Most UX bugs do.

### 5. GOD MODE Is a Design Decision

I could have called the top level "Expert" or "Peak Flow". I called it GOD MODE and gave it a cycling animation with skull emojis. That choice made people actually *want* to reach it. Naming and personality in developer tools matters more than we admit.

---

## My Google Gemini Feedback

### What Worked Well

- **Speed**: `gemini-2.0-flash` returns coaching responses in 1–2 seconds. For a mid-session check-in, that's the right window — fast enough to feel real-time, not so fast it feels canned.
- **Code Comprehension**: Sending raw TypeScript/Python/whatever-the-dev-is-writing and asking for a specific observation worked better than I expected. Gemini consistently gave code-level feedback, not just generic encouragement.
- **Tone Control**: The "equal parts hype man and senior engineer" brief held up well across different code quality levels. It rarely went off the rails.
- **The SDK**: `model.generateContent(prompt)` is genuinely as simple as it looks. The npm package just works.

### Where I Hit Friction

- **Structured Output Guarantee**: Even with explicit format instructions, Gemini occasionally adds a preamble ("Sure! Here's your vibe check:") before the actual content. A strict mode where you pass a schema and get guaranteed JSON back would eliminate all the regex fallback code.
- **No Streaming in This Context**: I wanted to stream the coaching output word-by-word into the output channel for a typewriter effect. The VS Code Output Channel API supports appending line by line, but wiring that together with Gemini's streaming API required more plumbing than it was worth. Better streaming examples for non-web (IDE/CLI) contexts would help.
- **Token Visibility**: I still don't have a clear picture of token consumption per call. An easy `model.countTokens()` surfaced in the quickstart would help developers think about token economy earlier.

### The Honest Take

For a real-time, session-aware developer tool, `gemini-2.0-flash` is the right model. It's fast enough to not break flow, smart enough to give code-specific feedback, and cheap enough that I'm not watching a meter tick during development. The coaching feature went from "cool gimmick" to "thing I actually use" surprisingly quickly.

The one capability I wish existed: a lightweight classification endpoint that could passively detect code patterns (AI-generated vs human written, or common anti-patterns) without needing full prompt round-trips. That would unlock a whole tier of always-on analysis.

---

## What's Next

- **Persist achievements** to workspace storage so they survive restarts
- **Vibe streaks** — track how many consecutive days you hit flow state
- **Team leaderboard** — compare vibe scores across a team repo
- **Custom hype messages** — let devs write their own achievement toasts
- **Publish to the VS Code Marketplace**

### Try It Now — Sideload the VSIX

A pre-built VSIX is included in the repo so you can try it without cloning or compiling:

1. [Download **vibemeter.vsix**](https://github.com/dinesh0666/vibemeter/raw/main/vibemeter.vsix)
2. In VS Code: `⌘⇧P` → **Extensions: Install from VSIX…** → pick the file
3. Add your [Gemini API key](https://aistudio.google.com/apikey) in **Settings → VibeMeter → Gemini Api Key**
4. Start coding — the vibe score appears in your status bar immediately

Or via the terminal: `code --install-extension vibemeter.vsix`

---

**The real irony**: I spent a session deep in GOD MODE building the system that detects GOD MODE. The tool validated itself. 🔥

[GitHub Repo](https://github.com/dinesh0666/vibemeter) | Built with Google Gemini 2.0 Flash ✨

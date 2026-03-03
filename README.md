# 🎯 VibeMeter — Are You Coding, or Just Vibing?

> A VS Code extension powered by **Google Gemini** that judges how well you vibe code. It analyzes your git diffs, scores your AI prompts, and assigns you a rank like *"Chaos Wizard"* or *"Stack Overflow in a Trenchcoat"*.

Built for the [DEV x MLH Built with Google Gemini Writing Challenge](https://dev.to/challenges/mlh-built-with-google-gemini-02-25-26) 🏆

![VibeMeter Demo](https://raw.githubusercontent.com/dinesh0666/vibemeter/main/assets/demo.gif)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Collab Score** | Analyzes your `git diff` and estimates what % was AI-generated vs human-written |
| 📝 **Prompt Diary** | Log what you ask your AI assistant — VibeMeter rates your prompts for clarity, creativity & laziness |
| 🏆 **Vibe Ranks** | Get fun ranks like *Chaos Wizard*, *Lazy Genius*, *Prompt Sensei*, *Bug Whisperer* |
| 📊 **Visual Dashboard** | Beautiful webview panel with animated charts, collab breakdown, and session history |
| ⚡ **Animated Status Bar** | Cycling emoji status bar with color-coded AI percentage |
| 🔄 **Auto-Analyze** | Automatically checks your vibes every 30 minutes |

---

## 🚀 Quick Start

### Prerequisites

- VS Code 1.109+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com) (free)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/vibemeter.git
cd vibemeter

# Install dependencies
npm install

# Add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Compile
npm run compile
```

Then press **F5** in VS Code to launch the Extension Development Host.

---

## 📦 Install via VSIX (Sideload)

No Marketplace account needed — install the pre-built extension directly:

1. [Download **vibemeter.vsix**](https://github.com/dinesh0666/vibemeter/raw/main/vibemeter.vsix) from the repo
2. Open VS Code and press `⌘⇧P` (Mac) / `Ctrl+Shift+P` (Windows)
3. Run **Extensions: Install from VSIX…**
4. Pick the downloaded `vibemeter.vsix`
5. Reload VS Code when prompted
6. Open **Settings → VibeMeter → Gemini Api Key** and paste your [Google Gemini API key](https://aistudio.google.com/apikey)

> Or install directly from the terminal:
> ```bash
> code --install-extension vibemeter.vsix
> ```

---

## ⌨️ Commands & Shortcuts

| Command | Shortcut (Mac) | Description |
|---------|----------------|-------------|
| `VibeMeter: Analyze My Vibe` | `Ctrl+Option+B` | Run full analysis — git diff + prompt scoring |
| `VibeMeter: Log My Copilot Prompt` | `Ctrl+Option+V` | Log what you just asked your AI assistant |
| `VibeMeter: Open Dashboard` | `Ctrl+Option+D` | Open the visual dashboard panel |
| `VibeMeter: Show Prompt History` | `Ctrl+Option+H` | View all logged prompts |

---

## 🧠 How It Works

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Git Diff    │────▶│  Google Gemini   │────▶│  Collab Score   │
│  (HEAD~1)    │     │  (2.0 Flash)     │     │  AI% vs Human%  │
└──────────────┘     └──────────────────┘     └─────────────────┘

┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Prompt      │────▶│  Google Gemini   │────▶│  Vibe Rank +    │
│  Diary       │     │  (2.0 Flash)     │     │  Score Card     │
└──────────────┘     └──────────────────┘     └─────────────────┘

                     ┌──────────────────┐
                     │  Dashboard +     │
                     │  Status Bar      │
                     └──────────────────┘
```

1. **Collab Scorer** — Runs `git diff HEAD~1 HEAD`, sends it to Gemini, asks it to estimate AI vs human contribution
2. **Prompt Diary** — You log your AI prompts; Gemini rates them on clarity, creativity, and laziness
3. **Rank Engine** — Gemini assigns a fun rank based on your coding style
4. **Dashboard** — Rich webview with animated bars, gradient cards, and session history

---

## 📁 Project Structure

```
vibemeter/
├── src/
│   ├── ai.ts              ← Gemini API + VS Code LM fallback
│   ├── extension.ts        ← Main entry point, command registration
│   ├── promptDiary.ts      ← Prompt logging & AI scoring
│   ├── collabScorer.ts     ← Git diff analysis
│   ├── statusBar.ts        ← Animated status bar
│   └── dashboard.ts        ← Webview dashboard panel
├── .env                    ← Your Gemini API key
├── package.json
└── tsconfig.json
```

---

## 🔑 Google Gemini Integration

VibeMeter uses **Google Gemini 2.0 Flash** as its primary AI engine:

- **Model**: `gemini-2.0-flash` — chosen for speed and low latency
- **Usage**: All analysis (git diff scoring, prompt rating, rank assignment) goes through Gemini
- **Retry Logic**: 3 attempts with exponential backoff (1s, 2s)
- **Fallback**: VS Code Language Model API if Gemini is unavailable
- **SDK**: `@google/generative-ai` npm package

---

## 🛡️ Privacy

- Your code diffs are sent to Google Gemini for analysis — only the latest diff, truncated to 10K chars
- Prompt logs are stored in memory only (not persisted to disk)
- Your API key stays local in `.env` (gitignored)

---

## 📜 License

MIT

---

*Built with ❤️ and Google Gemini for the DEV x MLH Writing Challenge 2026*

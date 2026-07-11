# Cyber Rock Paper Scissors (v1.0.0)

A futuristic, high-tech, responsive version of the classic Rock Paper Scissors game styled with a **Cyber Neon** theme. Play with custom rule sets (Unlimited, Best of 3, Best of 5), track detailed telemetry statistics, and hear dynamically synthesized audio.

Developer: Sarthak Singh

---

## 🚀 Key Features

* **Cyber Neon Aesthetics**: Curated color palettes with a premium glassmorphic interface, CRT scanlines, matrix text glitches, and pulsing neon glows.
* **4 Color Themes**: Instantly switch between Cyber Purple, Cyan Grid, Toxic Green, and Neon Pink themes.
* **Game Modes**:
  * **Unlimited**: Free continuous training.
  * **Best of 3**: First to 2 victories secures the mainframe.
  * **Best of 5**: First to 3 victories secures the mainframe.
* **Decision Timer**: Optional 10-second turn timer. If the timer runs out, the mainframe auto-selects a random move to keep gameplay moving.
* **Holographic Combat Feedback**: Dynamic computer move calculations, glowing success/failure grids, and custom canvas-based neon particle explosions on wins.
* **Web Audio Synthesis**: Programmatic sound synthesis using the browser's Web Audio API (does not rely on downloading heavy external sound files). Synthesizes custom clicks, win major chord arpeggios, low-pass lose sweeps, and draw chirps.
* **Local Storage Persistence**: Saves Pilot name, volumes, selected themes, timer configurations, combat logs history, and cumulative match analytics (win rates, win streaks, move frequencies).
* **Keyboard Shortcuts**: Full accessibility navigation for rapid battles.

---

## 🎮 Gameplay & Mappings

### Combat Decision Key Mappings
* **`1`** — Deploy **SHIELD** (Rock)
* **`2`** — Deploy **GRID** (Paper)
* **`3`** — Deploy **CLAW** (Scissors)

### Menu & Dialogue Shortcuts
* **`Spacebar`** — Engage Next Round (during gameplay) OR Reboot System (on Game Over screen)
* **`Escape`** — Close Open Settings / Telemetry Modals

---

## 🛠️ File Structure

The project directory consists of:
```text
c:\stproject\
├── index.html       # Visual markup, Google Fonts, and inline SVG assets
├── style.css        # Neon design system, color variables, responsive layouts, scanlines
├── script.js        # Core game state manager, Web Audio synth, Local Storage, canvas particles
├── README.md        # Project documentation
└── assets\
    └── sounds\      # Click, win, lose, and draw audio placeholders
```

---

## 🚀 Getting Started

Since this is a client-side frontend project, you can run it directly:

1. Double-click the `index.html` file to open it in any modern browser.
2. Alternatively, serve it locally using a lightweight server:
   ```bash
   # Using Node's npx and static-server
   npx static-server
   
   # Or using Python 3
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000` (or the port specified by your server).

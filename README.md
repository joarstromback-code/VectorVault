# Vector Vault

> A fast-paced, momentum-based vault run game with tactical button mechanics, laser obstacles, and physics-based gameplay.

Navigate through 10 challenging levels, collect data shards, dodge rotating laser turrets, and press strategic buttons to unlock passages and disable defenses. Master momentum, timing, and route optimization to achieve the fastest completion times.

**Status:** v2.5 | **Author:** Lunar | **License:** MIT | **Latest Update:** April 2026

---

## 📋 Project Structure

```
VectorVault/
├── index.html          # Main HTML entry point with game UI layout
├── main.js             # Game initialization & infinite mode generator
├── game.js             # Core game engine (physics, controls, rendering)
├── style.css           # CSS styling (dark theme, responsive layout)
├── README.md           # This file
├── LICENSE             # MIT License
└── .gitignore          # Git configuration
```

## 🎮 Gameplay Overview

Vector Vault is a skill-based arcade-style game combining:

- **Physics-Based Movement** — Momentum system with thrust, brake, and drift mechanics
- **Obstacle Avoidance** — Navigate rotating laser turrets and physical walls
- **Shard Collection** — Collect all data shards to unlock the exit
- **Tactical Buttons** — Press switches to manipulate laser behavior and unlock doors
- **Time Attack** — Race against the clock with automatic best-time tracking

### Core Mechanics

#### Movement & Physics
- **Thrust** (WASD/Arrows): Accelerate in any direction
- **Brake** (Space/X): Rapidly slow down (drains charge)
- **Drift** (Shift): Maintain speed without constant acceleration (stamina-efficient)
- **Momentum**: Speed cap of 950 px/s; collisions cause bounces
- **Charge Meter**: Stamina system that drains when thrusting, recharges at rest

#### Collision System
- Circle-AABB collision detection with rotated rectangle support
- Pinball-like bouncing mechanics with energy retention (coefficient 0.92)
- Wall interactions drain 1.0 charge per collision
- Speed-capped at 1400 px/s after bounces to prevent runaway physics

#### Obstacles
1. **Laser Turrets** — Rotating beams that reset the player if hit
   - Can be stopped or slowed via buttons
   - Configurable rotation speed (omega) and range
2. **Physical Walls** — Static and rotating structures
   - Bounceable surfaces for tactical ricochets
3. **Beam Walls** — Laser shields that can be toggled on/off via buttons
4. **Interactive Buttons** — Trigger events with persistent effects

#### Interactive Buttons
Buttons are strategic switches scattered throughout levels:

| Type | Effect | Visual |
|------|--------|--------|
| **Stop-Laser** | Halt a turret's rotation completely | Glowing orange square |
| **Slow-Laser** | Reduce rotation speed by 60% | Same with pulsing glow |
| **Beam-Gate** | Toggle laser shield barriers on/off | Orange with animation |
| **Gate** | Open/close physical doorways | Orange with pulsing effect |

**Button Behavior:**
- Single-touch activation
- Remain pressed once activated (visual state changes to gray)
- Effects persist for the entire level
- Pressing same button again toggles the effect
- Placed strategically to encourage puzzle-solving

### Game Modes

#### Campaign Mode
- **10 handcrafted levels** with progressive difficulty
- Linear progression from training to expert challenges
- Best times stored per level in local storage
- Levels unlock sequentially
- Ideal for learning and mastering core mechanics

#### Infinite Mode
- **Procedurally generated levels** using modular chunk system
- Two 300px-wide "chunks" placed randomly each run
- 5 chunk types for variety:
  - The Pinch: Squeeze through middle
  - The Split: Choose top or bottom path
  - The S-Curve: Zigzag gauntlet
  - The Crossfire: Arena with central turret
  - The Vault: C-shaped wraparound room
- Guaranteed beatable (pathfinding validation)
- All shards verified reachable
- Endless gameplay for score chasing

---

## 🕹️ Controls

| Input | Action | Context |
|-------|--------|----------|
| **WASD** | Thrust up/left/down/right | Main gameplay |
| **Arrow Keys** | Thrust (alternative) | Main gameplay |
| **Space** / **X** | Brake | Main gameplay |
| **Shift** | Drift (momentum without thrust) | Main gameplay |
| **R** | Restart level | Any time |
| **P** | Pause game | Main gameplay |
| **E** | Toggle system menu | When paused |
| **N** | Next level (when cleared) | After winning |

---

## 📊 Campaign Levels

### 1. Training Bay
- **Difficulty:** Beginner
- **Objective:** Collect 3 shards, dock at exit
- **Features:** Single vertical wall, 1 slow laser
- **Key Skill:** Basic movement and shard collection

### 2. Offset Corridors
- **Difficulty:** Beginner+
- **Objective:** Collect 4 shards, watch for crossing beams
- **Features:** Multiple offset walls, 2 rotating lasers
- **Key Skill:** Navigating narrow passages, dodging crossing fire
- **Tip:** Drift (Shift) for precise control through tight gaps

### 3. Pinball Atrium
- **Difficulty:** Intermediate
- **Objective:** Collect 5 shards using ricochets
- **Features:** Multiple walls for bouncing, 2 turrets
- **Key Skill:** Using wall bounces for repositioning
- **Tip:** Time ricochets to avoid laser fire

### 4. Vault Cycle
- **Difficulty:** Intermediate+
- **Objective:** Collect 6 shards, survive the sweep
- **Features:** Sectioned layout with 3 gates, 2 turrets
- **Key Skill:** Completing sections to open doors
- **Mechanic:** Collect all shards in a section to open the next door

### 5. The Core Chamber
- **Difficulty:** Intermediate+
- **Objective:** Breach the core, dodge dual-laser sentry
- **Features:** Central chamber with 4 gates, 4 turrets (dual overlapping)
- **Key Skill:** Managing complex gate sequences
- **Tip:** Hover in room corners to dodge the rotating cross-pattern lasers

### 6. The Gauntlet
- **Difficulty:** Advanced
- **Objective:** Navigate the narrow firing lane
- **Features:** Long hallway with top/bottom confinement, 1 central turret
- **Key Skill:** Sustained high-speed maneuvering
- **Tip:** Use side alcoves to dodge the central sweep

### 7. The Diamond
- **Difficulty:** Advanced
- **Objective:** Collect from four corners
- **Features:** Central diamond obstacle, 2 dual-angle turrets
- **Key Skill:** Multi-directional navigation
- **Tip:** Center is a safe zone, but only briefly

### 8. Triple Threat
- **Difficulty:** Advanced+
- **Objective:** Synchronized triple-laser defense
- **Features:** 2 pillars, 3 synchronized turrets at different positions
- **Key Skill:** Dodging coordinated laser patterns
- **Tip:** Bait the lasers to one side before crossing

### 9. Command Override
- **Difficulty:** Expert
- **Objective:** Press buttons to unlock passages and disable lasers
- **Features:** 3 buttons, 1 gate, 3 turrets
- **Buttons:**
  - 2× Stop-Laser buttons (disable turrets 0 & 1)
  - 1× Gate button (opens door1)
- **Key Skill:** Strategic button sequencing
- **Tip:** Plan your route around button placement

### 10. Laser Labyrinth
- **Difficulty:** Expert+
- **Objective:** Complex maze with shield manipulation
- **Features:** 4 buttons, 2 beam-gates (shields), 3 powerful turrets
- **Buttons:**
  - 2× Beam-Gate buttons (toggle laser shields)
  - 2× Slow-Laser buttons (reduce rotation speeds)
- **Key Skill:** Multi-step puzzle solving + dodge mastery
- **Tip:** Timing button presses is critical; some lasers won't be fully disabled

---

## 💾 Data Persistence

**Local Storage Usage:**
- Key format: `vector_vault_best_v1_{levelIndex}`
- Stores: Best completion time (seconds) for each level
- Automatic saving on level completion
- Accessible via browser DevTools (Application → Local Storage)

**Example:** `vector_vault_best_v1_0` = best time for Level 1

---

## 📝 Version History

### v2.5 (Current) — Button Overhaul
**New Features:**
- ✅ **Interactive Button System** with 4 action types:
  - Stop-Laser: Halt turret rotation
  - Slow-Laser: Reduce rotation by 60%
  - Beam-Gate: Toggle laser shields
  - Gate: Open/close doors
- ✅ **Levels 9 & 10** designed around button mechanics
- ✅ Enhanced visual feedback with pulsing orange glow
- ✅ Persistent button states (toggleable throughout level)

**Changes:**
- Removed experimental boost pads and spinning obstacles
- Refined button rendering with proper visual states
- Improved level design for tactical puzzle-solving
- Start level changed to Level 1 (from debug mode)

**Removed:**
- Speed boost pads
- Spinning rotating obstacles
- Complex procedural features

### v2.0 — Gate & Beam System
- Added Level 5: The Core Chamber
- Introduced gate system for sectioned levels
- Added beam walls (laser shields) separate from physical walls
- Beam walls can be toggled independently
- Section-based gate opening mechanics

### v1.0 — Launch
- 8 handcrafted levels (Levels 1-8)
- Core physics engine with momentum & collision
- Laser turret system
- Shard collection mechanics
- Best-time tracking via localStorage
- Keyboard controls (WASD, Space, Shift, R, P, N)

---

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for CORS compliance)

### Installation & Running

1. **Clone or download the project:**
   ```bash
   git clone <repository-url>
   cd VectorVault
   ```

2. **Start a local web server:**
   
   **Option A: Python (3.x)**
   ```bash
   python -m http.server 8000
   ```
   
   **Option B: Node.js (http-server)**
   ```bash
   npx http-server
   ```
   
   **Option C: VS Code Live Server Extension**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

3. **Open in browser:**
   - Navigate to `http://localhost:8000` (or appropriate port)
   - Choose Campaign or Infinite mode
   - Start playing!

### Testing Specific Levels

To start on a specific level during development:

1. Open `game.js`
2. Find line 1: `const start_level = 0;`
3. Change `0` to desired level index (0-9)
4. Save and reload browser

---

## 🛠️ Technical Stack

### Architecture
- **Engine:** Vanilla JavaScript (ES6 modules)
- **Rendering:** HTML5 Canvas 2D context
- **Physics:** Custom circle-AABB collision detection
- **UI:** HTML5 semantic structure + CSS Grid layout

### Key Technologies

| Component | Technology | Details |
|-----------|-----------|----------|
| **Rendering** | Canvas 2D | requestAnimationFrame loop, DPR scaling |
| **Physics** | Custom math | Vector operations, AABB collision, rotated rectangles |
| **Input** | Keyboard events | Set-based key tracking |
| **Storage** | localStorage | Per-level best times |
| **UI Framework** | CSS Grid | Responsive two-column layout |
| **Procedural Gen** | BFS pathfinding | Chunk-based, validation-tested |

### Performance Optimizations
- DPR (device pixel ratio) aware canvas scaling
- Delta time clamping (max 1/20 frame, ~50ms)
- Trail fade culling (0.55s max age)
- Efficient collision grid for pathfinding validation
- requestAnimationFrame for smooth 60 FPS

### File Breakdown

#### `index.html` (140 lines)
- Semantic HTML structure
- Canvas element with 960×540 resolution
- HUD panels for stats, mission, log, tips
- Menu system (Campaign vs Infinite selection)
- System pause menu

#### `main.js` (500+ lines)
- Game initialization on DOMContentLoaded
- Button event listeners (Campaign/Infinite/Resume/Quit)
- Infinite mode procedural level generator
- Chunk library (5 unique chunk types)
- BFS pathfinding for level validation
- Fallback level generation

#### `game.js` (1600+ lines)
- **Game class** - Main engine
- **Input handling** - Keyboard tracking & controls
- **Physics system:**
  - `applyControls()` - Thrust/brake/drift
  - `integrate()` - Position update
  - `collideWalls()` - Collision resolution
- **Gameplay logic:**
  - `checkLasers()` - Laser hit detection
  - `checkButtons()` - Button activation
  - `checkShards()` - Shard collection
  - `checkExit()` - Exit docking
  - `maybeOpenGates()` - Gate logic
- **Rendering:**
  - `render()` - Canvas drawing
  - Multi-layer rendering (background, walls, buttons, lasers, player, trails)
- **Utility functions:**
  - `circleAabbResolve()` - 2D collision math
  - `raycastWorld()` - Laser raycast
  - `clamp()`, `lerp()`, `dot()` - Math helpers

#### `style.css` (300+ lines)
- CSS variables for theming (dark sci-fi aesthetic)
- Grid-based responsive layout
- Component styling:
  - `.panel` - Card containers
  - `.header`, `.stats`, `.legend` - Section headers
  - `.hud` - HUD displays
  - `.log` - Event log
  - `.pill` - Status badges
  - `.bar` - Charge meter
  - Buttons & menus

---

## 🎨 Visual Design

### Color Scheme
- **Background:** Dark blue/purple gradient (#07090d)
- **Primary Accent:** Cyan (#76e4ff) - Player, shards, walls
- **Danger:** Red/Pink (#ff5e7a) - Lasers, turrets
- **Success:** Green (#6cff9e) - Exit ring (when active)
- **Warning:** Yellow/Gold (#ffd46b) - Buttons, warnings
- **Panels:** Semi-transparent dark blue (#0d1220)

### UI Layout
- **Two-column design:**
  - Left: 60% - Game canvas (960×540)
  - Right: 40% - HUD (mission, stats, log, tips)
- **Responsive:** Adjusts for smaller screens
- **Grid-based:** CSS Grid for clean alignment

---

## 📚 Development Notes

### Physics System
The game uses a discrete time-step physics engine:
1. **Input handling** via keyboard events into a Set
2. **Control application** to player velocity (thrust/brake/drift)
3. **Position integration** with velocity clamping
4. **Collision detection** with resolution
5. **Rendering** of all entities
6. **Loop** via requestAnimationFrame

### Adding New Features

**To add a new button type:**
1. Add case to `activateButton()` in game.js
2. Define behavior (modify turrets, gates, etc.)
3. Add rendering in `render()` if needed
4. Update level definitions with button objects

**To add a new level:**
1. Add level object to `LEVELS` array in game.js
2. Define: name, objective, tip, start, exit, walls, shards, turrets, buttons, gates
3. Increment `start_level` to test (or change it)
4. Export game instance with `game.loadLevel(newIndex)`

**To add a new procedural chunk:**
1. Add case to `getRandomChunk()` in main.js
2. Define walls, shards, turrets relative to offsetX
3. Update switch case count (currently 5 cases, 0-4)

---

## 🐛 Known Limitations

- Laser hitbox is linear (line segment) rather than volumetric
- Buttons don't support area effects (only single targeted entity)
- No multiplayer or leaderboard server integration
- Infinite mode chunks are relatively simple (could be more complex)
- No mobile touch controls (keyboard only)

---

## 🤝 Contributing

Feel free to fork and modify! Key areas for enhancement:
- More procedural chunk types
- Mobile touch controls
- Advanced button types (spawn obstacles, heal, etc.)
- Level editor UI
- Difficulty settings
- Sound effects & music
- Accessibility improvements (screen reader support)

---

## 📄 License

MIT License © 2026 Lunar

Permission is hereby granted to use, modify, and distribute this software freely with attribution.

See [LICENSE](LICENSE) for full legal text.

---

## 📞 Support

For issues, suggestions, or questions:
- Check existing issues/documentation
- Review code comments for implementation details
- Test in different browsers for compatibility
- Use browser DevTools to debug physics/collisions

---

**Enjoy Vector Vault! Master the momentum, master the vault.** 🚀✨
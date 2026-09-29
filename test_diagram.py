col1_w = 17 # User: 0 to 16
# Center col: 40 to 68 (width 29)
# Right col: 78 to 105 (width 28)

grid = [
"┌─────────────────┐                     ┌───────────────────────────┐         ┌──────────────────────────┐",
"│      User       ├────────────────────►│          Web app          ├────────►│     Cloudflare Pages     │",
"│   (Designer)    │                     │     public/index.html     │         │      lintassist.com      │",
"└────────┬────────┘                     └───────┬───────────▲───────┘         └──────────────────────────┘",
"         │                                      │           │                                             ",
"         │                        audit request │           │ report or status                            ",
"         │                                      ▼           │                                             ",
"         │                              ┌───────────────────┴───────┐         ┌──────────────────────────┐",
"         │                              │     Cloudflare Worker     ├────────►│       AI providers       │",
"         │                              │     worker-stripe.js      ├──┐      │ Qwen → DeepSeek → Claude │",
"         │                              └───┬───────▲───────────▲───┘  │      └──────────────────────────┘",
"         │                                  │       │           │      │                                  ",
"         │                  report / status │       │ audit     │      │      ┌──────────────────────────┐",
"         │                                  │       │ request   │      └─────►│      Cloudflare D1       │",
"         │                                  ▼       │           │             │usage + subscribers + logs│",
"         │                              ┌───┴───────┴───────┐   │             └──────────────────────────┘",
"         └─────────────────────────────►│   Figma plugin    │   │ webhook                                 ",
"                                        │ ui.html + code.js │   │ event       ┌──────────────────────────┐",
"                                        └───────────────────┘   └─────────────┤      Ko-fi webhook       │",
"                                                                              └──────────────────────────┘",
]

for idx, line in enumerate(grid):
    print(f"{idx+1:2d} ({len(line):3d}): {line}")

# Check boxes
# Web app box: starts at 40
for row in [0, 1, 2, 3]:
    sub = grid[row][40:69]
    print(f"Web row {row}: {sub}")

# Worker box: starts at 40
for row in [7, 8, 9, 10]:
    sub = grid[row][40:69]
    print(f"Worker row {row}: {sub}")

# Figma box: starts at 40
for row in [15, 16, 17, 18]:
    sub = grid[row][40:69]
    print(f"Figma row {row}: {sub}")

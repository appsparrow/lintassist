# Option A: Figma width 23, Ko-fi line straight up at col 64
optA = [
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
"                                                                              └──────────────────────────┘"
]

# Option B: Figma width 27, Ko-fi line turns around
# Option C: Center User above or aligned

for line in optA:
    print(line)

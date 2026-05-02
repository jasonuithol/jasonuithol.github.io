// Portfolio data — edit freely.
// Each repo has: name, description (one-liner shown on card),
// longDesc (shown in dossier), and language.

const PORTFOLIO_DATA = {
  identity: {
    handle: "jasonuithol",
    title: "easyCoder",
    tagline: "Welcome to the attic",
    githubUrl: "https://github.com/jasonuithol"
  },

  clusters: [
    {
      id: "agentic-ai",
      name: "AGENTIC_AI",
      label: "Agentic AI",
      description: "MCP services and Claude tooling — the scaffolding for agents that build with you, not for you.",
      glyph: "◈",
      repos: [
        {
          name: "claude-sandbox-core",
          description: "Data-driven Claude Code sandbox scaffold. Domain configs wire MCP services, mounts, env.",
          longDesc: "The chassis. A configurable sandbox harness that spins up Claude Code agents with domain-specific MCP services pre-wired. Drop in a config file, get a fully-armed coding agent for that domain.",
          language: "Shell"
        },
        {
          name: "mcp-knowledge-base",
          description: "Shared FastMCP + ChromaDB scaffolding for RAG-backed knowledge MCP services.",
          longDesc: "The shared foundation that all the domain-specific MCP knowledge services build on. FastMCP plus ChromaDB plus a clean ingestion pipeline. Write once, mount anywhere.",
          language: "Python"
        },
        {
          name: "mcp-pygame",
          description: "MCP service pair for Python/pygame development. Provider-agnostic; consumed by claude-pygame.",
          longDesc: "A service/knowledge pair giving Claude deep context on pygame: API surface, common patterns, idioms. The agent stops guessing pygame and starts knowing it.",
          language: "Python"
        },
        {
          name: "mcp-dosre",
          description: "MCP service pair for DOS-era binary reverse engineering. Provider-agnostic.",
          longDesc: "Reverse-engineer DOS binaries with an agent that actually understands x86 real mode, INT 21h, and the weird shape of MZ executables. Built originally to feed UltimatePyve.",
          language: "Python"
        },
        {
          name: "mcp-valheim",
          description: "MCP service pair for Valheim mod development (BepInEx/dotnet/Thunderstore).",
          longDesc: "The agentic side of the Valheim modding pipeline. Knows BepInEx hooks, dotnet idioms, Thunderstore packaging, and the shape of Valheim's runtime — so building a mod becomes a conversation.",
          language: "Python"
        },
        {
          name: "mcp-c",
          description: "MCP service pair for C development. Pointers, memory, and the joy of segfaults.",
          longDesc: "Domain knowledge for the agent on C: idioms, undefined behavior, memory models, build systems. Companion to bchess and other low-level work.",
          language: "Python"
        },
        {
          name: "mcp-chess",
          description: "MCP service pair for chess engine development. Companion to bchess.",
          longDesc: "Knowledge service for chess engine work: move generation, board representation (bitboards/mailbox), search algorithms, evaluation. Built to assist the bchess project.",
          language: "Python"
        },
        {
          name: "mcp-steam",
          description: "MCP service pair for Steam platform integration.",
          longDesc: "Domain knowledge service for working with Steam APIs, Workshop, and the broader platform — for agents that need to ship games or interact with the storefront.",
          language: "Python"
        }
      ]
    },

    {
      id: "games",
      name: "GAMES",
      label: "Games",
      description: "From terminal chess engines to retro RPG remakes — the playground where ideas get tested.",
      glyph: "▶",
      repos: [
        {
          name: "bchess",
          description: "A terminal-based chess engine written in C.",
          longDesc: "A chess engine that lives in your terminal. Pure C, no dependencies, classic minimax-with-alpha-beta vibes. The kind of project that exists because writing one in C is its own reward.",
          language: "C"
        },
        {
          name: "UltimatePyve",
          description: "A pygame-driven recreation of the Ultima series, with a content modding engine.",
          longDesc: "A from-scratch take on the Ultima formula in pygame, complete with modding hooks. Born partly out of mcp-dosre — reverse-engineer the originals, then rebuild them in something hackable.",
          language: "Python"
        },
        {
          name: "dayz-map-chat",
          description: "Talk to your DayZ map.",
          longDesc: "A DayZ companion tool that turns your map into something conversational — annotate, discuss, query terrain features as if the map could answer back.",
          language: "Python"
        },
        {
          name: "DarkAgesAI",
          description: "AI experiments in a Dark Ages setting.",
          longDesc: "An exploration of game AI dynamics dressed in medieval clothing. Behavior trees, decision logic, agent simulation — the kind of project where the theme is the costume and the AI is the meal.",
          language: "Python"
        },
        {
          name: "spacewar",
          description: "A take on the 1962 classic.",
          longDesc: "Spacewar! reborn — two ships, a star, and gravity. The seed of all video games, redone with modern tooling.",
          language: "Python"
        },
        {
          name: "SpaceWar2",
          description: "The sequel — same gravity, more ambition.",
          longDesc: "Iteration on spacewar with upgraded mechanics: better physics, particle effects, possibly more than two ships. Where v1 was the lab notebook, v2 is the published paper.",
          language: "Python"
        }
      ]
    },

    {
      id: "valheim-mods",
      name: "VALHEIM_MODS",
      label: "Valheim Mods",
      description: "Quality-of-life mods for Valheim — viking life, but with the friction filed off.",
      glyph: "ᚱ",
      repos: [
        {
          name: "AdminHelpDesk",
          description: "Adds commands that help admins run servers a bit easier.",
          longDesc: "An admin's toolbelt for Valheim server hosts. Whatever the vanilla console doesn't give you, this fills in.",
          language: "C#"
        },
        {
          name: "TuckMyChooksIn",
          description: "Build beds for your chickens so they sleep when you do.",
          longDesc: "A small mod with a big heart. Lets you build dedicated chicken beds so your chooks aren't running around clucking while you're trying to skip the night.",
          language: "C#"
        },
        {
          name: "NightTerrors",
          description: "Adds a chance for something terrible to happen when sleeping.",
          longDesc: "Sleep used to be safe. Now it's a gamble. Adds a probability gate to nightly rest — most nights pass uneventfully; some don't.",
          language: "C#"
        },
        {
          name: "DiscordLogSync",
          description: "Sync Valheim server logs with a Discord chat channel.",
          longDesc: "Push selected server events to Discord. Good for admins who want to know when their server is on fire without staring at it.",
          language: "C#"
        },
        {
          name: "ValheimScheduledMessages",
          description: "Scheduled messages mod for Valheim — packaged for Thunderstore.",
          longDesc: "Set messages to fire on a schedule — server rules, restart warnings, lore drops. Whatever you want broadcast at o'clock.",
          language: "C#"
        },
        {
          name: "EepeyDeepey",
          description: "Encourages a good night's sleep.",
          longDesc: "Companion piece to NightTerrors. Where that one punishes sleeping, this one rewards it. The yin to the yang.",
          language: "C#"
        }
      ]
    }
  ]
};

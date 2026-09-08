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
      description: "A sandboxed environment for Claude Code.  Comes with MCP services to extend sandboxed capabilities.",
      glyph: "◈",
      repos: [
        {
          name: "claude-sandbox-core",
          description: "Data-driven Claude Code sandbox scaffold. Domain configs wire MCP services, mounts, env.",
          longDesc: "The chassis. A configurable sandbox harness that spins up Claude Code agents with domain-specific MCP services pre-wired. Drop in a config file, get a fully-armed coding agent for that domain.",
          language: "Shell"
        },
        {
          name: "ai-agent-mcps",
          description: "Monorepo of 10 MCP services — every domain the sandbox agents know, in one repo. Stateless per MCP 2026-07-28.",
          longDesc: "Formerly ten separate mcp-* repos, now consolidated with full commit history: domain workbenches for C, .NET, pygame, chess engines, DOS reverse engineering, databases, SSIS, Steam, and Valheim modding, plus RAG-backed knowledge services built on a shared MCP + ChromaDB scaffold. All 18 servers speak the stateless MCP 2026-07-28 protocol — no handshake, no session ids, one POST per request. The pre-migration state lives under the `stateful` tag for the nostalgic.",
          language: "Python"
        }
      ]
    },

    {
      id: "data-and-lang",
      name: "DATA_AND_LANG",
      label: "Data and Lang",
      description: "Open-source tools for data processing you could be using right now, and a language to write the next ones in.",
      glyph: "⇋",
      repos: [
        {
          name: "trebuchet",
          description: "An immutable-first language that compiles to C#/.NET (and C++). No mutation, no loops, no exceptions; plugs straight into an ASP.NET host.",
          longDesc: "Trebuchet starts from one commitment and follows it everywhere: nothing mutates. Records are deeply immutable, collections are persistent, there is no for loop, and the only way state changes is a pure fold over events. The rest of the language exists to keep that honest: three inferred effect flags (Nondet, Write, Suspend) say exactly which functions read or change the world, errors are values with a ? operator, services are immutable and composed at compile time, and the single mutable primitive, Cell, is fenced by the effect system. It is not a Haskell: it is built for the .NET shop. The compiler emits readable C# (records, sealed unions, async ValueTask), generated services register into IServiceCollection so the host's DI container can supply or override any dependency, host calls cross the boundary through extern fn declarations bound to BCL or your own static methods, and a stock ASP.NET project embeds the result with a few lines. The same source also compiles to C++20 against a header-only runtime, and every sample is checked against a reference interpreter on both targets. Comes with the design brief and a strategy document that records the reasoning behind every decision.",
          language: "C#"
        },
        {
          name: "betl-native",
          description: "Better ETL — open-source SSIS replacement. Native C/Lua reference implementation.",
          longDesc: "Pipelines as plain YAML, engine in C, types from Apache Arrow, providers loaded via a stable C ABI. Inline Lua for expressions, full Lua for tasks. SSIS without the GUIDs, XML, or vendor lock-in. (Renamed from `betl` when the ecosystem grew a second runtime — see betl-dotnet.) Contract lives in SPEC_CORE.md so multiple engines can implement the same YAML format.",
          language: "C"
        },
        {
          name: "betl-dotnet",
          description: "Pure-.NET reimplementation of betl. Same SPEC_CORE.md contract; runs natively on Windows with no WSL or container.",
          longDesc: "A peer reference implementation of betl in .NET 9. Wraps SSIS PipelineComponent subclasses behind a managed runtime (no native ABI / dlopen needed). Ships dotnet.task / dotnet.script / dotnet.pipelinecomponent as the inline-code escape hatch — Lua is intentionally absent. Installs as a .NET global tool: `dotnet tool install -g Betl.Dotnet`. 150+ conformance tests covering the full spec floor plus Phase 10 extensions (var.set, audit, xml.read, xlsx.*, postgres.copy/exec, mssql.bulkinsert).",
          language: "C#"
        },
        {
          name: "betl-tools",
          description: "Cross-platform tooling for the betl ecosystem: dtsx2yaml converter, browser-based YAML viewer, container packaging.",
          longDesc: "Three peers: betl-dtsx2yaml (SSIS .dtsx → .betl.yml migration tool, a .NET global tool), betl-yaml-ui (Python + FastAPI viewer/editor with full inspector, run-form, SQL editor — live demo at jasonuithol.github.io/betl-tools/), and the multi-stage Containerfile that bundles a betl-native runtime + tools into a single image. Decoupled from the engine repos so tooling can iterate independently.",
          language: "Python"
        }
      ]
    },

    {
      id: "games",
      name: "GAMES",
      label: "Games",
      description: "All blunt and cutting edge technologies get tested here first.",
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
        },
        {
          name: "SCUM-Mods",
          description: "Quality of life improvements for SCUM players and admins.",
          longDesc: "Make playing on, or running, a SCUM server easier and funner.",
          language: "C++/Lua"
        },
        {
          name: "InventoryQuest",
          description: "Simulate having an inventory.",
          longDesc: "Always wondered what it would be like to skip all that boring 3D geometry and just cut to the chase ? Now you can.",
          language: "Java"
        }
      ]
    },

    {
      id: "valheim-mods",
      name: "VALHEIM_MODS",
      label: "Valheim Mods",
      description: "A foray into some non-paid software that people actually use (see the Thunderstore stats !)",
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
        },
        {
          name: "ValheimKillFeed",
          description: "An on-screen kill feed for Valheim — see what's dying, who killed it, and when.",
          longDesc: "Adds a Quake/CS-style kill feed to Valheim so the chaos finally has receipts. Players, creatures, and the occasional self-inflicted tumble — all logged in the corner of your screen.",
          language: "C#"
        }
      ]
    }
  ]
};

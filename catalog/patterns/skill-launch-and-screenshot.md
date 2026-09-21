<!-- PATTERN: a skill that launches the app on its own port and captures a screenshot,
     for confirming a change in the real app rather than only in tests. Port and command
     come from .claude/launch.json. -->
---
name: run
description: Launch <REPO> on its dev port, drive it to <THE CHANGED SURFACE>, and capture a screenshot.
disable-model-invocation: true
allowed-tools: Bash(<DEV COMMAND>) Bash(lsof *) Bash(curl *)
---

# Run

1. Check the dev port is free: `lsof -ti tcp:<PORT> -sTCP:LISTEN`. If something is
   already listening, use it rather than starting a second server.
2. Start `<DEV COMMAND>` if needed. Wait for `<PORT>` to answer.
3. Open `<URL PATH for the changed surface>`, exercise the change, capture a screenshot.
4. Report what you saw against what the change intended. Attach the screenshot.
5. Stop the server if you started it.

Do not run a production build while this server is up; `.next` (or the build dir) is
served live and a build underneath it breaks every route.

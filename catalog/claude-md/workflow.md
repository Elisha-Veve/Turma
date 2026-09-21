## How work gets planned here

Nothing gets built from a verbal ask. A new project starts with `/turma:init` (a
discussion that produces `README.md`) and `/turma:bootstrap`; its first `/turma:design`
reads that README. After that, each feature runs the loop:

1. `/turma:define` - write the problem down: who feels it, what's wrong today, what
   solved looks like. `docs/problems/<slug>.md`.
2. `/turma:design` - turn it into a system design: topic docs under `docs/`, one ADR per
   load-bearing decision under `docs/decisions/`, numbered from what already exists.
   Stops for approval before anything becomes a ticket.
3. `/turma:tickets` - break the approved, pushed design into GitHub Issues on this
   repo's GitHub Project board, each one linked back to the exact design section it
   comes from. Stops for approval before anything is created on GitHub.
4. `/turma:work` - implement one ticket: read it and its grounding, build it, run the
   guard, get a second opinion from the repo's auditor where one exists, open a PR
   against the issue, update the board. One ticket in flight at a time.

A ticket that cannot name the design section it comes from is not ready to work - it
goes back to `/turma:design`, never gets invented scope to fill the gap.

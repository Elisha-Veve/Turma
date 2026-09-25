---
name: inbox
description: Capture rough issues into docs/inbox.md as they come up, list them, and promote one to turma:define when it is ready to become a problem statement.
---

# turma:inbox

First read [runtime conventions](../../references/runtime.md) and resolve the project
root. Preserve the user's existing authorization and constraints.

`docs/inbox.md` in the repo you are working in holds issues noted but not yet defined.
It sits before `turma:define` in the loop: an item stays here until it is promoted,
and leaves when `turma:define` writes its problem doc - the problem doc then owns it,
so the issue is never stated in two places.

The skeleton for a new inbox is `catalog/doc-templates/inbox.md`. Read it from there;
never write into the plugin directory.

## Context

Read `docs/inbox.md` in the target repository if it exists, and list existing
documents under `docs/problems/`.

## Steps

Pick the mode from `$items`:

1. **Add** (anything that is not `list`, `promote <n>` or `drop <n>`). Split the
   message into separate issues - one per line, bullet or clearly separate sentence;
   ask only if the split is genuinely ambiguous. Append each as
   `- <YYYY-MM-DD> <issue>` in the user's words, lightly trimmed, never expanded or
   reworded into a solution. Create `docs/inbox.md` from the template first if it does
   not exist. No draft review is needed: the user dictated the content. Flag, without
   refusing, an item that looks like an existing inbox entry or `docs/problems/` doc.
   Reply with the numbered list of what was added and the inbox's total count.

2. **List** (`list` or empty). Show every item numbered in file order, with its date.
   If there are none, say so and show how to add one.

3. **Promote** (`promote <n>`, or a quoted fragment that matches exactly one item).
   Show the item, then run `turma:define` with it as `$problem`, noting that it came
   from `docs/inbox.md` item `<n>`. `turma:define` removes the item when it writes the
   problem doc; if the user abandons define, the item stays.

4. **Drop** (`drop <n>`). Show the item and remove it only after the user confirms -
   a dropped issue is gone except from git history.

## Rules

- Append only when adding; never reorder, merge or rewrite existing items.
- Numbers are positions at the time of listing; re-read the file before promoting or
  dropping, and confirm the item text if the file changed.
- Do not commit. That is the user's call, same as any other file.
- This skill never touches GitHub and never writes to Turma; it only reads the template.

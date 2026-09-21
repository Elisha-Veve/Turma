# Examples

Agents that show what a *grounded* agent looks like: every rule names a real file or
command in a real repository. They belong to the author's own projects (Arcitectus,
Locus, OpenToolshed), so they are not loaded by the plugin and will not help you as-is.

They are the models behind the skeletons in `catalog/patterns/`. To make your own, run
`/turma:bootstrap` (or `/turma:optimize`), which fills a skeleton from your repo's real
files. To try one of these anyway, copy it to `~/.claude/agents/`.

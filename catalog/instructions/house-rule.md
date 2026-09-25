## The house rule

A fact is entered once. Everything derived from it is generated, never typed.

- A generated file is never hand-edited. The edit is lost on the next build, and until
  then the artifact disagrees with its source.
- A fact has one home. Two copies drift, and the question of which is right has no answer.
- A derived value is computed, not stored. Stored, it is correct at the moment of typing
  and wrong after the next reorder, rename or edit.
- An append-only record is never rewritten. History that can be revised is not evidence.

This repo has a guard script that proves it: `<GUARD_COMMAND>`. Run it, and read its
output rather than only its exit code, before opening a pull request.

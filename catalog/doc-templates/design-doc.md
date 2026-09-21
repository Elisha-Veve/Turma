<!-- TEMPLATE: seeds a new docs/<topic>.md, or a new section in an existing one, written
     by turma:design. Shape: prose, a source-of-truth
     section, a generated-never-hand-edited section, a guard reference, and links out to
     the ADRs that ground it rather than restating their reasoning. -->
# <TOPIC>

<ONE-PARAGRAPH ORIENTATION - WHAT THIS PART OF THE SYSTEM IS AND WHY IT EXISTS>

## <SECTION PER MAJOR PART OF THE DESIGN>

<WHAT IT DOES, WHAT IT TALKS TO>

## Source of truth

- <THE REAL FILE(S)/TABLE(S) THIS TOPIC OWNS>

## Generated, never hand-edited

<!-- Omit this whole section if nothing here qualifies. -->
- <ANYTHING DERIVED, AND THE COMMAND/MODULE THAT DERIVES IT>

## The guard

<THE COMMAND THAT PROVES THIS DESIGN HOLDS, IF ONE EXISTS YET>

## Decisions

See `docs/decisions/`. The load-bearing ones: <LINKS TO THE docs/decisions/NNNN-*.md ADRS
THIS DESIGN INTRODUCED OR RELIES ON>.

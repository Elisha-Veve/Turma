<!-- TEMPLATE: the body turma:tickets writes for each GitHub Issue. A ticket must be
     grounded, never invented - the Grounds line is not optional, and it must be an
     absolute blob URL: a GitHub Issue is not rendered in the context of a repo path, so
     a bare relative link (docs/decisions/0001-x.md) 404s from the Issues tab. Heading
     anchors work on rendered .md blobs, so #section-name is fine appended to the URL. -->
## Grounds

<ABSOLUTE URL, e.g. https://github.com/<owner>/<repo>/blob/<default-branch>/docs/decisions/NNNN-<slug>.md
OR .../blob/<default-branch>/docs/<topic>.md#<section-anchor> - THE EXACT DESIGN SECTION
OR ADR THIS TICKET IMPLEMENTS>

## Scope

<WHAT THIS TICKET DOES AND DOES NOT COVER - ONE SLICE, INDEPENDENTLY SHIPPABLE, SIZED TO
FINISH IN ONE /turma:work RUN>

## Acceptance criteria

- <OBSERVABLE, TESTABLE CRITERION, DRAWN FROM THE DESIGN - NEVER INVENTED>

## Out of scope

<WHAT THIS TICKET DELIBERATELY DOES NOT DO>

## Guard

<THE COMMAND /turma:work MUST RUN GREEN BEFORE THIS CLOSES, e.g. "npm run check">

---
Created by `/turma:tickets` from <PROBLEM DOC / DESIGN DOC PATH>.

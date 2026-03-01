# Artist Content Contract

This contract keeps artist profile pages stable across short and long texts.

## Field hierarchy

- `headline`: short teaser line for overview cards and profile snapshot blocks.
- `story`: full biography text for the profile detail section.
- `bio`: short intro fallback when `headline` is missing.

## Rules

- Keep `headline` to one sentence (around 70-120 characters).
- Use `story` for all long-form narrative text.
- Keep `bio` concise and readable (max 1-2 sentences).
- Keep `lang` accurate per artist profile (`NL` or `EN`).
- Keep genre naming consistent (`Hardtekk` with two `k`).

## Rendering behavior

- Artist cards use `headline` first, then `bio` fallback.
- Detail pages use:
  - `headline` for the `Kern`/`Snapshot` section.
  - `story` for `Bio` with auto paragraph grouping.
- Long `story` content is collapsed by default with an expand/collapse control.

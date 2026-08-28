# Third-party skills

Everything in this folder except [log-decision](log-decision/SKILL.md) and
[sync-docs](sync-docs/SKILL.md) is vendored from an upstream repository. Do not hand-edit a
vendored skill to fix a typo or an opinion you disagree with - the next sync will overwrite
it. Either raise it upstream, or record the divergence here.

License texts live in [licenses/](licenses/).

## taste-skill

- **Source**: <https://github.com/leonxlnx/taste-skill> at `ccbc15639c97057cbfcf32ecebc38ef716e4bb37`
- **License**: MIT, (c) 2026 Leonxlnx - [licenses/taste-skill.MIT.txt](licenses/taste-skill.MIT.txt)
- **Modifications**: none. Directories renamed to match each skill's `name` field.

| Installed as | Upstream path |
| --- | --- |
| [design-taste-frontend](design-taste-frontend/SKILL.md) | `skills/taste-skill` |
| [high-end-visual-design](high-end-visual-design/SKILL.md) | `skills/soft-skill` |
| [redesign-existing-projects](redesign-existing-projects/SKILL.md) | `skills/redesign-skill` |
| [minimalist-ui](minimalist-ui/SKILL.md) | `skills/minimalist-skill` |
| [industrial-brutalist-ui](industrial-brutalist-ui/SKILL.md) | `skills/brutalist-skill` |
| [image-to-code](image-to-code/SKILL.md) | `skills/image-to-code-skill` |

Not installed: `brandkit`, `gpt-tasteskill`, `imagegen-frontend-web`,
`imagegen-frontend-mobile`, `stitch-skill`, `output-skill`, `taste-skill-v1`. They target
image generation, Google Stitch, or a superseded version, none of which this repo does.

## layers-skills

- **Source**: <https://github.com/jamiemill/layers-skills> at `a201dc8c2011940b9d93934abb0f40c3b226c7ca`
- **License**: MIT, (c) 2026 Jamie Mill - [licenses/layers-skills.MIT.txt](licenses/layers-skills.MIT.txt)
- **Modifications**: none.

All nine installed verbatim. `layers-intro` is the entry point and the rest cross-reference
it: orient, domain, user needs, product strategy, conceptual model, interaction flow,
surface, and
<!-- cspell:disable-next-line - upstream folder name, not our prose -->
`layers-observed-behaviour`. Their prose is British English, which is why each vendored
skill folder is excluded from the cspell gate.

## impeccable

- **Source**: <https://github.com/pbakaus/impeccable> at `63b04e2530f5c7b41ea83c133daab24f34912456`, from `plugin/skills/impeccable`
- **License**: Apache 2.0 - [licenses/impeccable.Apache-2.0.txt](licenses/impeccable.Apache-2.0.txt),
  upstream notice at [licenses/impeccable.NOTICE.md](licenses/impeccable.NOTICE.md)
- **Modifications**: prose only. The upstream `scripts/` bundle (3 MB of Node, a browser
  overlay and a design detector) is not vendored, so:
  - `SKILL.md`: dropped the `allowed-tools` Bash grants, replaced the `context.mjs` setup
    step with the equivalent manual reads, and removed the `live` command plus the pin,
    hooks and doctor blurbs.
  - Deleted `reference/live.md`, `reference/live-setup.md`, `reference/hooks.md` and
    `reference/doctor.md`, and the `Live-mode signature params` sections in
    `reference/colorize.md`, `reference/layout.md` and `reference/typeset.md` that linked
    to them.

If someone needs live mode, install the upstream plugin rather than vendoring the scripts
here.

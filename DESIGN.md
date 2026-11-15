# Design: road atlas

The page is a road-atlas sheet: a route from the factory in Belarus to the visitor's own plot in Georgia. Every colour is a legend entry with one job.

## Colour roles

| Token | Value | Job |
|---|---|---|
| `--paper` | `#edf0e9` | Map paper, page ground (hero carries faint contour lines) |
| `--sheet` | `#f8f9f5` | Inset panels, form cards, tables |
| `--ink` | `#16201b` | Text, 2 px rules, asphalt bands (season, tally, footer) |
| `--ink-2` / `--ink-3` | `#3d4a42` / `#55615a` | Secondary and tertiary text |
| `--route` | `#c4301c` | Route line and the primary action. Nothing else is red |
| `--price` | `#f2c12e` | Prices: the price sign, the whole price section |
| `--land` | `#23603f` | "In the kit" and the request territory |
| `--water` | `#1d5a96` | Information: fixed-size notice, links to sources, focus ring |
| hatch | 45° stripes of `--ink-3` | "Not in the kit, separate work" |

## Type

FiraGO (Spiekermann wayfinding lineage), one family for Mkhedruli, Cyrillic and Latin. 400 body, 700 labels, 900 headlines (place-name style, tracking −0.02em). Georgian headlines step down ~15% and open line height. Every number uses tabular figures.

## Components

- **Route strip** — km-post squares numbered by stage, red trace drawn on scroll-in; last stop is a red pin. Typing a village into the hero form writes it on the last stop. Vertical on phones.
- **Signs** — price (yellow) and assembly (white) plates with 2 px ink border, radius 8.
- **Model rows** — timetable rows with fixed columns: render · specs · SVG plan generated from data.
- **Section cut** — the kit house in section; green parts are in the kit, hatched parts are not; list items highlight their layer.
- **Ledger** — the price section is a checklist on yellow with a dark tally that lists the chosen lines.
- **Legend sheet** — 2 × 2 grid with ink rules for winter / uses / showroom / custom size.
- Buttons are road-sign plates: red fill for the one action, ink outline for the rest.

## Layout

Width 1320 max, gutter `clamp(16px, 4vw, 56px)`. Sections `clamp(64px, 8vw, 112px)` vertical. Breakpoints 1100 (menu collapses), 900 (single column), 760 (phone: vertical route, sticky dock with CTA + WhatsApp).

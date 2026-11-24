---
name: easyService
description: Service-order management in one calm violet palette, neutral surfaces and a single workhorse sans.
colors:
  bg: "#f6f5f9"
  panel: "#ffffff"
  surface: "#f0eef5"
  surface-hover: "#e8e5f0"
  line: "#e3e0ea"
  line-strong: "#cbc6d8"
  fg: "#191624"
  fg-muted: "#555068"
  fg-subtle: "#6c6780"
  primary: "#6a3fd4"
  primary-hover: "#5a31b8"
  primary-soft: "#f1ecfd"
  primary-line: "#d9cdf9"
  primary-text: "#5a31b8"
  primary-strong: "#24154d"
  ok: "#1d7a46"
  ok-soft: "#e6f4ec"
  danger: "#c53030"
  danger-soft: "#fcebeb"
  fin-recebido: "#1d7a46"
  fin-receber: "#6a3fd4"
  fin-previsto: "#a98fe8"
typography:
  auth-headline:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  auth-headline-wide:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  stat:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
  page-title:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  page-title-phone:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  heading:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
  card-title:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
  dialog-title:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.35
  body-lg:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  section:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  tab-label:
    fontFamily: "'Onest', ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  sheet: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  gutter-phone: "16px"
  gutter-tablet: "24px"
  gutter-desktop: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.surface}"
  button-ghost:
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
  button-danger:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  card:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.lg}"
    padding: "20px"
  stat-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg}"
    typography: "{typography.stat}"
    rounded: "{rounded.lg}"
    padding: "16px"
  stat-card-highlight:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    typography: "{typography.stat}"
    rounded: "{rounded.lg}"
    padding: "16px"
  nav-shell:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg-muted}"
    width: "240px"
  nav-item-active:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 10px"
  status-agendado:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-text}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-em-andamento:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-finalizado:
    backgroundColor: "{colors.ok-soft}"
    textColor: "{colors.ok}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-cancelado:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg-subtle}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  timeline-marker:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.fg-muted}"
    rounded: "{rounded.full}"
    size: "26px"
  timeline-marker-done:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    rounded: "{rounded.full}"
    size: "26px"
  timeline-marker-running:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-text}"
    rounded: "{rounded.full}"
    size: "26px"
---

# Design System: easyService

## Overview

**Creative North Star: "One Calm Violet"**

easyService is a working tool for small pet-care businesses: an admin plans the day on a desktop, staff and clients check it on a phone. The interface stays out of the way. Surfaces are white panels on a faintly violet-tinted neutral ground, one sans-serif carries every word, and one brand color, violet, marks only what is actionable or happening now.

This system replaced an earlier "orienteering map" world (ISOM inks, contour textures, condensed uppercase display type) that the owner rejected on 2026-11-13 as too colorful, too large and too busy. Do not reintroduce illustrations, textures, map metaphors or a second accent color.

**Key Characteristics:**
- One palette: violet plus violet-tinted neutrals. Green and red appear only as meaning (concluded, error).
- One typeface, Onest, in 400/500/600. No uppercase labels, no condensed or display faces.
- Compact Operate density: 14px body, 24px page titles, 28px stat numbers.
- Every screen spans the full viewport width; no centered max-width wrapper around app content.
- Flat panels with 1px borders and a barely-there card shadow; real elevation only on menus and dialogs.

## Colors

**The One Violet Rule.** `primary` (#6a3fd4) is the only hue with a job: primary buttons, the active nav item, the "now" marker, the running and finished timeline markers, the highlighted stat, links (`primary-text`). Everything else is neutral.

- **Ground** `bg` #f6f5f9 / dark #111017. **Panels** `panel` #ffffff / dark #18161f. **Wells and hovers** `surface` #f0eef5 / dark #201d29.
- **Lines** `line` #e3e0ea for panel borders and row dividers; `line-strong` #cbc6d8 for input borders and the timeline rail.
- **Text** `fg` #191624, `fg-muted` #555068 for secondary copy, `fg-subtle` #6c6780 for captions (≥4.5:1 on panel).
- **Violet family** `primary-soft` #f1ecfd fills active nav, the "agendado" badge and icon chips; `primary-line` #d9cdf9 outlines highlighted cards; `primary-strong` #24154d is the auth brand panel. In dark mode `primary-text` lifts to #bba5f7 and `primary-soft` deepens to #251c3d; solid `primary` stays #6a3fd4 so white text keeps 6:1.
- **Meaning only** `ok` #1d7a46 on `ok-soft` for finalizado and success notices; `danger` #c53030 on `danger-soft` for errors, destructive actions and the "clientes sem responsável" warning.
- **Finance parts** (the only chart palette): `fin-recebido` #1d7a46 / dark #3a9e66, `fin-receber` #6a3fd4 / dark #9a7af2, `fin-previsto` #a98fe8 / dark #5f4ab2. Validated for colour-blind separation in both themes; the lightest one sits under 3:1, so every use carries a visible label and value. Rankings (por serviço, por profissional) are single-series bars in solid `primary` on a `surface` track.

## Typography

Onest (Google Fonts, 400/500/600/700) for everything, with tabular figures (`.num`) on money and counts. Times in lists use proportional figures, because Onest's tabular "1" reads letter-spaced.

- Page title 24px/600, tracking -0.015em (22px on phones). Section title 15px/600. Body 14px. Secondary 13px. Captions and badges 12px/500. Bottom-tab labels 11px/500.
- Stat numbers 28px/600. The auth brand headline is the only large type: 32px, 36px on wide screens.
- Sentence case everywhere. No eyebrow or kicker labels above headings.

## Elevation

Panels are flat: 1px `line` border plus `--shadow-card` (0 1px 2px at 5% in light, none in dark). Menus, popovers and dialogs use `--shadow-overlay` (16px/40px soft drop). Hover is a background tint (`surface` or `primary-soft/40`), never a lift.

## Components

- **App shell**: white 240px sidebar with a right border. Company switcher on top (company mark, name, role; its menu lets the admin set the logo), nav items 14px/500 with 17px icons, active item `primary-soft` + `primary-text`. "Dados da empresa" (logo, name, trade) and user menu at the bottom. On phones: a translucent top bar and a bottom tab bar whose active tab gets a `primary-soft` pill behind the icon.
- **Page header**: title, one-line description, actions on the right. No background band.
- **Stat strip**: four bordered cards (2 columns below xl), label + small violet icon chip + 28px value + caption. Only the most relevant number (today's count) is filled violet.
- **Agenda list (signature)**: rows joined by a 1px neutral rail through 26px numbered markers. Scheduled: outlined neutral. Running: violet ring on `primary-soft`, slow pulse, row tinted. Finished: solid violet with a check. Cancelled: dashed neutral with an x, row at 70% opacity. On today, a thin violet line with an "Agora hh:mm" pill marks the current time.
- **Status badge**: pill with a 6px dot. Agendado violet-soft, Em andamento solid violet, Finalizado green-soft, Cancelado neutral.
- **Buttons**: 36px (32 small, 44 large), radius 8, weight 500, sentence case. Primary violet, secondary white with `line-strong` border, ghost, danger outline.
- **Inputs**: 40px, 1px `line-strong` border, radius 8, violet border plus 3px 18% violet ring on focus.
- **Dialogs**: white panel with a bordered header (17px title) and close button; bottom sheet on phones.
- **Auth**: full-viewport split. `primary-strong` brand panel on the left (logo, headline, three product facts with icons) on lg+, form on the right. No illustration.
- **Company mark** (`EmpresaMarca`): the uploaded logo, object-contain inside a white rounded square with a 1px `line` border and 8% padding (white in dark mode too, because logos are drawn for light grounds). Without a logo: the trade icon on `primary-soft` (solid `primary` for the current company in the switcher). Logos are reduced in the browser to 256px and stored as a data URL.
- **Company cards** (Minhas empresas): large, min-height 232px, 24px padding, 72px mark, 20px name, trade label and description, footer with "Desde…" and "Entrar". Two columns from md, three from 2xl.
- **Finance summary**: one panel with the month total (28px), a 10px bar split into the three finance parts with 2px gaps, and a three-column legend (swatch, label, 18px value, count and share). Payments are registered inline in the row (method chips + date), never in a dialog.
- **Logo**: white check-mark stroke in a violet rounded square, wordmark "easyService" in Onest 600.

## Do's and Don'ts

- Do keep app content full-width, with 16/24/32px gutters.
- Do use violet for one thing per region: the action or the live item.
- Don't add illustrations, maps, contour or dot textures, gradients or decorative SVG.
- Don't use per-trade colors in the UI; trades differ by icon and wording only.
- Don't use uppercase labels, condensed type, or numbers above 28px inside the app.

---
name: Milliy Taomlar
description: Telegram Mini App for ordering Uzbek national dishes, where the food photo makes the decision.
colors:
  action: "#cc3d16"
  action-dark: "#a8310f"
  action-soft: "#fdece5"
  saffron: "#f2a23a"
  saffron-soft: "#fdf1dd"
  success: "#1d8f4e"
  success-soft: "#e3f4ea"
  bg: "#fffaf3"
  surface: "#f3ece2"
  line: "#e8dfd3"
  ink: "#1c1410"
  muted: "#6f6359"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    fontFeature: "'tnum' 1"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 600
    lineHeight: 1.375
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  nav-label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
rounded:
  sm: "12px"
  md: "16px"
  tile: "20px"
  card: "22px"
  hero: "26px"
  sheet: "28px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-primary-active:
    backgroundColor: "{colors.action-dark}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  button-secondary-active:
    backgroundColor: "{colors.line}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.action}"
    rounded: "{rounded.md}"
    height: "48px"
  button-add:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "40px"
  chip-category:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "40px"
  chip-category-selected:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
  badge-discount:
    backgroundColor: "{colors.saffron}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  stepper-action:
    backgroundColor: "{colors.action}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    height: "40px"
  cart-bar:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "56px"
---

# Design System: Milliy Taomlar

## Overview

**Creative North Star: "The Warm Counter"**

A modern delivery app in the category standard, built for a hungry person holding a phone inside Telegram (~375px). The photograph of the dish is the loudest thing on every screen; everything else is a quiet, warm counter it sits on. Surfaces are cream and baked-clay neutrals, type is a single heavy Manrope voice in charcoal, and exactly one hot colour, roasted-pepper red, marks the things you can press.

Density is phone-native: one 16px gutter, a two-column product grid, horizontal photo rails, and a bottom navigation that never leaves. Depth is soft and warm-tinted, never grey. Motion is small and purposeful: cards rise into place, counts pop, sheets slide up on an expo ease, and the one signature move (the dish photo flying into the cart) ties adding to the bag you can see.

**Key Characteristics:**
- Full-bleed food photography with large rounded corners carries the decision.
- Cream page with a slightly darker clay surface for fills; no grey card walls.
- One action red for tappable things; prices and money are ink.
- Saffron only for discount marks; green only for success and free delivery.
- Single typeface (Manrope), extra-bold headings with tight tracking, tabular numerals for money.
- Line icons on a 24px grid, stroke 2, round caps and joins.

## Colors

A warm, food-led palette: cream and clay neutrals, charcoal ink, one roasted-pepper red, and two narrow-purpose signal colours.

### Primary
- **Roasted Pepper Red** (action): the colour of tappable affordances: primary buttons, the hero "Savatga" button, active bottom-nav tab, the cart count badge, text links ("Hammasi"), the in-cart stepper, unseen story rings, focus outlines and the text caret. Darkened from the planned brighter red so white text passes 4.5:1. Its one non-interactive use is as a small line-icon accent inside info tiles (delivery time, free-delivery threshold, address).
- **Charred Pepper** (action-dark): pressed state of primary buttons; text on action-soft fills (errors, "cooking" status).
- **Pepper Blush** (action-soft): text selection, ghost-button press fill, quiet error and attention panels, icon wells.

### Secondary
- **Saffron** (saffron): discount badges ("−20%") on product photos and in the product sheet, with ink text.
- **Saffron Cream** (saffron-soft): the order-bump offer panel and the "new order" status pill.

### Tertiary
- **Herb Green** (success): order confirmed, free delivery reached, delivered status, the zero delivery fee in totals.
- **Mint Wash** (success-soft): background for success pills and reassurance panels.

### Neutral
- **Warm Cream** (bg): page, sheets, bottom nav (at 95% with blur) and the Telegram theme colour.
- **Baked Clay** (surface): fills for secondary buttons, inputs, unselected chips, info tiles, image placeholders.
- **Flour Line** (line): hairlines above the nav and sheet footers, pressed fill for clay buttons, seen-story ring, sheet grabber.
- **Charcoal Ink** (ink): all text including prices, selected category chip, floating cart bar, hero card backing, scrim (at 50%).
- **Smoked Taupe** (muted): secondary notes, field labels, inactive nav, struck-through old prices.

### Named Rules
**The Hot Plate Rule.** Red fills and red text mean "press this". Prices, totals and every sum of money are ink, never red.

**The Saffron Sticker Rule.** Saffron marks a discount; it never fills a button or colours a heading.

## Typography

**Display Font:** Manrope (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Manrope

**Character:** One warm geometric sans doing all the work. Weight carries hierarchy: 800 for headings, prices and buttons, 600-700 for names and labels, 400 for notes.

### Hierarchy
- **Display** (800, 26px, 1.25, -0.02em): screen titles (greeting, "Menyu") and the dish name on the hero photo. Story titles step up to 30px at 1.1.
- **Headline** (800, 20px, -0.01em): section heads on home; sheet titles at 19px.
- **Title** (800, 17px, tabular numerals): product price under each card.
- **Body** (400, 15px, 1.5): inputs and running text; notes at 14px in muted. Product names 14.5px/600, two-line clamp.
- **Label** (700, 13px): field labels in muted, small links. Nav labels 11px/700. Button text 15px/800 (13.5px small, 16px large).

### Named Rules
**The Tabular Money Rule.** Every sum, count and quantity uses tabular numerals so figures don't jitter as steppers change.

## Layout

Single phone column, max 512px centred, 16px side gutter. Horizontal rails (stories, popular dishes) bleed to the screen edge with a -16px margin and re-pad inside, so the next card peeks. The product grid is two columns with a 12px column gap and 20px row gap; rail cards are 158px wide. Sections are separated by 28px and headings sit 12px above their content. The bottom navigation is fixed at 64px plus the safe-area inset; content reserves that height plus room for the floating cart bar. The home hero photo is 248px tall at full width. Category chips stick to the top on scroll over a 95% cream backdrop blur.

## Elevation & Depth

Mostly flat tonal layering (cream page, clay fills) with three warm-tinted shadows, all tinted from ink or action red, never neutral grey. Product cards in grids carry no shadow; the photo itself is the object.

### Shadow Vocabulary
- **Card** (`0 1px 2px rgb(28 20 16 / 0.04), 0 8px 24px -12px rgb(28 20 16 / 0.18)`): the hero card and floating close buttons over photos.
- **Float** (`0 -8px 28px -14px rgb(28 20 16 / 0.28)`): the ink cart bar floating above the nav.
- **Action** (`0 8px 18px -8px rgb(204 61 22 / 0.55)`): under red primary buttons only; dropped when disabled.

### Named Rules
**The Warm Shadow Rule.** Shadows are tinted with ink or pepper red, soft and negative-spread; there are no hard or grey shadows.

## Shapes

Generously rounded, nothing sharp. Product photos 22px, category tiles 20px, the hero card 26px, sheets 28px on the top corners only. Buttons, inputs and info tiles 16px; small buttons 12px. Chips, badges, steppers, story rings and the cart-count badge are full pills or circles. Story thumbnails are circles inside a 2.5px red ring that turns to line colour once seen. The focus outline is 2.5px action red, 2px offset, 12px radius.

## Components

### Buttons
- **Shape:** 16px radius (12px at the small size); heights 36 / 48 / 56px.
- **Primary:** action red, white 800-weight text, action shadow; presses to action-dark and scales to 0.97.
- **Secondary:** clay surface with ink text; presses to line.
- **Ghost:** transparent with red text; presses to action-soft.
- **Add ("Qo'shish"):** 40px full-width clay button with a plus icon under each product card; once added it becomes the red stepper.
- **Loading:** a 16px spinning ring in the text colour sits before the label.

### Chips
- **Style:** 40px pill, 14px/700 text, clay fill, ink text.
- **State:** the selected chip turns ink with white text. Discount badges are small saffron pills over the photo's top-left corner.

### Cards / Containers
- **Product card:** square photo (22px radius, clay placeholder, fades in and settles from 1.04 scale on load), price then name below on the page background, add button pinned to the bottom. No frame, no shadow.
- **Hero card:** 248px photo on an ink backing, 26px radius, card shadow, black gradient from the bottom, white display-weight name, price in 90% white, red "Savatga" button bottom-right.
- **Category tile:** 96px photo tile, 20px radius, left-to-right dark gradient, white 16px/800 label bottom-left.
- **Info tile:** clay fill, 16px radius, 20px red line icon plus 13px/600 ink text.

### Inputs / Fields
- **Style:** 48px tall, clay fill, 16px radius, transparent border, 15px text, 13px/700 muted label above.
- **Focus:** fill turns white, border turns action red, plus a 4px red ring at 10%.

### Navigation
- **Bottom nav:** fixed, 64px, cream at 95% with blur, top hairline. Four tabs: 24px line icon over an 11px/700 label. The active tab is red with stroke 2.4; inactive tabs are muted. The cart icon carries a red pill count with a white ring.
- **Bottom sheet:** cream, 28px top radius, slides up (0.42s expo) over a 50% ink scrim, grabber bar in line colour, sticky footer with a hairline for the CTA. Photo sheets bleed edge to edge with a floating white close button.

### Stepper
A pill with minus, tabular count and plus. Red with white text when the dish is in the cart (card and hero); clay in neutral contexts. The number pops on every change.

### Fly to Cart (signature)
On add, a circular copy of the dish photo (max 120px) lifts in an arc and shrinks to 18% into the bottom-nav cart icon over 650ms (`cubic-bezier(0.5, 0, 0.3, 1)`); the cart icon then bumps to 1.28x and the count updates. Under reduced motion the flight is skipped and only the count updates.

## Do's and Don'ts

### Do:
- **Do** let a full-bleed dish photo lead every product surface, at the card radius (22px) or larger.
- **Do** keep red fills and red text for tappable things, and set prices and totals in ink with tabular numerals.
- **Do** use saffron for discounts and green for success or free delivery.
- **Do** use the shared line icon set (24px grid, stroke 2, round caps and joins) and draw new icons in the same style.
- **Do** animate with the expo ease (`cubic-bezier(0.16, 1, 0.3, 1)`): rise for lists, pop for counts, sheet-up for sheets, and honour reduced motion.
- **Do** tint shadows from ink or red, soft and negative-spread.

### Don't:
- **Don't** colour prices, totals or sums of money red.
- **Don't** use emoji as decoration or icons.
- **Don't** build walls of framed grey cards; products sit on the cream page with the photo as the card.
- **Don't** add kicker or eyebrow lines above headings.
- **Don't** invent ratings, review counts or order statistics on any surface.

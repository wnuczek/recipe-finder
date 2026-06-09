---
change_id: ingredient-row-height-shift
title: Stabilize ingredient row height during scaling
status: archived
created: 2026-06-09
updated: 2026-06-09
archived_at: 2026-06-09T13:02:55Z
---

## Notes

recipe details ingredient rows grow taller when scaled because the "oryg." original-quantity line only renders at factor != 1, causing layout shift while stepping; reserve the line's height so row height stays stable

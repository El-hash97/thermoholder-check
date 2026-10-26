# Thermoholder parts drawing: evidence

Intended use: the "Parts" view inside the thermoholder detail dialog of the Overview page
(clicking the turning holder), plus a standalone viewer page with SVG / PNG / PDF downloads.
Output size: the dialog shows the A3 sheet fitted to about 600–900 px wide; the viewer page
scales it freely. The drawing is an illustrative concept (`concept: true`): no dimension is
authoritative. Model units are about 5 mm each (the head is 28 units, about 140 mm wide).

Sources: photos in `public/referensi/` (not committed) and the photos the user sent in chat
(holders on the cart and on the wall rack, a Digilance head with its taper, the bent lance end,
two temtip photos), plus the user's own description of the lance and temtip.

| Feature group | Evidence | How it is drawn |
| --- | --- | --- |
| Manual head case (stainless box, 4 screws, cable gland) | Visible in photos | Estimated proportions |
| Manual face: 7-segment window, 5 status LEDs, number label, red push button | Visible in photos | Estimated positions, matching the app's face drawing |
| Digital head (rubber housing, LCD, up/down/OK/cancel keys, label) | Visible in photos | Estimated proportions |
| Handle under the head | Visible in photos (cart, rack) | Estimated, plain cylinder with a collar |
| Contact block and tapered wedge into the lance ("Digilance" emboss) | Photo plus user description | Estimated; emboss omitted |
| Lance: straight tube, then bent down at the end | Photo plus user description | Estimated 35° bend; length shortened (real lance is much longer) |
| Temtip: slim kraft tube, brass band, thicker white sensor body, short slim cap | Photo plus user description | Estimated proportions |
| Electronics, thermocouple wiring, connector inside the contact block | Hidden, no reference | Omitted |

## Rebuild and proof

From `tools/teardown/`:

```sh
npm install
node scripts/proof.cjs drawing.json proof/ --quick
node scripts/proof.cjs drawing.json proof/
npm run build
node scripts/check-viewer.cjs ../../public/teardown/thermoholder.html check/
```

`npm run build` writes the standalone viewer to `public/teardown/thermoholder.html` and the
app's labelled sheets to `src/components/overview/teardown/*.svg`.

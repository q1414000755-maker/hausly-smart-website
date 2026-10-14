# Smart Star Ring Switch — Asset Branch Review (V1)

Status: `visual_approved_technical_pending`

Source: TUYA-001 (PDF reference ID, **not** confirmed manufacturer SKU).
Visual configurations: White 1 Gang and Black 2 Gang (visual labels only).

## Current staged scope
The 8-image asset overlay has been assembled and locally validated, but the PNG/WebP binary files have **not yet been pushed to GitHub**. The review package must be imported onto this branch by Codex or GitHub Desktop. Do not treat this branch as ready for PR approval until all assets are committed.

Expected additions (see supplied HauslySmart_StarRing_AssetBranch_V1_Import.zip):
- `assets/images/products/smart-switches/star-ring-switch/`: 8 PNG masters, 8 WebP website files, 2 WebP thumbnails, manifest, checklist, README
- `internal-previews/star-ring-switch/index.html`: responsive internal-only preview (noindex, nofollow)
- `scripts/validate-star-ring-assets.mjs`: hash and missing-file validation
- `docs/product-assets/STAR_RING_ASSET_REVIEW.md`: scope and verification notes

## Safe import procedure
1. Protect uncommitted homepage changes in the existing local working tree. Use a **separate clone or Git worktree** for this branch.
2. Place ZIP contents at the repository root without deleting unrelated files.
3. Run `node scripts/validate-star-ring-assets.mjs`.
4. Serve the repo locally; open `/internal-previews/star-ring-switch/` and inspect both image galleries (Main → Angle → Detail → Scene).
5. Verify image URLs, 1440px desktop and 390px / 320px mobile widths, colour tabs, thumbnail switching and image zoom.
6. Commit assets to **this branch only**; open a PR for review if ready. Do not merge to main or trigger production deployment yet.

## Publication gate
Do **not** edit any live M6 product route or bind these images to `src03-m6`, any existing `model_id`, SKU, catalog category, product page, price or Quote List until the manufacturer verifies model-to-photo mapping and technical attributes.

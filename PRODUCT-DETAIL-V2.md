# Product detail v2 — local integration

The approved M6 layout is shared by catalog-bound local product detail pages. Nothing has been deployed or uploaded.

## Source files

- `product-detail-v2-body.html`: approved shared section markup.
- `product-detail-v2-base.css` and `product-detail-v2.css`: shared appearance, compiled from the approved preview CSS by the build script.
- `product-detail-v2.js`: data-driven runtime for other products.
- `product-detail-v2-m6.js`: M6-specific material/color configurator, compiled from the approved preview runtime.
- `product-detail-v2-m6-data.js`: live catalog adapter; M6 project material options retained from the preview option matrix.
- `assets/js/quote-catalog.js`: product/variant data source. Generated catalog files should be rebuilt from the product registry when cloud product data is integrated, rather than hand edited.
- `build-product-detail-v2.cjs`: rebuild local catalog-bound product pages.
- `product-detail-v2-manifest.json`: generated page/model mapping.

## Data contract

Each page binds `data-product-model` to its own catalog model. Each variant supplies its own SKU, attributes, image and confirmed reference price. Unknown facts remain pending. Related records use their own model/route. Protocol/platform icons show supported entries only, in one row without borders; do not inherit M6 capabilities into other products.

M6 preserves legacy variant/option-color links. Other products retain variant IDs and requested option parameters. Configuration enquiries never assume that an unmatched option is a confirmed SKU.

## Recovery and validation

Original HTML files are kept once under `.server-private/pdp-v2-originals/`. This private directory is excluded by the preview server and is not publication content. `validation.json` in that directory records local asset/link integrity.

The independent M6 design preview remains available. Pages without a catalog mapping are not overwritten; they require product identification before adopting the data-driven template. Model-specific photography, wiring diagrams and download files still await the cloud information workflow. No certifications, loads, wiring types or stock claims are invented by this template.

The local formal routes now use `/request-a-quote.html` instead of the isolated preview receiver. Actual enquiry delivery must be validated separately before publication.

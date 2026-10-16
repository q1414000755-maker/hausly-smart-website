'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {inspect,sanitizeProductSchema,sitemap}=require('../scripts/seo-review.cjs');
test('H1 is already present and noindex is preserved',()=>{
 const html='<html><head><title>Category</title><meta name="robots" content="noindex, follow"><meta name="description" content="Description"></head><main><h1>Smart Switches</h1></main></html>';
 assert.deepEqual(inspect(html).h1s,['Smart Switches']);assert.equal(inspect(html).indexable,false);
});
test('unreviewed Product structured data is removed',()=>{
 const html='<script type="application/ld+json">{"@type":"Product","name":"Sample","offers":{"price":"8.8"}}</script>';
 const a=sanitizeProductSchema(html,'unapproved-model');
 assert.equal(a.removed,1);assert.equal(a.html,'');
});
test('BreadcrumbList is retained',()=>{
 const html='<script type="application/ld+json">{"@type":"BreadcrumbList","itemListElement":[]}</script>';
 assert.equal(sanitizeProductSchema(html,'unapproved-model').html,html);
});
test('sitemap only includes manually approved canonical pages',()=>{
 const xml=sitemap();assert.match(xml,/https:\/\/www\.hauslysmart\.com\/products\.html/);
 assert.doesNotMatch(xml,/<loc>.*\/products\/src03-m12s\//);
});

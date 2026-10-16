# Hausly Smart SEO / GEO 安全发布说明

仓库 main 最近提交为 2026-10-14，README 明示不连接自动生产部署。此分支不能代替最近的线上修复。

1. 当前分类页已经有 H1，不应重复添加或修改 UI。
2. 新增 Node 内置模块审查脚本，识别分类 H1、Title、Meta、Canonical、robots、产品绑定、错误的 M6 默认文本，以及未经审核的 Product Schema 和 Offer。
3. robots.txt 只声明允许抓取和 Sitemap；它不会覆盖页面中的 noindex。
4. Sitemap 采用审核白名单，最初仅纳入仓库中 index/follow 的 products.html。目录 302 条不等于 302 个可索引详情页。
5. 修改了产品构建器的静态 HTML 回退文案与 Schema 安全策略。下次重新构建 92 个页面时才会生效；合并本分支本身不会修复生产 HTML。

执行：

    node scripts/seo-review.cjs
    node --test tests/seo-safety.test.cjs
    node scripts/seo-review.cjs --sitemap-check

在同步最新代码、备份现有产品页后，才可运行：

    node build-product-detail-v2.cjs
    node scripts/seo-review.cjs --strict

审查报告可用 node scripts/seo-review.cjs --report=seo/audit.json 输出，但不要把测试报告误当线上 HTTP 检测。

发布前：验证 www 域名 301/200 行为、Canonical 与 X-Robots-Tag；按真实说明书逐一批准产品 Schema、Offer、页面索引；在部署后提交 Search Console 和 Bing。

当前发布策略不批量打开 index，也不自行修改旧产品索引状态。原因是多个数据源仍包含 visual_source_only 和占位内容。

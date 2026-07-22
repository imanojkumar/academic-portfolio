#!/usr/bin/env node
/**
 * Academic Portfolio build.
 *
 * Default behaviour (npm run build) is the ONLY path that writes published
 * artefacts, and it ALWAYS excludes drafts. Draft inclusion is available only
 * through the explicit --include-drafts flag, which additionally requires
 * --out so that it can never overwrite a published artefact.
 *
 * See REVAMP_PLAN v1.1 Addendum A, clarifications C1, C2, C5, C6.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = p => JSON.parse(readFileSync(p, 'utf8'));

/* ------------------------------------------------------------------ flags */
const argv = process.argv.slice(2);
const INCLUDE_DRAFTS = argv.includes('--include-drafts');
const OUT_FLAG = argv.find(a => a.startsWith('--out='));
const OUT_DIR = OUT_FLAG ? resolve(ROOT, OUT_FLAG.split('=')[1]) : ROOT;
const PREVIEW = OUT_DIR !== ROOT;

if (INCLUDE_DRAFTS && !PREVIEW) {
  console.error('\nRefusing to run: --include-drafts requires --out=<dir> so that drafts can never');
  console.error('be written into the published site. Example:\n');
  console.error('  node scripts/build.mjs --include-drafts --out=_preview\n');
  process.exit(2);
}

/* -------------------------------------------------------- locked catalogue */
/* Section 3 of the approved plan. These lists are locked for this release.  */
const LOCKED_COURSE_IDS = new Set([
  'business-analytics', 'business-science', 'ai-for-business', 'agentic-ai-supply-chain',
  'ai-manufacturing-engineering', 'data-driven-decision-making', 'operations-analytics',
  'digital-transformation-managers'
]);
const LOCKED_DISCIPLINE_IDS = new Set([
  'business-management', 'engineering-management', 'analytics',
  'artificial-intelligence', 'digital-transformation', 'operations-supply-chain'
]);
const PROGRAMME_LEVELS = ['Graduate', 'Postgraduate'];
const MATERIAL_TYPES = ['case-study', 'presentation', 'project', 'resource'];

const problems = [];
const fail = m => problems.push(m);

/* ------------------------------------------------------------ content load */
const site = readJSON(join(ROOT, 'content/site.json'));
const disciplines = readJSON(join(ROOT, 'content/disciplines.json'));
const disciplineIds = new Set(disciplines.map(d => d.id));

for (const id of disciplineIds) {
  if (!LOCKED_DISCIPLINE_IDS.has(id)) fail(`disciplines.json: "${id}" is outside the locked discipline list`);
}
for (const id of LOCKED_DISCIPLINE_IDS) {
  if (!disciplineIds.has(id)) fail(`disciplines.json: locked discipline "${id}" is missing`);
}
if ('showDrafts' in site) {
  fail('site.json: showDrafts is no longer supported. Draft visibility is controlled by the build entry point (Addendum A, C2).');
}

const loadDir = dir => readdirSync(dir)
  .filter(f => f.endsWith('.json') && !f.startsWith('_'))
  .map(f => ({ file: f, data: readJSON(join(dir, f)) }));

const courseRecords = loadDir(join(ROOT, 'content/courses'));
const materialRecords = loadDir(join(ROOT, 'content/materials'));

/* -------------------------------------------------------------- validation */
const courses = [], materials = [], courseIds = new Set(), materialIds = new Set();

const requiredCourse = ['id', 'title', 'summary', 'description', 'disciplines', 'programmeLevels',
  'deliveryFormats', 'subjectArea', 'duration', 'durationWeeks', 'credits', 'status'];

for (const { file, data: c } of courseRecords) {
  requiredCourse.forEach(k => {
    if (c[k] === undefined || c[k] === null || c[k] === '') fail(`${file}: missing ${k}`);
  });
  if (`${c.id}.json` !== file) fail(`${file}: filename must match id ${c.id}`);
  if (courseIds.has(c.id)) fail(`${file}: duplicate id ${c.id}`);
  courseIds.add(c.id);
  if (!LOCKED_COURSE_IDS.has(c.id)) fail(`${file}: "${c.id}" is outside the locked course list (plan Section 3)`);
  for (const d of c.disciplines || []) if (!disciplineIds.has(d)) fail(`${file}: unknown discipline ${d}`);
  for (const l of c.programmeLevels || []) if (!PROGRAMME_LEVELS.includes(l)) fail(`${file}: unsupported programme level ${l}`);
  if (typeof c.durationWeeks !== 'number' || c.durationWeeks <= 0) fail(`${file}: durationWeeks must be a positive number`);
  if (c.cover && !existsSync(join(ROOT, c.cover))) fail(`${file}: missing cover ${c.cover}`);
  if (c.syllabus && !existsSync(join(ROOT, c.syllabus))) fail(`${file}: missing syllabus ${c.syllabus}`);
  courses.push(c);
}
for (const id of LOCKED_COURSE_IDS) {
  if (!courseIds.has(id)) fail(`content/courses: locked course "${id}" is missing`);
}

const requiredMaterial = ['id', 'type', 'title', 'summary', 'courseId', 'format', 'status', 'license'];
for (const { file, data: m } of materialRecords) {
  requiredMaterial.forEach(k => {
    if (m[k] === undefined || m[k] === null || m[k] === '') fail(`${file}: missing ${k}`);
  });
  if (`${m.id}.json` !== file) fail(`${file}: filename must match id ${m.id}`);
  if (materialIds.has(m.id)) fail(`${file}: duplicate id ${m.id}`);
  materialIds.add(m.id);
  if (!MATERIAL_TYPES.includes(m.type)) fail(`${file}: unsupported material type ${m.type}`);
  if (!courseIds.has(m.courseId)) fail(`${file}: unknown course ${m.courseId}`);
  if (m.file && !existsSync(join(ROOT, m.file))) fail(`${file}: missing body ${m.file}`);
  materials.push(m);
}

/* ------------------------------------------------- markdown (vendored only) */
const markedSrc = readFileSync(join(ROOT, 'assets/js/vendor/marked.min.js'), 'utf8');
const sandbox = {};
sandbox.globalThis = sandbox; sandbox.self = sandbox; sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(markedSrc, sandbox);
const marked = sandbox.marked;
if (typeof marked?.parse !== 'function') {
  console.error('\nThe vendored marked bundle did not expose parse(). Prerendering cannot continue.');
  process.exit(2);
}

const plainText = md => md
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[#>*_`|\-]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const readingMinutes = md => Math.max(1, Math.round(plainText(md).split(' ').filter(Boolean).length / 200));

for (const m of materials) {
  if (m.file) {
    const md = readFileSync(join(ROOT, m.file), 'utf8');
    m.readingTime = readingMinutes(md);
    m.words = plainText(md).split(' ').filter(Boolean).length;
  }
}

/* ------------------------------------------------------------ content guards */
/* C1: scan visitor-facing content only. This script, test fixtures, private   */
/* planning documents and Git history are deliberately out of scope.           */
const SCAN_ROOTS = ['content', 'assets', 'files', 'index.html', '404.html', 'sitemap.xml', 'feed.xml'];
const SCAN_SKIP = /(?:^|\/)(?:vendor|node_modules|_preview)(?:\/|$)/;

const walk = p => {
  const abs = join(ROOT, p);
  if (!existsSync(abs)) return [];
  if (SCAN_SKIP.test(p)) return [];
  let entries;
  try { entries = readdirSync(abs); } catch { return [p]; }
  return entries.flatMap(f => walk(join(p, f)));
};
const scanFiles = SCAN_ROOTS.flatMap(walk)
  .filter(p => /\.(md|json|html|xml|css|js|svg)$/i.test(p));

const PROHIBITED = [
  /\bK[1-6]\b/,
  /bloom'?s?\s+taxonomy/i,
  /\bbloom\s+(?:coverage|level)/i,
  /cognitive\s+level/i,
  /outcome[- ]mapping\s+matrix/i,
  /outcome[- ]to[- ]assessment\s+map/i,
  /coverage\s+grid/i
];
const PLACEHOLDER = [
  /seed\s+resource/i,
  /* prose use only: the HTML "placeholder=" attribute and CSS "::placeholder" are legitimate */
  /(?<![-:])\bplaceholder\b(?!\s*[=:])/i,
  /replace\s+(?:or\s+extend\s+)?(?:it\s+)?(?:with\s+your\s+full|before\s+(?:formal\s+)?delivery)/i,
  /\blorem\s+ipsum\b/i,
  /\bTODO\b/,
  /\bTBD\b/
];

const draftIds = new Set(materials.filter(m => m.status === 'draft').map(m => m.id));

/* A published body must not carry a draft marker in its prose. This lets the  */
/* scaffold keep a visible "draft in preparation" note without any risk of it  */
/* surfacing on a public reading page.                                         */
const DRAFT_MARKER = /draft\s*[—-]\s*in preparation/i;
for (const m of materials) {
  if (m.status !== 'draft' && m.file) {
    const body = readFileSync(join(ROOT, m.file), 'utf8');
    if (DRAFT_MARKER.test(body)) {
      fail(`${m.file}: published material still contains a draft marker in its body`);
    }
  }
}

for (const p of scanFiles) {
  const text = readFileSync(join(ROOT, p), 'utf8');
  for (const re of PROHIBITED) {
    if (re.test(text)) fail(`${p}: prohibited terminology matched ${re} (plan Section 4)`);
  }
  /* Draft bodies are not published, but they are reachable by direct URL, so */
  /* placeholder language is not acceptable in them either.                   */
  for (const re of PLACEHOLDER) {
    if (re.test(text)) fail(`${p}: placeholder language matched ${re} (plan Release 1)`);
  }
}

/* ------------------------------------------------------------------ output */
const isPublished = x => x.status !== 'draft';
const outCourses = (INCLUDE_DRAFTS ? courses : courses.filter(isPublished))
  .sort((a, b) => a.title.localeCompare(b.title));
const outMaterials = (INCLUDE_DRAFTS ? materials : materials.filter(isPublished))
  .sort((a, b) => a.title.localeCompare(b.title));

/* Cross-reference integrity within what is actually being published. */
const outCourseIds = new Set(outCourses.map(c => c.id));
for (const m of outMaterials) {
  if (!outCourseIds.has(m.courseId)) {
    fail(`${m.id}: published material references course "${m.courseId}" which is not published`);
  }
}

const generated = [...outCourses, ...outMaterials].map(x => x.updated || '').sort().at(-1) || '';
const index = {
  generated,
  draftPreview: INCLUDE_DRAFTS,
  courseCount: outCourses.length,
  materialCount: outMaterials.length,
  courses: outCourses,
  materials: outMaterials
};

/* Draft-leak assertion. Never reached in the default path, but asserted anyway. */
if (!INCLUDE_DRAFTS) {
  const leaked = [...index.courses, ...index.materials].filter(x => x.status === 'draft');
  if (leaked.length) fail(`draft leak: ${leaked.map(x => x.id).join(', ')} reached a published artefact`);
}

if (PREVIEW) { rmSync(OUT_DIR, { recursive: true, force: true }); mkdirSync(OUT_DIR, { recursive: true }); }

const writeOut = (rel, body) => {
  const target = join(OUT_DIR, rel);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body);
};

writeOut('content/index.json', JSON.stringify(index, null, 2) + '\n');

/* -------------------------------------------------------------- profile */
/* profile.json is the hand-edited source. Draft records, and any link with  */
/* an empty url, are stripped from the production artefact; they survive only */
/* in the draft preview. Teaching interests are constrained to the approved   */
/* course titles.                                                             */
const APPROVED_TEACHING = new Set([
  'Business Analytics', 'Business Science', 'AI for Business', 'Agentic AI in Supply Chain',
  'AI for Manufacturing Engineering', 'Data-Driven Decision Making', 'Operations Analytics',
  'Digital Transformation for Managers'
]);
let profileBuilt = null;
const profileSrcPath = join(ROOT, 'content/profile.json');
if (existsSync(profileSrcPath)) {
  const raw = readJSON(profileSrcPath);
  const keep = r => INCLUDE_DRAFTS || (r && r.status !== 'draft');
  const arr = a => (Array.isArray(a) ? a.filter(keep) : []);
  profileBuilt = {
    draftPreview: INCLUDE_DRAFTS,
    hero: raw.hero || {},
    social: arr(raw.social),
    focus: raw.focus || {},
    education: arr(raw.education),
    books: arr(raw.books),
    software: {
      python: arr(raw.software && raw.software.python),
      r: arr(raw.software && raw.software.r),
      other: arr(raw.software && raw.software.other)
    },
    consulting: arr(raw.consulting),
    conferences: arr(raw.conferences),
    talks: arr(raw.talks),
    accolades: arr(raw.accolades),
    service: arr(raw.service),
    memberships: arr(raw.memberships),
    stats: arr(raw.stats),
    researchInterests: Array.isArray(raw.researchInterests) ? raw.researchInterests : [],
    teachingInterests: Array.isArray(raw.teachingInterests) ? raw.teachingInterests : []
  };
  for (const t of profileBuilt.teachingInterests) {
    if (!APPROVED_TEACHING.has(t)) fail(`profile.json: teaching interest "${t}" is outside the approved course list`);
  }
  if (!INCLUDE_DRAFTS) {
    const flat = [profileBuilt.social, profileBuilt.education, profileBuilt.books,
      profileBuilt.software.python, profileBuilt.software.r, profileBuilt.software.other,
      profileBuilt.consulting, profileBuilt.conferences, profileBuilt.talks,
      profileBuilt.accolades, profileBuilt.service, profileBuilt.memberships, profileBuilt.stats].flat();
    if (flat.some(r => r && r.status === 'draft')) fail('profile draft leak: a draft record survived filtering');
  }
  writeOut('content/profile.built.json', JSON.stringify(profileBuilt, null, 2) + '\n');
}

/* ------------------------------------------------------------- prerender */
const base = (site.baseUrl || '').replace(/\/+$/, '');
const esc = s => String(s ?? '').replace(/[<>&'"]/g, ch =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[ch]));

const canonicalOf = (kind, id) => `${base}/${kind}/${id}/`;

/* Pages sit two directories deep, so assets resolve with ../../ and the site */
/* continues to work inside the GitHub Pages project subdirectory (C6).       */
const page = ({ title, description, canonical, hashRoute, body, depth = 2 }) => {
  const up = '../'.repeat(depth);
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | ${esc(site.shortName)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(base)}/assets/img/social-card.svg">
<link rel="icon" href="${up}assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${up}assets/css/site.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="container header-inner">
<a class="brand" href="${up}#/" aria-label="Home">
<span class="brand-mark">${esc(site.initials)}</span>
<span class="brand-copy"><strong>${esc(site.shortName)}</strong><small>${esc(site.role)}</small></span>
</a>
<nav class="desktop-nav" aria-label="Primary">
<a href="${up}#/">Home</a><a href="${up}#/courses">Courses</a><a href="${up}#/case-studies">Case Studies</a><a href="${up}#/presentations">Presentations</a><a href="${up}#/projects">Projects</a><a href="${up}#/resources">Resources</a><a href="${up}#/about">About</a>
</nav></div></header>
<main id="main" tabindex="-1">${body}
<div class="container static-return"><a class="button primary" href="${up}${esc(hashRoute)}">Open in the portfolio &rarr;</a></div>
</main>
<footer class="site-footer"><div class="container"><div class="footer-bottom">
<span>&copy; ${new Date().getFullYear()} ${esc(site.copyright)}.</span><span>${esc(site.title)}</span>
</div></div></footer>
</body>
</html>
`;
};

const staticPages = [];

for (const c of outCourses) {
  const canonical = canonicalOf('courses', c.id);
  const body = `<article class="container prose">
<div class="eyebrow">${esc(c.subjectArea)}</div>
<h1>${esc(c.title)}</h1>
<p>${esc(c.description)}</p>
<dl class="static-facts">
<dt>Programme level</dt><dd>${esc((c.programmeLevels || []).join(' / '))}</dd>
<dt>Duration</dt><dd>${esc(c.durationLabel || c.duration)}</dd>
<dt>Delivery format</dt><dd>${esc((c.deliveryFormats || []).join(' / '))}</dd>
<dt>Credits</dt><dd>${esc(c.credits)}</dd>
<dt>Intended audience</dt><dd>${esc(c.audience)}</dd>
<dt>Prerequisites</dt><dd>${esc(c.prerequisites)}</dd>
</dl>
<h2>Learning outcomes</h2><ul>${(c.outcomes || []).map(o => `<li>${esc(o)}</li>`).join('')}</ul>
<h2>Module structure</h2><ol>${(c.modules || []).map(m => `<li><strong>${esc(m.title)}</strong> &mdash; ${esc(m.description)}</li>`).join('')}</ol>
<h2>Assessment methods</h2><ul>${(c.assessment || []).map(a => `<li>${esc(a.name)} &mdash; ${esc(a.weight)}</li>`).join('')}</ul>
</article>`;
  staticPages.push({ rel: `courses/${c.id}/index.html`, canonical, kind: 'course', id: c.id });
  writeOut(`courses/${c.id}/index.html`, page({
    title: c.title, description: c.summary, canonical,
    hashRoute: `#/course/${c.id}`, body
  }));
}

for (const m of outMaterials) {
  if (!m.file) continue;
  const canonical = canonicalOf('materials', m.id);
  const course = outCourses.find(c => c.id === m.courseId);
  const md = readFileSync(join(ROOT, m.file), 'utf8');
  const body = `<article class="container prose reading">
<div class="eyebrow">${esc(m.type.replace('-', ' '))}</div>
${marked.parse(md)}
<hr>
<p class="reading-course">Associated course: ${esc(course ? course.title : m.courseId)}</p>
</article>`;
  staticPages.push({ rel: `materials/${m.id}/index.html`, canonical, kind: 'material', id: m.id });
  writeOut(`materials/${m.id}/index.html`, page({
    title: m.title, description: m.summary, canonical,
    hashRoute: `#/material/${m.id}`, body
  }));
}

/* ------------------------------------------------ static section landings */
const SECTIONS = [
  { slug: 'courses', title: 'Course Catalogue', hash: '#/courses',
    description: 'Graduate and postgraduate courses for Business Management and Engineering.' },
  { slug: 'case-studies', type: 'case-study', title: 'Case Studies', hash: '#/case-studies',
    description: 'Practice-oriented cases connected to the graduate and postgraduate course portfolio.' },
  { slug: 'presentations', type: 'presentation', title: 'Presentations', hash: '#/presentations',
    description: 'Presentation resources for course delivery, workshops and structured classroom discussion.' },
  { slug: 'projects', type: 'project', title: 'Projects', hash: '#/projects',
    description: 'Applied project briefs connecting course ideas with business and engineering contexts.' },
  { slug: 'resources', type: 'resource', title: 'Teaching Resources', hash: '#/resources',
    description: 'Templates, dataset guides and practical resources supporting course delivery.' }
];

for (const s of SECTIONS) {
  const items = s.slug === 'courses'
    ? outCourses.map(c => ({ href: `../courses/${c.id}/`, title: c.title, summary: c.summary }))
    : outMaterials.filter(m => m.type === s.type)
        .map(m => ({ href: `../materials/${m.id}/`, title: m.title, summary: m.summary }));
  const list = items.length
    ? `<ul class="static-list">${items.map(i =>
        `<li><a href="${esc(i.href)}">${esc(i.title)}</a><span>${esc(i.summary)}</span></li>`).join('')}</ul>`
    : `<p class="static-empty">No items are currently published in this section.</p>`;
  writeOut(`${s.slug}/index.html`, page({
    depth: 1, title: s.title, description: s.description,
    canonical: `${base}/${s.slug}/`, hashRoute: s.hash,
    body: `<article class="container prose"><h1>${esc(s.title)}</h1><p>${esc(s.description)}</p>${list}</article>`
  }));
}

/* Static /about/ is rendered from published profile data for SEO. The rich  */
/* interactive profile is the SPA #/about view.                              */
const renderProfileStatic = p => {
  if (!p) return '<article class="container prose"><h1>About</h1></article>';
  const h = p.hero || {};
  const tag = (label, list) => (list && list.length)
    ? `<section class="prose-block"><h2>${esc(label)}</h2><ul class="tag-list">${list.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>` : '';
  const focusBlock = f => (f && f.items && f.items.length)
    ? `<section class="prose-block"><h3>${esc(f.title)}</h3><ul>${f.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></section>` : '';
  const eduBlock = (p.education && p.education.length)
    ? `<section class="prose-block"><h2>Education</h2><ul>${p.education.map(e =>
        `<li>${esc([e.qualification, e.discipline].filter(Boolean).join(', '))}${e.institution ? ` — ${esc(e.institution)}` : ''}${e.year ? ` (${esc(e.year)})` : ''}</li>`).join('')}</ul></section>` : '';
  return `<article class="container prose about-static">
<h1>${esc(h.name || 'About')}</h1>
${h.headline ? `<p class="about-headline">${esc(h.headline)}</p>` : ''}
${h.summary ? `<p>${esc(h.summary)}</p>` : ''}
${focusBlock(p.focus && p.focus.professional)}
${focusBlock(p.focus && p.focus.teaching)}
${eduBlock}
${tag('Research interests', p.researchInterests)}
${tag('Teaching interests', p.teachingInterests)}
</article>`;
};

for (const name of ['about', 'contact']) {
  if (name === 'about') {
    writeOut('about/index.html', page({
      depth: 1, title: 'About', description: (profileBuilt && profileBuilt.hero && profileBuilt.hero.summary) || site.description,
      canonical: `${base}/about/`, hashRoute: '#/about',
      body: renderProfileStatic(profileBuilt)
    }));
    continue;
  }
  const src = join(ROOT, `content/pages/${name}.md`);
  if (!existsSync(src)) continue;
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  writeOut(`${name}/index.html`, page({
    depth: 1, title, description: site.description,
    canonical: `${base}/${name}/`, hashRoute: `#/${name}`,
    body: `<article class="container prose">${marked.parse(readFileSync(src, 'utf8'))}</article>`
  }));
}

/* ------------------------------------------------------- sitemap and feed */
/* Prune stale prerendered directories so an unpublished or removed item     */
/* cannot leave an orphaned public page behind.                              */
const pruneStale = (parent, keepIds) => {
  const dir = join(OUT_DIR, parent);
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry === 'index.html') continue;
    if (!keepIds.has(entry)) rmSync(join(dir, entry), { recursive: true, force: true });
  }
};
pruneStale('courses', new Set(outCourses.map(c => c.id)));
pruneStale('materials', new Set(outMaterials.map(m => m.id)));

/* ------------------------------------------------------- sitemap and feed */
/* C6: canonical static URLs only. Hash URLs must never appear in the sitemap. */
if (base) {
  const sectionUrls = ['', 'courses/', 'case-studies/', 'presentations/', 'projects/', 'resources/', 'about/', 'contact/'];
  const urls = [
    ...sectionUrls.map(s => `${base}/${s}`),
    ...staticPages.map(p => p.canonical)
  ];
  const hashInSitemap = urls.filter(u => u.includes('#'));
  if (hashInSitemap.length) fail(`sitemap: hash URLs are not permitted (${hashInSitemap.length} found)`);

  writeOut('sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${esc(u)}</loc></url>`).join('\n') +
    `\n</urlset>\n`);

  writeOut('feed.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n` +
    `<title>${esc(site.title)}</title>\n<link>${esc(base)}</link>\n<description>${esc(site.description)}</description>\n` +
    outCourses.map(c =>
      `<item><title>${esc(c.title)}</title><link>${esc(canonicalOf('courses', c.id))}</link>` +
      `<guid isPermaLink="false">${esc(c.id)}</guid><description>${esc(c.summary)}</description></item>`
    ).join('\n') +
    `\n</channel></rss>\n`);
}

/* ------------------------------------------------------------------ report */
const label = PREVIEW ? `preview -> ${relative(ROOT, OUT_DIR) || '.'}` : 'published';
console.log(`\nBuild (${label})${INCLUDE_DRAFTS ? '  [DRAFTS INCLUDED - NOT FOR PUBLICATION]' : ''}`);
console.log(`  Courses            ${outCourses.length}`);
console.log(`  Materials          ${outMaterials.length}${draftIds.size ? `  (${draftIds.size} held as draft)` : ''}`);
console.log(`  Disciplines        ${disciplines.length}`);
console.log(`  Static pages       ${staticPages.length}`);
console.log(`  Files scanned      ${scanFiles.length}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach(p => console.error(`  - ${p}`));
  process.exitCode = 1;
} else {
  console.log('\n✓ No problems found.\n');
}

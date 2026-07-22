(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const main = $('#main');
  let site = null;
  let index = null;
  let disciplines = [];

  const esc = (value = '') => String(value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const titleCase = value => String(value).replace(/-/g,' ').replace(/\b\w/g, m => m.toUpperCase());
  const courseById = id => index.courses.find(c => c.id === id);
  const disciplineById = id => disciplines.find(d => d.id === id);
  /* The build decides what is published. The client never filters drafts back in. */
  const publishedCourses = () => index.courses;
  const publishedMaterials = () => index.materials;
  const materialById = id => index.materials.find(m => m.id === id);
  const MATERIAL_LABELS = {'case-study':'Case Study','presentation':'Presentation','project':'Project','resource':'Teaching Resource'};
  const MATERIAL_ROUTES = {'case-study':'#/case-studies','presentation':'#/presentations','project':'#/projects','resource':'#/resources'};

  const icons = {
    chart:'<path d="M4 19V9m5 10V5m5 14v-7m5 7V3"/><path d="M3 21h18"/>',
    network:'<circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m7 7.5 3 2.5m4 0 3-2.5m-10 9 3-2.5m4 0 3 2.5"/>',
    brain:'<path d="M9.5 4.5A3 3 0 0 0 4 6v1a3 3 0 0 0-1 5.5A3 3 0 0 0 6 17h3.5zM14.5 4.5A3 3 0 0 1 20 6v1a3 3 0 0 1 1 5.5A3 3 0 0 1 18 17h-3.5z"/><path d="M9.5 8H7m2.5 4H6m8.5-4H17m-2.5 4H18M12 4v16"/>',
    supply:'<rect x="3" y="14" width="6" height="5" rx="1"/><rect x="15" y="14" width="6" height="5" rx="1"/><rect x="9" y="4" width="6" height="5" rx="1"/><path d="M12 9v3M6 14v-2h12v2"/>',
    factory:'<path d="M3 21V9l6 3V8l6 4V5l6 4v12z"/><path d="M7 17h2m3 0h2m3 0h2"/>',
    decision:'<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h5M8 17h3"/><path d="m14 16 2 2 4-5"/>',
    operations:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9 7 7m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    transform:'<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/><path d="M14 5h5v5M10 19H5v-5M19 5l-6 6M5 19l6-6"/>',
    book:'<path d="M4 5a3 3 0 0 1 3-2h5v17H7a3 3 0 0 0-3 2zM20 5a3 3 0 0 0-3-2h-5v17h5a3 3 0 0 1 3 2z"/>',
    users:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
    screen:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M5 21h14"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    filter:'<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18"/>',
    graduation:'<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 3 9 3 12 0v-5M22 9v6"/>',
    wrench:'<path d="M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-5-5l2 3-3 3-3-2a4 4 0 0 0 7-1z"/>'
  };
  const icon = (name, cls='') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.book}</svg>`;

  // additional stroke icons used by the profile page
  Object.assign(icons, {
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".7" fill="currentColor"/>',
    bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1h6c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3z"/>',
    location:'<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone:'<path d="M6.5 10.5a15 15 0 0 0 7 7l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.56 3.5a1 1 0 0 1-.24 1z"/>',
    mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/>',
    handshake:'<path d="m8 12 2-2 2 2 2-2 3 3-4 4-2-2-2 2-4-4 3-3z"/><path d="M2 9h4l3 3M22 9h-4l-3 3"/>'
  });

  // brand marks rendered as complete inline SVG (no external icon library)
  const BRAND = {
    'github':'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.11.79-.25.79-.55 0-.28-.01-1-.02-1.97-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.75.12 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>',
    'linkedin':'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
    'orcid':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#a6ce39"/><path fill="#fff" d="M7.6 9.2h1.5v9.1H7.6zM8.35 6.3a.95.95 0 1 1 0 1.9.95.95 0 0 1 0-1.9zM11.3 9.2h3.5c3.34 0 4.8 2.39 4.8 4.55 0 2.35-1.84 4.55-4.78 4.55H11.3zm1.5 1.35v6.4h1.85c2.63 0 3.23-2 3.23-3.2 0-1.95-1.24-3.2-3.28-3.2z"/></svg>',
    'google-scholar':'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 1 9l11 6 7-3.82V17h2V9zM5 13.18v3.32C5 17.9 8.13 19 12 19s7-1.1 7-2.5v-3.32l-7 3.82z"/></svg>',
    'researchgate':'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="4" fill="#00ccbb"/><text x="12" y="16.5" font-family="Georgia,serif" font-size="11" fill="#fff" text-anchor="middle" font-weight="700">RG</text></svg>',
    'stackoverflow':'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.36 20.2v-5.38h1.79V22H3.84v-7.18h1.8v5.38z"/><path fill="#f48024" d="m7.42 13.31 8.76 1.83.37-1.76-8.76-1.83zM8.56 9.15l8.11 3.78.75-1.62-8.11-3.78zm2.21-3.95-.99 1.32 6.87 5.14 1-1.32zM15.1 1l-1.44 1.07 5.32 7.16 1.44-1.07zM7.23 18.5h8.94v-1.79H7.23z"/></svg>',
    'blog':'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M5 11a8 8 0 0 1 8 8M5 4a15 15 0 0 1 15 15"/><circle cx="6" cy="18" r="1.7" fill="currentColor"/></svg>',
    'cv':'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M12 11v6m0 0-2.3-2.3M12 17l2.3-2.3"/></svg>',
    'python':'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="5" fill="#3776ab"/><text x="12" y="16" font-family="Inter,system-ui,sans-serif" font-size="10" fill="#fff" text-anchor="middle" font-weight="700">Py</text></svg>',
    'r':'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="5" fill="#276dc3"/><text x="12" y="16.5" font-family="Inter,system-ui,sans-serif" font-size="12" fill="#fff" text-anchor="middle" font-weight="700">R</text></svg>'
  };
  const brand = name => BRAND[name] || icon('network');
  const extIcon = '<svg class="ext" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

  function setMeta(title, description) {
    document.title = `${title} | ${site.shortName}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = description || site.description;
  }

  function activeNav(route) {
    $$('.desktop-nav a,.mobile-nav a').forEach(a => {
      const target = a.getAttribute('href').replace('#','');
      const active = target === '/' ? route === '/' : route.startsWith(target);
      if (active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
  }

  function breadcrumb(items) {
    return `<div class="breadcrumb">${items.map((item,i) => item.url ? `<a href="${item.url}">${esc(item.label)}</a><span>›</span>` : `<span>${esc(item.label)}</span>`).join('')}</div>`;
  }

  function courseCard(c) {
    return `<article class="course-card">
      <div class="course-card-media"><img src="${esc(c.cover)}" alt=""><span class="course-badge">${esc(c.programmeLevels.join(' / '))}</span></div>
      <div class="course-card-body"><h3><a href="#/course/${esc(c.id)}">${esc(c.title)}</a></h3><p>${esc(c.summary)}</p>
      <div class="course-card-meta"><span>${esc(c.duration)}</span><span>${esc(c.credits)} credits</span></div>
      <a class="card-action" href="#/course/${esc(c.id)}">View course →</a></div></article>`;
  }

  function homeView() {
    const courses = publishedCourses();
    const featured = courses.filter(c => c.featured).slice(0,4);
    const disciplineCards = disciplines.map((d,i) => {
      const iconNames = ['briefcase','wrench','chart','brain','transform','supply'];
      return `<article class="discipline-card"><span class="discipline-icon">${icon(iconNames[i])}</span><div><h3>${esc(d.name)}</h3><p>${esc(d.description)}</p></div></article>`;
    }).join('');
    main.innerHTML = `
      <section class="hero"><div class="container hero-grid"><div class="hero-copy">
        <div class="eyebrow">${esc(site.heroEyebrow)}</div>
        <h1>Graduate and Postgraduate Courses for <em>Business and Engineering.</em></h1>
        <p>${esc(site.heroText)}</p>
        <div class="hero-actions"><a class="button primary" href="#/courses">Browse courses →</a><a class="button secondary" href="#/case-studies">View case studies</a></div>
        <div class="hero-stats"><div class="hero-stat"><strong>${courses.length}</strong><span>Courses</span></div><div class="hero-stat"><strong>${disciplines.length}</strong><span>Discipline areas</span></div><div class="hero-stat"><strong>2</strong><span>Programme levels</span></div></div>
      </div><div class="hero-visual"><img src="assets/img/hero-architecture.svg" alt="Abstract architectural forms representing business and engineering education"></div></div></section>
      <section class="section"><div class="container"><div class="section-head"><div><div class="eyebrow">Course portfolio</div><h2>Featured courses</h2><p>Focused learning experiences for graduate and postgraduate students in management and engineering.</p></div><a class="section-link" href="#/courses">View all courses →</a></div><div class="course-grid">${featured.map(courseCard).join('')}</div></div></section>
      <section class="section tinted"><div class="container"><div class="section-head"><div><div class="eyebrow">Discipline focus</div><h2>Six connected areas</h2><p>Courses can span multiple areas while retaining a clear management or engineering application.</p></div></div><div class="discipline-grid">${disciplineCards}</div></div></section>
      <section class="section dark"><div class="container"><div class="path-grid">
        <div class="path-item">${icon('search')}<h3>Find a course</h3><p>Search by title, discipline, level, format or duration.</p></div>
        <div class="path-item">${icon('book')}<h3>Use case studies</h3><p>Explore classroom cases linked directly to course contexts.</p></div>
        <div class="path-item">${icon('screen')}<h3>Review presentations</h3><p>Locate lecture and workshop presentation resources.</p></div>
        <div class="path-item">${icon('layers')}<h3>Develop projects</h3><p>Connect courses with applied capstone and project briefs.</p></div>
      </div></div></section>`;
    setMeta('Home', site.description);
  }

  function coursesView(params) {
    main.innerHTML = `<section class="page-hero"><div class="container page-heading">${breadcrumb([{label:'Home',url:'#/'},{label:'Courses'}])}<div class="eyebrow">Graduate and postgraduate</div><h1>Course Catalogue</h1><p>Explore courses for Business Management and Engineering using practical filters for discipline, programme level, delivery format, subject area and duration.</p></div></section>
    <div class="container catalogue-shell"><aside class="filters"><h2>Filter courses</h2><div class="filter-layout">
      <div class="filter-group"><label for="courseSearch">Keyword search</label><input class="filter-control" id="courseSearch" type="search" placeholder="Title or keyword"></div>
      <div class="filter-group"><label for="disciplineFilter">Discipline</label><select class="filter-control" id="disciplineFilter"><option value="">All disciplines</option>${disciplines.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></div>
      <div class="filter-group"><label for="levelFilter">Programme level</label><select class="filter-control" id="levelFilter"><option value="">All levels</option><option>Graduate</option><option>Postgraduate</option></select></div>
      <div class="filter-group"><label for="formatFilter">Delivery format</label><select class="filter-control" id="formatFilter"><option value="">All formats</option>${['Classroom','Online','Hybrid','Executive Workshop'].map(v=>`<option>${v}</option>`).join('')}</select></div>
      <div class="filter-group"><label for="subjectFilter">Subject area</label><select class="filter-control" id="subjectFilter"><option value="">All subject areas</option>${publishedCourses().map(c=>`<option>${esc(c.subjectArea)}</option>`).join('')}</select></div>
      <div class="filter-group"><label for="durationFilter">Course duration</label><select class="filter-control" id="durationFilter"><option value="">All durations</option>${[...new Set(publishedCourses().map(c=>c.durationWeeks))].sort((a,b)=>a-b).map(v=>`<option value="${v}">${v} weeks</option>`).join('')}</select></div>
      </div><button class="clear-button" id="clearFilters" type="button">Clear all filters</button></aside>
      <section><div class="catalogue-toolbar"><div class="catalogue-count" id="courseCount"></div><select class="filter-control" id="sortFilter" aria-label="Sort courses" style="width:auto"><option value="title">Sort: Title</option><option value="featured">Sort: Featured</option><option value="duration">Sort: Duration</option></select></div><div class="catalogue-list" id="courseResults"></div></section></div>`;
    const controls = ['courseSearch','disciplineFilter','levelFilter','formatFilter','subjectFilter','durationFilter','sortFilter'].map(id=>$('#'+id));
    const render = () => {
      const q = $('#courseSearch').value.trim().toLowerCase();
      const discipline = $('#disciplineFilter').value, level=$('#levelFilter').value, format=$('#formatFilter').value, subject=$('#subjectFilter').value, duration=$('#durationFilter').value;
      let found = publishedCourses().filter(c => {
        const hay = `${c.title} ${c.summary} ${c.description} ${c.subjectArea}`.toLowerCase();
        return (!q || hay.includes(q)) && (!discipline || c.disciplines.includes(discipline)) && (!level || c.programmeLevels.includes(level)) && (!format || c.deliveryFormats.includes(format)) && (!subject || c.subjectArea===subject) && (!duration || String(c.durationWeeks)===duration);
      });
      const sort = $('#sortFilter').value;
      if (sort==='featured') found.sort((a,b)=>Number(b.featured)-Number(a.featured)||a.title.localeCompare(b.title));
      else if (sort==='duration') found.sort((a,b)=>a.durationWeeks-b.durationWeeks||a.title.localeCompare(b.title));
      else found.sort((a,b)=>a.title.localeCompare(b.title));
      $('#courseCount').textContent = `${found.length} course${found.length===1?'':'s'} found`;
      $('#courseResults').innerHTML = found.length ? found.map(c=>`<article class="catalogue-item"><div class="catalogue-thumb"><img src="${esc(c.cover)}" alt=""></div><div><h2><a href="#/course/${esc(c.id)}">${esc(c.title)}</a></h2><p>${esc(c.summary)}</p><div class="catalogue-tags">${c.disciplines.map(id=>`<span class="tag">${esc(disciplineById(id).name)}</span>`).join('')}</div></div><div class="catalogue-meta"><strong>${esc(c.programmeLevels.join(' / '))}</strong><span>${esc(c.duration)} · ${esc(c.deliveryFormats.join(' / '))}</span></div></article>`).join('') : '<div class="empty-state"><h2>No matching courses</h2><p>Adjust or clear the filters to see more results.</p></div>';
    };
    controls.forEach(el=>el.addEventListener(el.tagName==='INPUT'?'input':'change',render));
    $('#clearFilters').addEventListener('click',()=>{ controls.forEach(el=>{if(el.id!=='sortFilter')el.value='';}); $('#sortFilter').value='title'; render(); $('#courseSearch').focus();});
    render();
    if (params.get('focus')==='search') setTimeout(()=>$('#courseSearch')?.focus(),50);
    setMeta('Courses','Graduate and postgraduate course catalogue for Business Management and Engineering.');
  }

  function fact(iconName,label,value){return `<div class="fact-row">${icon(iconName)}<div><strong>${esc(label)}</strong><span>${esc(value)}</span></div></div>`;}
  function materialCard(m) {
    const c = courseById(m.courseId);
    const read = `#/material/${esc(m.id)}`;
    const dl = m.file ? `<a class="material-download" href="${esc(m.file)}" download title="Download the source file" aria-label="Download ${esc(m.title)} source file">${icon('download')}<span>Download</span></a>` : '';
    return `<article class="material-card"><span class="material-type">${MATERIAL_LABELS[m.type]}</span>
      <h3><a href="${read}">${esc(m.title)}</a></h3><p>${esc(m.summary)}</p>
      <footer><span class="material-course">${esc(c ? c.title : '')}</span>
      <span class="material-actions"><a class="material-read" href="${read}">Read →</a>${dl}</span></footer></article>`;
  }

  function courseDetailView(id) {
    const c = courseById(id);
    if (!c || (c.status==='draft'&&!site.showDrafts)) return notFoundView();
    const related = publishedMaterials().filter(m=>m.courseId===c.id);
    const ds = c.disciplines.map(id=>disciplineById(id)?.name).filter(Boolean).join(', ');
    main.innerHTML = `<section class="course-detail-hero"><div class="container">${breadcrumb([{label:'Home',url:'#/'},{label:'Courses',url:'#/courses'},{label:c.title}])}<div class="detail-grid"><div class="course-icon-title"><span class="large-course-icon">${icon(c.icon)}</span><div class="detail-title"><div class="course-kicker">${esc(ds)}</div><h1>${esc(c.title)}</h1><p>${esc(c.description)}</p></div></div><aside class="course-facts">
      ${fact('graduation','Programme',c.programmeLevels.join(' / '))}${fact('clock','Duration',c.duration)}${fact('screen','Delivery mode',c.deliveryFormats.join(' / '))}${fact('book','Credits',String(c.credits))}${fact('users','Intended audience',c.audience)}
      <a class="button primary" href="${esc(c.syllabus)}" download>${icon('download')} Download syllabus</a></aside></div></div></section>
      <div class="detail-nav-wrap"><nav class="container detail-nav" aria-label="Course sections"><a href="#overview">Overview</a><a href="#outcomes">Learning outcomes</a><a href="#modules">Modules</a><a href="#assessment">Assessment</a><a href="#related">Related materials</a></nav></div>
      <div class="container detail-content"><div class="content-grid"><div>
        <section class="content-section" id="overview"><h2>Course overview</h2><p>${esc(c.description)}</p><p>This course is designed for ${esc(c.audience.charAt(0).toLowerCase()+c.audience.slice(1))}</p></section>
        <section class="content-section" id="outcomes"><h2>What participants will learn</h2><ul class="outcome-list">${c.outcomes.map(o=>`<li>${esc(o)}</li>`).join('')}</ul></section>
        <section class="content-section" id="modules"><h2>Module structure</h2><div class="module-list">${c.modules.map((m,i)=>`<details ${i===0?'open':''}><summary><span class="module-number">${String(i+1).padStart(2,'0')}</span><span class="module-title"><strong>${esc(m.title)}</strong><span>${esc(m.description)}</span></span><span class="module-chevron">⌄</span></summary><div class="module-body">${esc(m.description)} Activities can be adapted for classroom, online or hybrid delivery.</div></details>`).join('')}</div></section>
        <section class="content-section" id="assessment"><h2>Assessment pattern</h2><div class="assessment-grid">${c.assessment.map(a=>`<div class="assessment-card"><strong>${esc(a.name)}</strong><span>${esc(a.weight)}</span></div>`).join('')}</div></section>
        <section class="content-section" id="related"><h2>Related materials</h2>${related.length?`<div class="related-grid">${related.map(materialCard).join('')}</div>`:'<p>Related materials can be added as the course portfolio expands.</p>'}</section>
      </div><aside><div class="side-card"><h3>Course information</h3><p>Use this summary to assess fit for a programme, cohort or professional-development requirement.</p><dl><dt>Subject area</dt><dd>${esc(c.subjectArea)}</dd><dt>Disciplines</dt><dd>${esc(ds)}</dd><dt>Prerequisites</dt><dd>${esc(c.prerequisites)}</dd><dt>Last updated</dt><dd>${esc(c.updated)}</dd></dl></div></aside></div></div>`;
    setMeta(c.title,c.summary);
  }

  const materialPageInfo = {
    'case-studies':{type:'case-study',title:'Case Studies',eyebrow:'Classroom decisions',description:'Practice-oriented cases connected to the approved graduate and postgraduate course portfolio.'},
    'presentations':{type:'presentation',title:'Presentations',eyebrow:'Lecture and workshop materials',description:'Presentation resources for course delivery, workshops and structured classroom discussion.'},
    'projects':{type:'project',title:'Projects',eyebrow:'Applied learning',description:'Capstone and applied project briefs that connect course ideas with practical business and engineering contexts.'},
    'resources':{type:'resource',title:'Teaching Resources',eyebrow:'Reusable materials',description:'Templates, dataset guides and practical resources designed to support course delivery.'}
  };
  function materialsView(route) {
    const info = materialPageInfo[route];
    const all = publishedMaterials().filter(m=>m.type===info.type);
    main.innerHTML = `<section class="page-hero"><div class="container page-heading">${breadcrumb([{label:'Home',url:'#/'},{label:info.title}])}<div class="eyebrow">${esc(info.eyebrow)}</div><h1>${esc(info.title)}</h1><p>${esc(info.description)}</p><div class="materials-filter"><select class="filter-control" id="materialCourseFilter"><option value="">All associated courses</option>${publishedCourses().map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></div></div></section><section class="container"><div class="materials-grid" id="materialsResults"></div></section>`;
    const render=()=>{const id=$('#materialCourseFilter').value;const found=all.filter(m=>!id||m.courseId===id);$('#materialsResults').innerHTML=found.length?found.map(materialCard).join(''):'<div class="empty-state"><h2>Nothing published yet</h2><p>Materials for this section are in preparation and will appear here once reviewed.</p></div>';};
    $('#materialCourseFilter').addEventListener('change',render);render();setMeta(info.title,info.description);
  }

  /* ---------------------------------------------- material reading page */
  async function materialDetailView(id) {
    const m = materialById(id);
    if (!m) return notFoundView(`No teaching material is published at this address.`);
    const c = courseById(m.courseId);
    const listRoute = MATERIAL_ROUTES[m.type] || '#/';
    const label = MATERIAL_LABELS[m.type] || 'Material';

    /* Previous / next within the same material type, alphabetical as listed. */
    const siblings = publishedMaterials().filter(x => x.type === m.type);
    const pos = siblings.findIndex(x => x.id === m.id);
    const prev = pos > 0 ? siblings[pos - 1] : null;
    const next = pos > -1 && pos < siblings.length - 1 ? siblings[pos + 1] : null;

    const meta = [
      ['Type', label],
      ['Format', m.format],
      ['Suggested duration', m.duration],
      ['Reading time', m.readingTime ? `${m.readingTime} min` : ''],
      ['Last updated', m.updated]
    ].filter(([, v]) => v);

    const cite = `${site.copyright} (${(m.updated || '').slice(0, 4) || 'n.d.'}). ${m.title} [${label}]. ${site.title}. ${(site.baseUrl || '').replace(/\/+$/, '')}/materials/${m.id}/`;

    main.innerHTML = `
      <section class="page-hero"><div class="container page-heading">
        ${breadcrumb([{ label: 'Home', url: '#/' }, { label, url: listRoute }, { label: m.title }])}
        <div class="eyebrow">${esc(label)}</div>
        <h1>${esc(m.title)}</h1>
        <p>${esc(m.summary)}</p>
        ${m.status === 'draft' ? '<p class="material-draft-flag">This material is a draft and is not part of the published portfolio.</p>' : ''}
      </div></section>
      <div class="container reading-shell"><article class="reading-body prose" id="readingBody">
        <div class="loading-state">Loading material…</div>
      </article><aside class="reading-side">
        <div class="side-card">
          <h3>About this material</h3>
          <dl>${meta.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
          ${c ? `<p class="side-course">Associated course<br><a href="#/course/${esc(c.id)}">${esc(c.title)} →</a></p>` : ''}
          ${m.file ? `<a class="button secondary reading-download" href="${esc(m.file)}" download>${icon('download')} Download source file</a>` : ''}
        </div>
        <div class="cite-block">
          <h3>Cite this material</h3>
          <p class="cite-text">${esc(cite)}</p>
          ${m.license ? `<p class="cite-license">${esc(m.license)}${m.rightsNotes ? ` — ${esc(m.rightsNotes)}` : ''}</p>` : ''}
        </div>
      </aside></div>
      <div class="container reading-nav">
        ${prev ? `<a class="reading-prev" href="#/material/${esc(prev.id)}"><span>← Previous</span><strong>${esc(prev.title)}</strong></a>` : '<span></span>'}
        <a class="reading-back" href="${listRoute}">All ${esc(label.toLowerCase())}s</a>
        ${next ? `<a class="reading-next" href="#/material/${esc(next.id)}"><span>Next →</span><strong>${esc(next.title)}</strong></a>` : '<span></span>'}
      </div>`;

    setMeta(m.title, m.summary);

    if (!m.file) {
      $('#readingBody').innerHTML = '<p>The body of this material is not yet available.</p>';
      return;
    }
    try {
      const res = await fetch(m.file);
      if (!res.ok) throw new Error('unavailable');
      $('#readingBody').innerHTML = marked.parse(await res.text());
    } catch (e) {
      $('#readingBody').innerHTML = `<p>This material could not be loaded. You can <a href="${esc(m.file)}" download>download the source file</a> instead.</p>`;
    }
  }

  async function aboutView() {
    main.innerHTML = '<div class="loading-state">Loading profile…</div>';
    let p;
    try {
      const r = await fetch('content/profile.built.json');
      if (!r.ok) throw new Error('no profile');
      p = await r.json();
    } catch (e) { return pageView('about'); }

    const pv = !!p.draftPreview;
    const h = p.hero || {}; const c = h.contact || {};
    const initials = (h.name || site.initials || '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
    const avatar = h.photo
      ? `<img class="profile-photo" src="${esc(h.photo)}" alt="${esc(h.photoAlt || h.name || '')}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="profile-photo profile-initials" style="display:none" aria-hidden="true">${esc(initials)}</div>`
      : `<div class="profile-photo profile-initials" role="img" aria-label="${esc(h.name || '')}">${esc(initials)}</div>`;

    const contactRow = (ic, label, val, href) => val
      ? `<div class="pc-row">${icon(ic)}<div><strong>${esc(label)}</strong>${href ? `<a href="${esc(href)}">${esc(val)}</a>` : `<span>${esc(val)}</span>`}</div></div>`
      : (pv ? `<div class="pc-row muted">${icon(ic)}<div><strong>${esc(label)}</strong><span>[add ${esc(label.toLowerCase())}]</span></div></div>` : '');
    const contactBlock = [
      contactRow('location', 'Location', c.location),
      contactRow('mail', 'Email', c.email, c.email ? `mailto:${c.email}` : ''),
      contactRow('phone', 'Phone', c.phone, c.phone ? `tel:${String(c.phone).replace(/\s+/g, '')}` : ''),
      contactRow('clock', 'Office hours', c.officeHours)
    ].join('');

    const cvBtn = h.cvUrl
      ? `<a class="button secondary" href="${esc(h.cvUrl)}" download>${icon('download')} Download CV</a>`
      : (pv ? `<span class="button secondary disabled" aria-disabled="true">${icon('download')} Download CV</span>` : '');

    const socialLink = s => {
      const has = s.url && s.url.trim();
      if (!has && !pv) return '';
      const inner = `<span class="s-icon">${brand(s.icon)}</span><span class="s-label">${esc(s.label)}</span>`;
      return has
        ? `<a class="social-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.label)} (opens in a new tab)">${inner}${extIcon}</a>`
        : `<span class="social-link muted" role="listitem" aria-label="${esc(s.label)} — not set">${inner}</span>`;
    };
    const socials = (p.social || []).map(socialLink).filter(Boolean).join('');

    const focusCard = f => (f && ((f.items && f.items.length) || f.description))
      ? `<article class="focus-card"><span class="focus-ic">${icon(f.icon || 'target')}</span><div><h3>${esc(f.title || '')}</h3>${
          f.items && f.items.length ? `<ul>${f.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}${
          f.description ? `<p>${esc(f.description)}${f.years ? ` ${esc(f.years)}` : (pv && ('years' in f) ? ' <span class="muted">[add years]</span>' : '')}</p>` : ''}</div></article>` : '';
    const fo = p.focus || {};
    const focusCards = [focusCard(fo.professional), focusCard(fo.teaching), focusCard(fo.industry), focusCard(fo.expertise)].filter(Boolean).join('');

    const stats = p.stats || [];
    const statsRow = stats.length ? `<section class="container"><div class="profile-stats">${stats.map(s => `<div class="stat"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join('')}</div></section>` : '';

    const cardList = (title, ic, items, render) => items && items.length
      ? `<article class="profile-card"><h3>${icon(ic)} ${title}</h3><div class="pc-body">${items.map(render).join('')}</div></article>` : '';

    const eduCard = cardList('Education', 'graduation', p.education, e =>
      `<div class="edu-item"><strong>${esc([e.qualification, e.discipline].filter(Boolean).join(' — '))}</strong>${e.institution ? `<span>${esc(e.institution)}${e.country ? `, ${esc(e.country)}` : ''}</span>` : ''}${e.year ? `<em>${esc(e.year)}</em>` : ''}${e.distinction ? `<span class="edu-dist">${esc(e.distinction)}</span>` : ''}</div>`);

    const bookCard = cardList('Books authored', 'book', p.books, b => {
      const links = [b.viewUrl ? `<a href="${esc(b.viewUrl)}" target="_blank" rel="noopener noreferrer">View book${extIcon}</a>` : '', b.detailsUrl ? `<a href="${esc(b.detailsUrl)}" target="_blank" rel="noopener noreferrer">More details${extIcon}</a>` : ''].filter(Boolean).join('');
      const cover = b.cover ? `<img class="book-cover" src="${esc(b.cover)}" alt="Cover of ${esc(b.title)}">` : `<div class="book-cover book-cover-blank" aria-hidden="true">${icon('book')}</div>`;
      return `<div class="book-item">${cover}<div><strong>${esc(b.title)}</strong>${b.subtitle ? `<span>${esc(b.subtitle)}</span>` : ''}${(b.publisher || b.year) ? `<em>${esc([b.publisher, b.year].filter(Boolean).join(', '))}</em>` : ''}${b.description ? `<p>${esc(b.description)}</p>` : ''}${links ? `<div class="book-links">${links}</div>` : ''}</div></div>`;
    });

    const pkgRender = langIcon => k => {
      const links = [
        k.pypiUrl ? `<a href="${esc(k.pypiUrl)}" target="_blank" rel="noopener noreferrer">PyPI${extIcon}</a>` : '',
        k.cranUrl ? `<a href="${esc(k.cranUrl)}" target="_blank" rel="noopener noreferrer">CRAN${extIcon}</a>` : '',
        k.githubUrl ? `<a href="${esc(k.githubUrl)}" target="_blank" rel="noopener noreferrer"><span class="gh">${brand('github')}</span>GitHub</a>` : '',
        k.docsUrl ? `<a href="${esc(k.docsUrl)}" target="_blank" rel="noopener noreferrer">Docs${extIcon}</a>` : '',
        k.url ? `<a href="${esc(k.url)}" target="_blank" rel="noopener noreferrer">Open${extIcon}</a>` : ''
      ].filter(Boolean).join('');
      return `<div class="pkg-item"><span class="pkg-ic">${brand(langIcon)}</span><div><strong>${esc(k.name)}${k.version ? ` <span class="pkg-ver">${esc(k.version)}</span>` : ''}</strong>${k.description ? `<span>${esc(k.description)}</span>` : ''}${links ? `<div class="pkg-links">${links}</div>` : ''}</div></div>`;
    };
    const sw = p.software || { python: [], r: [], other: [] };
    const swItems = [...(sw.python || []).map(pkgRender('python')), ...(sw.r || []).map(pkgRender('r')), ...(sw.other || []).map(pkgRender('github'))];
    const swCard = swItems.length ? `<article class="profile-card"><h3>${icon('layers')} Software, packages &amp; open source</h3><div class="pc-body">${swItems.join('')}</div></article>` : '';

    const engRender = e => `<div class="eng-item"><strong>${esc(e.title)}</strong>${(e.organisation || e.audience) ? `<span>${esc([e.organisation, e.audience].filter(Boolean).join(' · '))}</span>` : ''}${(e.location || e.year || e.duration) ? `<em>${esc([e.location, e.year, e.duration].filter(Boolean).join(' · '))}</em>` : ''}${e.description ? `<p>${esc(e.description)}</p>` : ''}${e.tags && e.tags.length ? `<div class="mini-tags">${e.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}</div>`;
    const consultingCard = cardList('Consulting, FDP &amp; training', 'handshake', p.consulting, engRender);

    const confRender = x => `<div class="eng-item"><strong>${esc(x.name)}</strong>${x.role ? `<span>${esc(x.role)}</span>` : ''}${(x.location || x.date) ? `<em>${esc([x.location, x.date].filter(Boolean).join(' · '))}</em>` : ''}${x.topic ? `<p>${esc(x.topic)}</p>` : ''}${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Details${extIcon}</a>` : ''}</div>`;
    const talkRender = t => `<div class="eng-item"><strong>${esc(t.title)}</strong>${(t.organisation || t.audience) ? `<span>${esc([t.organisation, t.audience].filter(Boolean).join(' · '))}</span>` : ''}${(t.topic || t.year) ? `<em>${esc([t.topic, t.year].filter(Boolean).join(' · '))}</em>` : ''}${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">Event${extIcon}</a>` : ''}</div>`;
    const confItems = [...(p.conferences || []).map(confRender), ...(p.talks || []).map(talkRender), ...(p.accolades || []).map(a => `<div class="eng-item"><strong>${esc(a.title)}</strong>${a.detail ? `<span>${esc(a.detail)}</span>` : ''}${a.year ? `<em>${esc(a.year)}</em>` : ''}</div>`)];
    const confCard = confItems.length ? `<article class="profile-card"><h3>${icon('mic')} Conferences, talks &amp; recognition</h3><div class="pc-body">${confItems.join('')}</div></article>` : '';

    const svcItems = [...(p.service || []).map(s => `<li><strong>${esc(s.category)}</strong>${s.detail ? ` — ${esc(s.detail)}` : ''}</li>`), ...(p.memberships || []).map(m => `<li><strong>${esc(m.organisation)}</strong>${m.role ? ` — ${esc(m.role)}` : ''}${m.since ? ` (${esc(m.since)})` : ''}</li>`)];
    const svcCard = svcItems.length ? `<article class="profile-card"><h3>${icon('users')} Academic service &amp; memberships</h3><ul class="svc-list">${svcItems.join('')}</ul></article>` : '';

    const tagCard = (title, ic, list) => list && list.length ? `<article class="profile-card"><h3>${icon(ic)} ${title}</h3><div class="tag-cloud">${list.map(t => `<span class="pill">${esc(t)}</span>`).join('')}</div></article>` : '';
    const research = tagCard('Research interests', 'search', p.researchInterests);
    const teaching = tagCard('Teaching interests', 'graduation', p.teachingInterests);

    const detailCards = [eduCard, bookCard, swCard, consultingCard, confCard].filter(Boolean).join('');
    const bottomCards = [svcCard, research, teaching].filter(Boolean).join('');

    main.innerHTML = `
      ${pv ? '<div class="container"><p class="profile-preview-note">Draft preview — records shown here that are still marked draft are hidden on the published site until you complete them.</p></div>' : ''}
      <section class="profile-hero"><div class="container profile-hero-grid">
        <div class="profile-avatar-wrap">${avatar}</div>
        <div class="profile-intro">
          <h1>${esc(h.name || '')}</h1>
          ${h.headline ? `<p class="profile-headline">${esc(h.headline)}</p>` : ''}
          ${h.summary ? `<p class="profile-summary">${esc(h.summary)}</p>` : ''}
          <div class="profile-actions"><a class="button primary" href="#/courses">${icon('graduation')} View courses</a><a class="button secondary" href="#/contact">${icon('mail')} Contact</a>${cvBtn}</div>
        </div>
        ${contactBlock ? `<aside class="profile-contact">${contactBlock}</aside>` : ''}
      </div></section>
      ${socials ? `<section class="container"><div class="social-row" role="list" aria-label="Professional profiles">${socials}</div></section>` : ''}
      ${focusCards ? `<section class="container"><div class="focus-grid">${focusCards}</div></section>` : ''}
      ${statsRow}
      ${detailCards ? `<section class="container"><div class="profile-grid">${detailCards}</div></section>` : ''}
      ${bottomCards ? `<section class="container"><div class="profile-grid profile-grid-3">${bottomCards}</div></section>` : ''}
      <div class="profile-foot-space"></div>`;

    setMeta('About', h.summary || site.description);
  }

  async function pageView(page) {
    try {
      const res = await fetch(`content/pages/${page}.md`);
      if (!res.ok) throw new Error('Page unavailable');
      const md = await res.text();
      main.innerHTML = `<section class="page-hero"><div class="container">${breadcrumb([{label:'Home',url:'#/'},{label:titleCase(page)}])}</div></section><article class="container prose">${marked.parse(md)}</article>`;
      if(page==='contact') $('.prose')?.insertAdjacentHTML('beforeend',`<div class="contact-panel">${site.links.map(l=>`<a class="button secondary" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>`);
      setMeta(titleCase(page),site.description);
    } catch(e){ notFoundView(); }
  }

  function notFoundView(message){
    main.innerHTML=`<section class="error-page"><div><div class="eyebrow">Page not found</div><h1>Nothing is published here.</h1><p>${esc(message||'This address does not match any published page.')}</p><p><a class="button primary" href="#/">Return home</a></p></div></section>`;
    setMeta('Page not found',site.description);
  }

  function footer(){
    $('#footerContent').innerHTML=`<div class="footer-grid"><div class="footer-brand"><h2>${esc(site.shortName)}</h2><p>${esc(site.description)}</p></div><div class="footer-links"><h3>Portfolio</h3><a href="#/courses">Courses</a><a href="#/case-studies">Case Studies</a><a href="#/presentations">Presentations</a><a href="#/projects">Projects</a><a href="#/resources">Resources</a></div><div class="footer-links"><h3>Information</h3><a href="#/about">About</a><a href="#/contact">Contact</a>${site.links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} ${esc(site.copyright)}.</span><span>Static website designed for GitHub Pages.</span></div>`;
  }

  function parseRoute(){
    const raw=(location.hash||'#/').slice(1);const [path,query='']=raw.split('?');return {path:path||'/',params:new URLSearchParams(query)};
  }
  function route(){
    const {path,params}=parseRoute();activeNav(path);window.scrollTo(0,0);
    if(path==='/')homeView();else if(path==='/courses')coursesView(params);else if(path.startsWith('/course/'))courseDetailView(decodeURIComponent(path.split('/')[2]||''));else if(path.startsWith('/material/'))materialDetailView(decodeURIComponent(path.split('/')[2]||''));else if(path==='/case-studies')materialsView('case-studies');else if(path==='/presentations')materialsView('presentations');else if(path==='/projects')materialsView('projects');else if(path==='/resources')materialsView('resources');else if(path==='/about')aboutView();else if(path==='/contact')pageView('contact');else notFoundView();
    main.focus({preventScroll:true});
  }

  async function boot(){
    try{
      const [siteRes,indexRes,discRes]=await Promise.all([fetch('content/site.json'),fetch('content/index.json'),fetch('content/disciplines.json')]);
      if(!siteRes.ok||!indexRes.ok||!discRes.ok)throw new Error('Required content could not be loaded.');
      [site,index,disciplines]=await Promise.all([siteRes.json(),indexRes.json(),discRes.json()]);
      $('#brandMark').textContent=site.initials;$('#brandName').textContent=site.shortName;$('#brandRole').textContent=site.role;if(index.draftPreview){document.body.insertAdjacentHTML('afterbegin','<div class="draft-banner" role="status">Draft preview — this view includes unpublished material and must not be shared.</div>');}footer();route();
    }catch(error){main.innerHTML=`<section class="error-page"><div><h1>The portfolio could not load.</h1><p>${esc(error.message)}</p><p>Run the site through <code>npm start</code>; do not open index.html directly.</p></div></section>`;}
  }

  $('#themeButton').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('academic-portfolio-theme',next)}catch(e){}});
  $('#menuButton').addEventListener('click',()=>{const nav=$('#mobileNav');const open=nav.hasAttribute('hidden');nav.toggleAttribute('hidden',!open);$('#menuButton').setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open);});
  $('#mobileNav').addEventListener('click',e=>{if(e.target.matches('a')){$('#mobileNav').hidden=true;$('#menuButton').setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}});
  window.addEventListener('hashchange',route);boot();
})();

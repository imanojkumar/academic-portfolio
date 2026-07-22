# Manoj Kumar - Academic Course Portfolio

A zero-dependency static website for graduate and postgraduate courses in
Business Management and Engineering, designed for direct hosting on GitHub Pages.

## Sections

Home · Courses · Case Studies · Presentations · Projects · Teaching Resources ·
About · Contact

## Course catalogue

- Business Analytics
- Business Science
- AI for Business
- Agentic AI in Supply Chain
- AI for Manufacturing Engineering
- Data-Driven Decision Making
- Operations Analytics
- Digital Transformation for Managers

## Local preview

```bash
npm run build     # validate content and generate published artefacts
npm start         # preview published content at http://localhost:8080
```

To preview work in progress alongside published content:

```bash
npm run dev:drafts
```

Draft mode is selected by the command, never by a committed setting. The default
build and the CI build always exclude drafts, and the draft preview writes only
to the gitignored `_preview/` directory. Published files on disk are never
altered by it.

## Publishing an item

Content records carry `"status": "draft"` until reviewed. Set `"status":
"published"` and run `npm run build`. Generated artefacts are committed, because
the site is served from the repository root.

## Licences

- **Code** - MIT, see `LICENSE`
- **Published teaching content** - CC BY 4.0, see `LICENSE-CONTENT.md`

CC BY 4.0 applies only to original material. Third-party trademarks, images,
datasets and quoted material remain subject to their respective rights.

## Contributing

Editorial rules are in `docs/CONTENT_STYLE_GUIDE.md`.

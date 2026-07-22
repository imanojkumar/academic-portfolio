# Profile / About page - population guide

The About page is generated entirely from one file: `content/profile.json`.
You never edit HTML. You edit JSON, run the build, and the page updates.

**Important:** the sample values you saw in the mockup image are illustrative
only. This repository ships with neutral placeholder tokens like
`[Qualification]` and `[Institution]`, all marked `"status": "draft"`, so that
nothing invented about you is ever shown. You replace those tokens with your
real details and flip each record to `"status": "published"` when you are ready
for it to appear.

---

## How hiding works

The build produces a public artefact, `content/profile.built.json`, from your
source `content/profile.json`. During that step it removes anything that should
not be public. A record is hidden from the **published** site when any of the
following is true:

- it has `"status": "draft"`;
- it is a social link whose `url` is empty;
- it is missing a required field;
- its containing array is empty.

So the safe workflow is: leave a record as `draft` until it is complete and
correct, then change it to `published`.

You can preview everything - including drafts - locally without publishing:

```
npm run dev:drafts
```

That shows every record with a small "draft preview" banner, so you can see the
full layout before you publish. The live site never shows drafts.

After editing, always run:

```
npm run build
```

and commit the changed files.

---

## The status field

Every record that can be hidden supports a `status` field:

- `"status": "draft"` - visible only in `npm run dev:drafts`, never on the live site.
- `"status": "published"` - visible everywhere once its required fields are filled.

If you omit `status`, the record is treated as published. Keep `draft` on
anything you have not yet verified.

---

## Section-by-section

### 1. Hero (`hero`)

```json
"hero": {
  "name": "Manoj Kumar",
  "headline": "Professor of Practice | ...",
  "summary": "Two to three sentences.",
  "photo": "",
  "photoAlt": "Portrait of Manoj Kumar",
  "contact": { "location": "", "email": "", "phone": "", "officeHours": "" },
  "cvUrl": ""
}
```

- `name`, `headline`, `summary` are shown as provided. Confirm the headline is
  one you are comfortable using publicly.
- `photo`: leave empty to show your initials in a circle. To use a photograph,
  add the file at `assets/img/profile/manoj-kumar.jpg` and set
  `"photo": "assets/img/profile/manoj-kumar.jpg"`. If the file is missing the
  page falls back to initials automatically.
- `contact` fields: each row appears only when its value is non-empty. Empty
  ones are simply hidden on the live site (and shown as `[add …]` hints in draft
  preview).
- `cvUrl`: the **Download CV** button appears only when this is set. Point it at
  a file you add to the repository, e.g. `files/cv/manoj-kumar-cv.pdf`, or an
  external URL.

### 2. Social / profile links (`social`)

```json
{ "label": "ORCID", "icon": "orcid", "url": "", "status": "draft" }
```

- Supported `icon` values (each has a built-in inline SVG, no external library):
  `github`, `google-scholar`, `orcid`, `researchgate`, `linkedin`,
  `stackoverflow`, `blog`, `cv`.
- A link is shown on the live site **only when its `url` is non-empty**. To add
  ORCID, paste your ORCID URL and set `"status": "published"`.
- `github` and `google-scholar` ship already populated with your real URLs.
- Spelling note: the icon key is `orcid` (not "orchid").

### 3. Focus cards (`focus`)

Four cards: `professional`, `teaching`, `industry`, `expertise`. The first,
second and fourth take an `items` list. `industry` takes a `description` and an
optional `years`:

```json
"industry": { "title": "Industry experience", "icon": "briefcase",
              "description": "…", "years": "" }
```

Leave `years` empty to show no number. When you supply a value (e.g. `"20+ years"`)
it is appended to the description. No fabricated figure is ever shown.

### 4. Education (`education`)

```json
{ "status": "draft", "qualification": "[Qualification, e.g. Ph.D.]",
  "discipline": "[Discipline]", "institution": "[Institution]",
  "country": "[Country]", "year": "[Year]", "distinction": "" }
```

Required to publish: `qualification` and `institution`. Fill each record, remove
the square brackets, and set `"status": "published"`. Delete any records you do
not need; add more by copying the block.

### 5. Books (`books`)

```json
{ "status": "draft", "title": "[Book title]", "subtitle": "[Subtitle]",
  "publisher": "[Publisher]", "year": "[Year]", "isbn": "[ISBN]",
  "cover": "", "description": "…", "viewUrl": "", "detailsUrl": "" }
```

- Required to publish: `title`.
- `cover`: add an image at e.g. `assets/img/profile/book-1.jpg` and reference it
  here; otherwise a neutral book icon is shown.
- `viewUrl` / `detailsUrl`: each link appears only when its URL is set.

### 6. Software (`software`)

Three lists: `python`, `r`, `other`.

```json
"python": [ { "status": "draft", "name": "[package-name]",
  "description": "…", "version": "", "pypiUrl": "", "githubUrl": "",
  "docsUrl": "" } ]
```

- Required to publish: `name`.
- Only the links you fill (`pypiUrl`, `cranUrl`, `githubUrl`, `docsUrl`, `url`)
  are shown. R packages use `cranUrl` instead of `pypiUrl`.
- `other` is for web apps, analytics tools, educational utilities and general
  repositories; use its `url` and `githubUrl`.

### 7. Consulting, FDP and training (`consulting`)

```json
{ "status": "draft", "title": "…", "organisation": "…", "audience": "…",
  "location": "…", "year": "…", "duration": "…", "description": "…",
  "tags": ["Topic", "Topic"] }
```

Required to publish: `title`. All other fields are optional and hidden when empty.

### 8. Conferences, talks and recognition

Three separate arrays that render together in one card:

- `conferences`: `name` (required), `role`, `location`, `date`, `topic`, `url`.
- `talks`: `title` (required), `organisation`, `audience`, `year`, `topic`, `url`.
- `accolades`: `title` (required), `detail`, `year`.

### 9. Academic service and memberships

Two arrays rendered together:

- `service`: `category` (required), `detail`.
- `memberships`: `organisation` (required), `role`, `since`.

### 10. Statistics (`stats`)

```json
{ "status": "draft", "value": "[Number]", "label": "programmes delivered" }
```

These summary numbers are **hidden until you supply real values** and set them
to published. Do not publish a statistic you cannot support.

### 11. Research interests (`researchInterests`)

A simple list of strings, shown as tags. Edit freely.

### 12. Teaching interests (`teachingInterests`)

A list of strings, shown as tags. **Constrained** to the eight approved course
titles below - the build will fail if any other value is used:

- Business Analytics
- Business Science
- AI for Business
- Agentic AI in Supply Chain
- AI for Manufacturing Engineering
- Data-Driven Decision Making
- Operations Analytics
- Digital Transformation for Managers

---

## Editing checklist

1. Open `content/profile.json` (VS Code offers autocomplete from the schema).
2. Fill a record's fields; remove the `[bracketed]` tokens.
3. Change that record's `"status"` to `"published"`.
4. Run `npm run dev:drafts` to preview, then `npm run build`.
5. Commit `content/profile.json` and the regenerated
   `content/profile.built.json` and `about/index.html`.

## What the page will never do

- It will not invent degrees, institutions, employers, books, packages,
  conferences, awards, memberships, dates or counts. Anything you have not
  filled stays a hidden draft.
- It adds no external runtime dependency: all icons are inline SVG and all data
  is local JSON.

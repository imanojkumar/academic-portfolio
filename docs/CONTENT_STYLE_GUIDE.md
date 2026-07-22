# Content style guide

Binding on all content published in this portfolio. Established in Release 1
(Phase 0) under Revamp Plan v1.1 and Addendum A.

---

## 1. Register and voice

The portfolio is an academic teaching portfolio. It is not a marketing site.

**Write:** plain, precise academic English. State what a course does, who it is
for, and what a participant will be able to do afterwards.

**Do not write:** promotional claims, superlatives, testimonials, urgency,
calls-to-action, or any phrasing that would suit a product page. No
"transform your career", no "cutting-edge", no "industry-leading".

Prefer the specific to the impressive. "A twelve-week course assessed by three
components" is better than "a comprehensive learning journey".

---

## 2. Language

**British English.** This is settled and applies everywhere.

Common cases in this portfolio: analyse, analysing (not analyze); organisation,
organisational; programme (a course of study) but program (software);
prioritise, optimise, utilise; behaviour, labour; centre; licence (noun),
license (verb); modelling, modelled; enrol, enrolment.

Use the Oxford comma only where it removes ambiguity. Sentence case for
headings. No trailing full stop on headings or list items that are not
sentences.

---

## 3. Prohibited terminology

The following must not appear in visitor-facing content, published metadata,
generated pages, content schemas, CSS class names or UI component names. The
build fails if any is detected.

- `K1`-`K6`, or any equivalent outcome code series
- Bloom's taxonomy, by name or by structure
- Cognitive-level labels of any kind
- Taxonomy-based classification of learning outcomes
- Outcome-to-assessment mapping matrices
- Coverage grids, strength ratings, numeric weightings against outcomes, or
  colour scales applied to outcomes

This is a deliberate editorial decision. The portfolio presents learning
outcomes as plain statements, not as an accreditation apparatus.

---

## 4. How learning outcomes are presented

Three plain sections on each course page, in this order:

1. **Learning outcomes** - a simple list of plain sentences, each beginning with
   a verb. Five to seven is the working range.
2. **Assessment methods** - a simple list or two-column table of component and
   weight.
3. **How the assessments support the learning outcomes** - one short paragraph
   of ordinary prose, or a concise two-column table pairing an assessment with
   the outcomes it develops.

No codes. No levels. No matrix. No grid. No colour coding. No counts.

---

## 5. Placeholder language

No content that is publicly reachable may contain placeholder language. This
includes files reachable by direct URL even when they are not linked from the
site, because static hosting serves them regardless.

Prohibited, and detected by the build: "seed resource", "placeholder",
"replace before delivery", "lorem ipsum", "TODO", "TBD".

Incomplete work is marked `"status": "draft"` in its record. Drafts are excluded
from every published artefact. **Incomplete content may exist locally; it must
never appear publicly.**

---

## 6. Citation style

**APA 7th edition**, applied consistently across reading lists, references and
in-text citation.

Reference list entries carry complete bibliographic information: author, year,
title, source, and a DOI or stable URL where one exists. A reference that cannot
be completed is not published.

External URLs and identifiers are verified by a human at content approval. The
build validates internal links and local file references only; it does not
reach the network.

---

## 7. Rights and attribution

Original content is CC BY 4.0. That licence covers **only original material
owned by the author**.

Never relicense: company logos and trademarks, publisher figures, proprietary
datasets, third-party screenshots, externally authored exhibits, or substantial
copied passages.

Case studies may draw their facts from public sources. Every source must be
cited, and the narrative must be independently written. Reproducing source prose
is not acceptable, whether or not it is cited. Where an organisation is not
named, the detail should be composite and stated as illustrative.

Every content record carries `license` and `rightsNotes`.

---

## 8. Privacy

Never commit: student names, student work, grades, restricted assessment
instruments, model answers intended to remain unseen, unreleased examination
material, or any personal data.

Instructor notes and model answers are held outside the repository.

---

## 9. Structural conventions

**Headings.** One `h1` per document, matching the record title. Do not skip
levels.

**Tables.** Use for genuinely tabular information. A table with one column of
content is a list.

**Numbers.** Spell out one to nine in prose; use figures for 10 and above, and
for all measurements, percentages and weights.

**Durations.** Record `durationWeeks` as an integer for filtering, and
`durationLabel` for display.

**Dates.** ISO format `YYYY-MM-DD` in records. In prose, `21 July 2026`.

---

## 10. Review

Nothing publishes under the author's name without the author's explicit
approval. Approval is per item, not per batch. A record moves from `draft` to
`published` only as the recorded outcome of that approval.

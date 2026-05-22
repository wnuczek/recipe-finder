---
project: RecipeFinder
context_type: greenfield
created: 2026-05-19
updated: 2026-05-19
product_type: mobile
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: 2026-06-30
  after_hours_only: true
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: pain category
      decision: workflow friction + missing capability + data trapped somewhere
    - topic: core insight
      decision: standaryzacja i skalowanie przepisow to brakujaca warstwa wartosci
    - topic: primary persona scope
      decision: single named user - home cook
    - topic: access strategy
      decision: local profile for MVP
    - topic: role model
      decision: flat user model
    - topic: mvp timeline
      decision: 3 weeks
    - topic: socrates round
      decision: fr-002 demoted, fr-004 simplified, fr-006 constrained to supported units in v1
    - topic: business logic rule
      decision: ranking by ingredient match + proportional scaling from edited ingredient
    - topic: product framing
      decision: mobile app, small user scale, deadline 2026-06-30, after-hours
    - topic: non-goals
      decision: no barcode scanner and no multi-source scraping in MVP
  frs_drafted: 8
  quality_check_status: accepted
---

## Seed Idea

i want to create a app that will look for matching cooking recipes based on available ingredients given by user. I want the app to have recipe scaling function to adjust ingredients quantity based on any given ingredient quantity that user has available. As for frameworks i though of react native for frontend and hono.js for backend. MVP can use any working recipe sources, but then i want to standardize the interface and allow for scraping data from websites like kwestiasmaku.pl

## Vision & Problem Statement

Domowy kucharz-amator chce gotowac z tego, co ma pod reka lub na co ma ochote, ale obecnie musi recznie szukac pasujacych przepisow i recznie przeliczac ilosci skladnikow.

Koszt dzisiaj to strata czasu, wiekszy wysilek decyzyjny i ryzyko bledow proporcji podczas gotowania.

Insight: sama lista przepisow nie rozwiazuje problemu; wartosc daje warstwa standaryzacji danych przepisu i skalowania ilosci do realnie dostepnych skladnikow.

Scale note: przy skali 100x potrzebny bedzie skalowalny backend, ale nie zmienia to reguly domenowej MVP.

## User & Persona

Primary persona: domowy kucharz-amator gotujacy regularnie, ktory przed przygotowaniem posilku sprawdza, co ma dostepne i chce szybko znalezc przepis oraz dopasowac proporcje bez recznego liczenia.

## Access Control

Local profile na MVP. Dane profilu i preferencje sa trzymane lokalnie. Brak logowania kontem i brak separacji rol; model plaski (jeden typ uzytkownika).

## Success Criteria

### Primary

1. Uzytkownik dodaje skladniki, uruchamia wyszukiwanie i dostaje liste przepisow posortowana po dopasowaniu skladnikow.
2. Uzytkownik otwiera szczegoly przepisu i moze dynamicznie zmieniac ilosci skladnikow, a wszystkie proporcje przeliczaja sie automatycznie.

### Secondary

1. Dla wybranych zrodel dziala pobieranie przepisow i normalizacja danych przepisu do wspolnego formatu.

### Guardrails

1. Czas odpowiedzi i interakcji pozostaje szybki dla glownego flow.
2. Jakosc dopasowan przepisow nie moze byc przypadkowa; wyniki musza byc sensownie uporzadkowane.

## User Stories

### US-01: Find and scale recipe from available ingredients

- **Given** user selects ingredients from autocomplete dropdown
- **When** they press search with any number of ingredients
- **Then** app returns recipes sorted by number of matching ingredients (0-100% match allowed, not only exact matches)

#### Acceptance Criteria

- Search works for at least one selected ingredient
- Results are sorted by matching ingredient count
- User can open recipe details and adjust ingredient quantities with recalculation

## Functional Requirements

- FR-001: User can add ingredients from autocomplete/select. Priority: must-have
  > Socrates: Counter-argument considered: slownik skladnikow moze byc zbyt slaby i frustrujacy. Resolution: kept; autocomplete zostaje, ale tylko dla wspieranych skladnikow v1.
- FR-002: User can remove selected ingredients chips. Priority: nice-to-have
  > Socrates: Counter-argument considered: reset calej listy wystarczy na start. Resolution: demoted to nice-to-have for MVP.
- FR-003: User can search recipes by selected ingredients. Priority: must-have
  > Socrates: Counter-argument considered: jakosc danych recipe-source moze byc zbyt slaba. Resolution: kept; v1 opiera sie na jednym stabilnym zrodle i standardowym formacie.
- FR-004: User can view ranked recipe list by match score using simple matching-count ordering in MVP. Priority: must-have
  > Socrates: Counter-argument considered: regula rankingu wymaga walidacji. Resolution: scope narrowed to prosty count-match w MVP.
- FR-005: User can open recipe details. Priority: must-have
  > Socrates: Counter-argument considered: detale moga byc odlozone. Resolution: kept; detale sa niezbedne dla skalowania.
- FR-006: User can scale ingredient quantities from any edited ingredient input with full recalculation for supported units in MVP. Priority: must-have
  > Socrates: Counter-argument considered: bledy jednostek moga psuc zaufanie. Resolution: constrained to supported units in v1.
- FR-007: User can ingest recipes from new scraped sources. Priority: nice-to-have
  > Socrates: Counter-argument considered: jeden stabilny source wystarczy na start. Resolution: remains nice-to-have outside MVP.
- FR-008: User can use barcode scanner for ingredient entry. Priority: nice-to-have
  > Socrates: Counter-argument considered: dlugi ogon przypadkow i dodatkowe integracje mobilne. Resolution: remains nice-to-have outside MVP.

## Business Logic

Aplikacja priorytetyzuje przepisy na podstawie dopasowania do podanych skladnikow i przelicza wszystkie ilosci skladnikow proporcjonalnie do dowolnie zmienionego skladnika w wspieranych jednostkach.

Wejscie: lista skladnikow podanych przez uzytkownika oraz ilosci skladnikow przepisu.

Wyjscie: lista przepisow uporzadkowana po dopasowaniu oraz zaktualizowane proporcje skladnikow po zmianie dowolnej ilosci.

Moment kontaktu uzytkownika z regula: ekran wynikow wyszukiwania i ekran szczegolow przepisu z dynamicznym przeliczaniem.

## Non-Functional Requirements

- Search response time p95 <= 1.2s.
- Recipe details open time p95 <= 700ms.
- For queries with at least one ingredient and available catalog coverage, system returns at least 10 results.
- Top-5 ranking relevance >= 70% on a defined manual evaluation set.

## Non-Goals

- No barcode scanner in MVP. Rationale: not core to first end-to-end value and adds integration risk.
- No multi-source scraping in MVP. Rationale: one stable source is enough to validate product loop.

## Forward: tech-stack

- User preference captured: React Native for frontend.
- User preference captured: Hono.js for backend.

## Quality cross-check

- Access Control: present.
- Business Logic: present.
- Project artifacts: present.
- Timeline-cost acknowledgment: present (mvp_weeks <= 3).
- Non-Goals: present.
- Preserved behavior: n/a (greenfield).

## Open Questions

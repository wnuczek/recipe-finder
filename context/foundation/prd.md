---
project: RecipeFinder
version: 1
status: draft
created: 2026-05-20
context_type: greenfield
product_type: web
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: 2026-06-30
  after_hours_only: true
---

## Vision & Problem Statement

Domowy kucharz-amator chce gotowac z tego, co ma pod reka lub na co ma ochote, ale obecnie musi recznie szukac pasujacych przepisow i recznie przeliczac ilosci skladnikow.

Koszt dzisiaj to strata czasu, wiekszy wysilek decyzyjny i ryzyko bledow proporcji podczas gotowania. Sama lista przepisow nie rozwiazuje problemu; wartosc daje warstwa standaryzacji danych przepisu i skalowania ilosci do realnie dostepnych skladnikow.

## User & Persona

Primary persona: domowy kucharz-amator gotujacy regularnie, ktory przed przygotowaniem posilku sprawdza, co ma dostepne i chce szybko znalezc przepis oraz dopasowac proporcje bez recznego liczenia.

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

## Non-Functional Requirements

- Search response time p95 <= 1.2s.
- Recipe details open time p95 <= 700ms.
- For queries with at least one ingredient and available catalog coverage, system returns at least 10 results.
- Top-5 ranking relevance >= 70% on a defined manual evaluation set.

## Business Logic

Aplikacja priorytetyzuje przepisy na podstawie dopasowania do podanych skladnikow i przelicza wszystkie ilosci skladnikow proporcjonalnie do dowolnie zmienionego skladnika w wspieranych jednostkach.

Wejscie: lista skladnikow podanych przez uzytkownika oraz ilosci skladnikow przepisu.

Wyjscie: lista przepisow uporzadkowana po dopasowaniu oraz zaktualizowane proporcje skladnikow po zmianie dowolnej ilosci.

Moment kontaktu uzytkownika z regula: ekran wynikow wyszukiwania i ekran szczegolow przepisu z dynamicznym przeliczaniem.

## Access Control

Local profile na MVP. Dane profilu i preferencje sa trzymane lokalnie. Brak logowania kontem i brak separacji rol; model plaski (jeden typ uzytkownika).

## Delivery Decisions (2026-05-25)

- MVP deployment target: web-only on Cloudflare.
- Backend scope in MVP: conditional. Backend is introduced only if local-flow validation misses NFR guardrails.

## Non-Goals

- No barcode scanner in MVP. Rationale: not core to first end-to-end value and adds integration risk.
- No multi-source scraping in MVP. Rationale: one stable source is enough to validate product loop.
- No native app distribution hardening in MVP. Rationale: current MVP release path is web-only on Cloudflare.

## Open Questions

1. No open questions at this time.

# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three roles per company, weighted equally:
- **Administrador (dono):** small-business owner organizing team, service catalog, invites and the schedule. Mostly on a computer.
- **Executor (funcionário):** dog walker, cleaner, technician, nanny, teacher. Starts the job and fills the end-of-service report quickly, usually on a phone in the field.
- **Cliente:** follows their own history and reads reports; registers their own pets/children/properties. Usually on a phone.

Usage is balanced between desktop (admin) and mobile (executor, client).

## Product Purpose

easyService is a management app for small pet-care businesses (dog walkers, pet sitters), installable on the phone as a PWA. It speaks the trade language (passeio, passeador, pet). Success: the owner schedules work, the worker executes and reports without friction, and the client sees what was done.

## Positioning

One product that becomes trade-specific: the same scheduling + checklist-report flow speaks "passeio / passeador" for a pet business and "chamado / técnico" for a repair business, with ready-made services and briefings for whoever receives the care (pet, child, property, place).

## Operating Context

- Flow: invite team and clients → build catalog (with report checklist fields) → schedule an ordem de serviço → executor reads the briefing, starts, fills the report → client reads the report.
- Status flow `AGENDADO → EXECUTANDO → FINALIZADO`, plus `CANCELADO`.
- One person can belong to several companies with a different role in each.
- Full functional detail lives in CONTEXTO.md.

## Capabilities and Constraints

- Stack: React 19 + Vite + TypeScript + Tailwind CSS 4 + React Router 7 + TanStack Query + lucide-react.
- Trade config (vocabulary, per-trade accent, icon, assistido fields) in `apps/web/src/lib/segmentos.ts`.
- Photos are typed URLs for now (no upload). No payments, no calendar view, no notifications yet.
- UI language: Brazilian Portuguese.

## Brand Commitments

Name is "easyService" (formerly "Universal"); the user allowed redefining the visual identity freely, including the per-trade colors.

## Evidence on Hand

No logos, photography, testimonials or customer data. Do not fabricate any.

## Product Principles

1. Every role finishes its main task in few, obvious steps.
2. The interface speaks the trade's language, not generic software language.
3. Field use is first-class: the executor's flow must work one-handed on a phone.
4. Clarity over decoration: status, time and who-is-responsible are always legible.

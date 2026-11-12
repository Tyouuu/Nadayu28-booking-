# Nadayu28 Smart Community System

A final-year project for a real condominium I live in (Nadayu28). The guardhouse
registers every visitor by hand on paper, and visitor parking is often full
with no way to tell who it belongs to — so this is a visitor registration,
visitor parking and facility booking system for three roles: resident,
security and management.

**Status:** in development — the service layer (reservations, notifications,
security verification) and the Supabase schema are built; integration into a
polished UI is still in progress. Not deployed; sample/seed data only, no real
resident data.

## What it does

- **Residents** book facilities (pool, function hall, etc.) with real-time
  conflict detection, suggested free time slots, and can share booking
  permission with family members.
- **Visitors** are pre-registered by the resident and get a QR code; security
  scans it on arrival to see who they're visiting, expected time, and the
  licence plate on file — no more writing it down by hand. Arrivals far outside
  the expected window are flagged automatically.
- **Management** gets a violations log, maintenance reports with photos, and
  community announcements/notifications across 8 categories, each with its own
  per-user subscription and quiet hours.
- Billing, documents and an audit trail are modelled in the database
  (`supabase_billing.sql`, `supabase_documents.sql`, `supabase_audit_trail.sql`).

## Built with

Next.js · TypeScript · Supabase (Postgres, RLS) · Vercel

## Why I built it

I chose this over a generic assignment topic because it's a problem I see at
my own building every week — I wanted to see whether software could actually
fix it, not just simulate it.

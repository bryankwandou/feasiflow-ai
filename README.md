# ClinicFlow AI

Clinical Practice Management Platform with 12 AI Agents

## Setup

1. `npm install`
2. `cp .env.example .env` and add your Anthropic API key
3. `npm run dev`

## Deploy

- Build: `npm run build`
- Deploy `dist/` to Vercel with the included `vercel.json`

## Features

- 12 Zustand stores with full CRUD + persist
- 10 seeded patients with complete medical records
- SOAP Note Editor with AI generation (Anthropic Claude)
- Lab Results with critical value alerts
- Prescription Manager with drug interaction framework
- Billing & Revenue Cycle with AR aging charts
- Referrals with AI letter generation
- 12 Clinical AI Agents with test interface

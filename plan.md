# plan.md — ConstructONS Premium CMS-Driven Website (Updated)

## 1) Objectives
- Ship a premium, Apple/Tesla/Stripe/Linear-level marketing + sales platform for **ConstructONS** with luxury UI, **Poppins** typography, and **Framer Motion** micro-interactions.
- Maintain a **fully CMS-driven architecture**: all public pages/sections + detail pages consume **FastAPI + MongoDB** APIs (no hardcoded content).
- Provide a **production-grade Admin Panel** (cookie-based auth) for CRUD on all content types and advanced sales workflows.
- Deliver **lead capture** (Get Free Consultation / Contact) persisted to MongoDB with admin visibility + status workflow.
- Provide a complete **sales enablement ecosystem**:
  - Standardized build packages with deep material specs
  - Package comparison
  - Brochure PDFs
  - Client proposal PDFs + WhatsApp workflow
  - **Custom Quotes**: AI-assisted, fully editable, PDF-exportable bespoke quotations
  - **Quote Templates**: reusable quote baselines to speed up sales
  - **Client Quote Viewer**: shareable public quote link for accept/reject + comments
  - **CSV Export**: one-click exports for leads and quiz submissions
  - **Interior Library**: curated interior items with brand pricing to drop into quotes
  - **Drawing Sheets**: floor plans/elevations with CAD title blocks + revision history
  - **Live PDF Preview**: real-time branded PDF rendering inside the quote editor

### NEW (Major Objective) — Client Portal (Milestones + Future AI)
Build a customer-facing portal that spans the full construction lifecycle:
- Customers can log in via **Client Login** and track a **10-stage milestone-based project timeline** from Discovery → Handover.
- Admin can manage projects and stage updates inside the Admin Panel; customers see updates instantly in the portal.
- (Upcoming) Add an **AI Chat Assistant** inside the portal to help customers explore packages, generate quotes, and request updates.

**Current status:** Phases 1–4.8 are complete and stable in preview. **Milestone Tracker (admin + customer) is COMPLETE and tested end-to-end.** Next major work is Phase 5.4: **Customer AI Chat Assistant**.

---

## 2) Implementation Steps

### Phase 1 — Core CMS Data Flow ✅ COMPLETED
**Goal:** Prove end-to-end dynamic rendering for the most business-critical flow.

User stories ✅
1. Visitor loads homepage and sees hero + home cards from DB.
2. Visitor opens a Home Collection detail page and sees full specs + gallery.
3. Visitor submits “Get Free Consultation” and lead is saved.
4. Admin logs in and edits home price/specs; site reflects updates.
5. Admin updates home gallery; detail page updates.

Backend ✅
- MongoDB connection + serialization utilities.
- Core schemas + endpoints for `homes`, `hero_sections`, `site_settings`, `media`, `leads`.
- Seed pipeline established.

Frontend ✅
- Tailwind theme tokens (brand orange/navy, premium shadows/radii) + Poppins.
- API client established.
- Homepage wired to API + lead modal.
- Animation primitives via Framer Motion.

Checkpoint ✅
- Verified end-to-end: seed → API → render → lead saved → admin edit reflects.

---

### Phase 2 — V1 Website + Admin Panel ✅ COMPLETED
**Goal:** Implement all required sections CMS-driven + admin CRUD.

User stories ✅
1. Visitor browses Build Packages and explores rich specs.
2. Visitor explores Marketplace + Financial Services.
3. Visitor reads FAQs + Blogs from CMS.
4. Admin manages packages/pricing/specs and updates reflect on site.
5. Admin manages all key marketing content without code changes.

Backend ✅
- Implemented CRUD APIs for **15+ CMS content types**.
- Aggregate endpoint `GET /api/bootstrap`.
- Auto-seeding on startup.
- Leads workflow.

Frontend (Public) ✅
- Premium homepage sections + detailed Home pages.
- Packages route + package detail.
- Lead modal wired to `/api/leads`.

Frontend (Admin) ✅
- Admin login + dashboard.
- Leads inbox.
- Generic CRUD drawer editor.

Testing ✅
- End-to-end verified via `testing_agent_v3` + iterative fixes.

---

### Phase 2.5 — Major Enhancements & Production Hardening ✅ COMPLETED
**Goal:** Upgrade from MVP to a premium construction operating system feel.

Delivered ✅
- **Auth security**: migrated from localStorage JWT to **httpOnly secure cookies**, admin credentials stored in MongoDB with **bcrypt**.
- **Deep Package Editor**: full control over spec categories, scope, exclusions, addons, headings.
- **AI Copy Assist** (GPT-5 via Emergent LLM): rewrite taglines/descriptions safely.
- **Image Upload Studio**: Emergent Object Storage integration.
- **PDF Systems**:
  - Public package brochure generator
  - Personalized client proposal generator (7-page) with WhatsApp sharing
- Realtime admin notifications integrated.
- Security: DOMPurify added to reduce XSS risk.

Bug fixes ✅
- **Packages Comparison page blank** fixed and visually verified.

---

### Phase 3 — Sales Workflows: Custom Quotes ✅ COMPLETED
**Goal:** Add an Admin section **Custom Quotes** for bespoke quotations, AI-assisted drafting, and share-ready PDF.

Delivered ✅
- Admin page **/admin/custom-quotes** with:
  - client details + requirements
  - base package snapshot loading
  - deeply editable specs + add-ons + custom line items + pricing + terms
  - actions: save, download PDF, WhatsApp share, copy public link, status updates
- **AI Quote Assistant**:
  - job_id + polling
  - package anchored + from-scratch modes
- PDF generator + CRUD + PDF routes.

Verification ✅
- Quote CRUD works with sequential refs `CQ-YYYY-0001`
- AI job completes successfully
- PDF endpoint returns valid PDF bytes

---

### Phase 4 — Sales Operations Upgrade ✅ COMPLETED
**Goal:** Finish the sales operating system layer.

#### 4.1 Rich Text Editor (TipTap) ✅
- TipTap WYSIWYG installed and reusable `RichTextEditor` added.
- Wired into blogs + custom quotes.

#### 4.2 CSV Export ✅
- Admin-protected exports for leads + quiz submissions.

#### 4.3 Quote Templates ✅
- QuoteTemplates collection + CRUD.
- Admin page `/admin/quote-templates`.

#### 4.4 Client Quote Viewer Link ✅
- Tokenized public route `/quote/:token` with accept/reject + comments.

#### 4.5 Quote Enhancements (Service Charge, Interiors, Drawings, Visual Boards) ✅
- Service charge default.
- Interiors category editor.
- Floor plans/elevations with CAD title blocks.
- Visual boards with uploads + AI image generation.

#### 4.6 AI Image Generation ✅
- `/api/ai/generate-image`.

#### 4.7 Live PDF Preview ✅
- `POST /api/custom-quotes/preview`.

#### 4.8 Interior Library + Drawing Revisions ✅
- Interior library seeded.
- Drawing revisions tracked and rendered in PDF.

---

### Phase 5 — Client Portal (Milestones Complete) + Future AI Chat

#### 5.1 Customer Auth + Portal Shell ✅ COMPLETED
Backend ✅
- Customer session + `/api/customer/me` + logout.
- Google OAuth session exchange wired into portal entry.

Frontend ✅
- `/portal/login` implemented.
- `/portal` route created.

> Note: Production Google OAuth requires correct environment variables and domain cookie settings.

#### 5.2 Project Milestone Tracker (Admin + Customer) ✅ COMPLETED (P0 Delivered)
**Goal:** Deliver the exact requested feature: Admin controls projects; customers see a 10-stage tracker from Discovery → Handover.

Backend ✅
- Added `/app/backend/project_routes.py` and included it in FastAPI app.
- MongoDB collection: `projects`.
- Endpoints:
  - Customer: `GET /api/portal/my-project`
  - Admin:
    - `GET /api/admin/projects`
    - `POST /api/admin/projects` (seeds 10 stages)
    - `PUT /api/admin/projects/{project_id}`
    - `PATCH /api/admin/projects/{project_id}/stages/{index}` (auto-timestamps on status transitions)
    - `DELETE /api/admin/projects/{project_id}`

Frontend ✅
- Admin:
  - `/admin/projects` wired in `App.js`.
  - Sidebar link added in `AdminLayout.js` as **Customer Projects**.
  - AdminProjects cockpit:
    - list projects + progress bar
    - create new project modal
    - manage stages modal (status/date/progress/notes + photo uploads)
- Customer Portal:
  - `PortalHome.js` renders the 10-stage tracker with expandable stage cards.

Public Site ✅
- Added **Client Login** button to Header (desktop + mobile) linking to `/portal/login`.

Demo Seed ✅
- Demo project created for `dkmanjeshbelli@gmail.com`:
  - Title: **Belli Residence — G+1 Modern Home**
  - Stages: 10 seeded
  - Status: 3 stages completed
  - Booking stage: in-progress at 55%

Testing ✅
- `testing_agent_v3` verified:
  - **Backend: 52/52 tests passed**
  - All frontend flows render and function:
    - admin projects list + stages editor
    - portal milestone timeline
    - client login entry point visible

#### 5.3 Customer AI Chat Assistant 🚧 NEXT (Deferred earlier; now the main remaining portal feature)
**Goal:** ChatGPT/Claude-like assistant inside portal to guide package selection, quote generation, and project Q&A.

Backend (Planned)
- `POST /api/chat/message` with streaming (SSE).
- Store conversations/messages in MongoDB.
- Tool calls:
  - list packages
  - recommend package
  - create custom quote draft + return public link
  - generate images (reuse existing)

Frontend (Planned)
- Chat UI with streaming tokens + rich message renderer.
- Optional file upload.

#### 5.4 Notifications (Email/WhatsApp) for Milestone Updates ⏳ UPCOMING (P1)
**Goal:** Auto-notify customers when stages are updated.
- SMTP email notifications per stage update.
- (Optional) WhatsApp notifications.

---

## 3) Next Actions

### Immediate (Portal AI is next)
1. Implement portal AI chat backend (SSE + conversation storage).
2. Build portal chat UI and integrate with existing quote generation + public link.

### Production Readiness Notes (User Action)
- Ensure production env vars are set (e.g., `EMERGENT_LLM_KEY`, Google OAuth keys, admin emails, etc.). Preview works; production failures are commonly missing env configuration.

---

## 4) Success Criteria
- Existing phases remain stable (no regressions).
- Sales stack remains stable:
  - custom quotes, templates, public quote links, exports, preview, interior library, drawings
- Portal delivers (✅ now met for milestones):
  - customer can log in and view a **10-stage milestone tracker**
  - admin can create/manage projects and update stages
  - client entry point exists on main site as **Client Login**
- Next success criteria (upcoming):
  - portal AI chat streams reliably
  - chat can recommend packages and create a draft custom quote + share link
  - optional milestone update notifications

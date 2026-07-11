const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, PageBreak, TableOfContents,
  SectionType, TabStopType, TabStopPosition, LevelFormat,
} = require("docx");
const fs = require("fs");

// ── Palette: DS-1 Deep Sea (tech project) ──
const P = {
  bg: "0B1C2C", primary: "FFFFFF", accent: "529286",
  titleColor: "FFFFFF", subtitleColor: "B0B8C0",
  metaColor: "90989F", footerColor: "687078",
  body: "1C2A3D", secondary: "5B6B7D",
  tableHeaderBg: "529286", tableHeaderText: "FFFFFF",
  tableAccentLine: "529286", tableInnerLine: "BECFCC", tableSurface: "E8ECEB",
};
const c = (hex) => hex.replace("#", "");

// ── Borders ──
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── Helpers ──
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimHei" } })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimHei" } })] });
}
function h3(text) {
  return new Paragraph({ spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })] });
}
function p(text) {
  return new Paragraph({ spacing: { line: 312, after: 120 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] });
}
function pBold(text) {
  return new Paragraph({ spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimHei" } })] });
}
function bullet(text) {
  return new Paragraph({ spacing: { line: 312, after: 60 }, indent: { left: 480, hanging: 240 },
    children: [new TextRun({ text: "\u2022 " + text, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] });
}
function code(text) {
  return new Paragraph({ spacing: { line: 280, after: 40 },
    indent: { left: 360 },
    children: [new TextRun({ text, size: 20, color: "D4762C", font: { ascii: "Consolas" } })] });
}

function makeRow(cells, isHeader = false) {
  return new TableRow({
    tableHeader: isHeader,
    cantSplit: true,
    children: cells.map(text => new TableCell({
      shading: isHeader ? { type: ShadingType.CLEAR, fill: c(P.tableHeaderBg) } : undefined,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: c(P.tableInnerLine) },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: c(P.tableInnerLine) },
        left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({
        children: [new TextRun({ text, size: 20, color: isHeader ? c(P.tableHeaderText) : c(P.body),
          bold: isHeader, font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })]
      })]
    }))
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(P.tableAccentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.tableAccentLine) },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(P.tableInnerLine) },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [makeRow(headers, true), ...rows.map(r => makeRow(r))],
  });
}

// ── Cover (R1: Pure Paragraph Left, DS-1 palette) ──
function buildCover() {
  const padL = 1200, padR = 800;
  const title = "Zaitun \u2014 Developer Documentation";
  const titleSize = 36 * 2; // 36pt
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: c(P.accent), space: 12 };
  const children = [
    new Paragraph({ spacing: { before: 5000 } }),
    new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(P.accent), space: 8 } },
      children: [new TextRun({ text: "F A M I L Y   T R E E   P L A T F O R M", size: 20, color: c(P.accent), font: { ascii: "Calibri" }, characterSpacing: 40 })],
    }),
    new Paragraph({
      indent: { left: padL },
      spacing: { after: 100, line: Math.ceil(36 * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: "Zaitun", size: titleSize, bold: true, color: c(P.titleColor), font: { ascii: "Calibri" } })],
    }),
    new Paragraph({
      indent: { left: padL },
      spacing: { after: 300 },
      children: [new TextRun({ text: "Developer Documentation", size: 28, color: c(P.subtitleColor), font: { ascii: "Calibri" } })],
    }),
    new Paragraph({
      indent: { left: padL }, spacing: { after: 80 },
      children: [new TextRun({ text: "Complete Technical Specification & Architecture Guide", size: 22, color: c(P.metaColor), font: { ascii: "Calibri" } })],
    }),
    new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: "Version 1.0  |  July 2026", size: 22, color: c(P.metaColor), font: { ascii: "Calibri" } })],
    }),
    new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: "Next.js 16 + Prisma + SQLite + Zustand", size: 22, color: c(P.metaColor), font: { ascii: "Calibri" } })],
    }),
    new Paragraph({ spacing: { before: 4000 } }),
    new Paragraph({
      indent: { left: padL, right: padR },
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: c(P.accent), space: 8 } },
      spacing: { before: 200 },
      children: [new TextRun({ text: "Zaitun Project", size: 18, color: c(P.footerColor), font: { ascii: "Calibri" } }),
        new TextRun({ text: "                                        Confidential", size: 18, color: c(P.footerColor), font: { ascii: "Calibri" } })],
    }),
  ];
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: { type: "fixed" },
    borders: allNoBorders,
    rows: [new TableRow({ height: { value: 16838, rule: "exact" }, children: [
      new TableCell({ shading: { type: ShadingType.CLEAR, fill: c(P.bg) }, borders: noBorders, children })] })],
  })];
}

// ── Body Content ──
const body = [
  // 1. Overview
  h1("1. Project Overview"),
  p("Zaitun is a Bengali family tree and diary platform that enables families to build living family trees, preserve life stories through diary entries, and maintain biographical timelines for family members. The platform is designed as a single-page application (SPA) using Zustand-based view routing, where the entire user interface is rendered on a single Next.js page with client-side view transitions powered by Framer Motion."),
  p("The platform supports three tiers of content privacy: private entries visible only to the author, family entries shared among tree members, and public entries accessible to anyone. Users can create family trees, add members with relationship mapping, write diary entries on behalf of family members, claim profiles to link their accounts to person nodes, and review profile claims submitted by other members. An admin panel provides oversight capabilities for managing users, trees, and diary content across the platform."),

  h2("1.1 Key Features"),
  bullet("Multi-family tree management with invite-code-based joining system"),
  bullet("Interactive family tree canvas with relationship visualization (father, mother, spouse, children, siblings, grandparents, etc.)"),
  bullet("Diary/journal system with timeline and calendar views, supporting private, family, and public privacy levels"),
  bullet("Full-screen diary reading dialog with adjustable font size (A/A+/A++), author info, tags, and word count"),
  bullet("Person timeline view aggregating birth/death dates, occupation, and diary entries into a chronological biography"),
  bullet("Profile claiming system with evidence submission, witness support, and approval/rejection workflow"),
  bullet("Bilingual support (English and Bengali) with comprehensive i18n coverage"),
  bullet("Admin panel with user management, tree oversight, and diary moderation"),
  bullet("JWT-based authentication with 30-day session cookies"),
  bullet("SPA routing via Zustand store \u2014 no Next.js file-based router used for views"),

  // 2. Tech Stack
  h1("2. Technology Stack"),
  makeTable(
    ["Layer", "Technology", "Purpose"],
    [
      ["Framework", "Next.js 16.1 (App Router)", "React framework with SSR, API routes, static generation"],
      ["Language", "TypeScript 5.x", "Type-safe development across frontend and backend"],
      ["Styling", "Tailwind CSS 4", "Utility-first CSS framework for responsive design"],
      ["UI Library", "shadcn/ui (Radix primitives)", "Accessible, composable component library"],
      ["Animation", "Framer Motion 12", "View transitions, card animations, page transitions"],
      ["State", "Zustand 5", "Lightweight global state with SPA view routing"],
      ["Database", "SQLite via Prisma ORM 6", "Embedded relational database with type-safe queries"],
      ["Auth", "jose (JWT) + bcryptjs", "Stateless authentication with hashed passwords"],
      ["Icons", "Lucide React", "Consistent icon set across the application"],
      ["Notifications", "Sonner", "Toast notifications for user feedback"],
      ["Date", "date-fns", "Date formatting and manipulation utilities"],
    ]
  ),

  // 3. Architecture
  h1("3. Architecture & Design Decisions"),

  h2("3.1 SPA Routing with Zustand"),
  p("Instead of using Next.js file-based routing, the application implements a single-page architecture where all views are rendered on the root page (src/app/page.tsx). A Zustand store manages the current view state, and AnimatePresence from Framer Motion handles smooth transitions between views. This design was chosen to maintain UI state consistency across views without page reloads."),
  p("The View union type defines all available views:"),
  code('type View = "hero" | "trees" | "tree-detail" | "diary" | "join" | "admin" | "person-timeline";'),
  p("Each view is a separate React component conditionally rendered inside AnimatePresence. The store provides setView() to navigate between views, and each component can access shared state (user, trees, persons, diary entries) directly from the store without prop drilling."),

  h2("3.2 Dialog-Based UI Pattern"),
  p("Modal interactions (auth, diary editor, person form, profile claims, diary reading) are implemented as dialog overlays using shadcn/ui Dialog components. These dialogs are rendered outside the AnimatePresence block in page.tsx to avoid nesting animation issues. Their visibility is controlled by boolean flags in the Zustand store (e.g., showAuthDialog, showReadingDialog, editingDiaryEntry)."),

  h2("3.3 Bilingual System (i18n)"),
  p("A lightweight custom i18n system is implemented in src/lib/i18n/ with dictionary files for English (en.ts) and Bengali (bn.ts). A t(locale, keypath) function retrieves translated strings using dot-notation paths (e.g., t(locale, \"home.readFull\")). The locale state is stored in Zustand and can be toggled via a language switcher in the navigation bar. Bengali number conversion is handled inline where needed (e.g., date displays, word counts)."),

  h2("3.4 Authentication Flow"),
  p("Authentication uses JWT tokens stored in HTTP-only cookies. The auth module (src/lib/auth.ts) provides createSession(), verifySession(), getSessionUser(), and requireAuth() functions. Session tokens are signed with HS256 algorithm and expire after 30 days. Protected API routes use requireAuth() which throws an AuthError if no valid session exists, returning a 401 response. Public routes like /api/diaries/public work without authentication and return public-only content for unauthenticated users."),

  // 4. Database Schema
  h1("4. Database Schema (Prisma)"),
  p("The database uses SQLite for zero-configuration deployment. The Prisma schema defines 7 models with cascading deletes to maintain data integrity when trees are removed."),

  makeTable(
    ["Model", "Description", "Key Fields"],
    [
      ["User", "Registered user accounts", "id, email, name, password, role (admin/member), locale, bio, gender, birthDate"],
      ["FamilyTree", "Top-level family tree container", "id, name, description, isPrivate, inviteCode (unique), createdBy"],
      ["FamilyTreeMember", "Maps users to trees with roles", "treeId, userId, role (owner/member), @@unique([treeId, userId])"],
      ["Person", "Individual in a family tree", "id, treeId, firstName, lastName, gender, birthDate, deathDate, bio, occupation, isDeceased, userId (claim link), contributedBy, sortOrder"],
      ["Relationship", "Directed edges between persons", "id, treeId, person1Id, person2Id, type (father/mother/spouse/son/etc.), @@unique([person1Id, person2Id, type])"],
      ["DiaryEntry", "Journal entries linked to persons", "id, treeId, personId, date, title, content, privacy (private/family/public), tags (comma-separated)"],
      ["ProfileClaim", "Requests to link user to person", "id, personId, treeId, claimantId, relationship, evidence, status (pending/approved/rejected), reviewerId"],
      ["ProfileClaimWitness", "Witnesses supporting a claim", "id, claimId, userId, @@unique([claimId, userId])"],
    ]
  ),

  h2("4.1 Key Relationships"),
  p("A User can create multiple FamilyTrees (via createdBy) and belong to multiple trees (via FamilyTreeMember). Each FamilyTree contains multiple Person nodes connected by Relationship edges. DiaryEntry records are linked to a Person within a tree. When a user claims a Person profile, the Person.userId field is set, creating a bidirectional link between the User and Person models. ProfileClaim records track the claiming process with optional witnesses for verification."),

  // 5. API Routes
  h1("5. API Routes"),
  p("All API routes follow Next.js App Router conventions and return JSON responses. Authentication-protected routes use requireAuth() from src/lib/auth.ts."),

  h2("5.1 Authentication"),
  makeTable(
    ["Endpoint", "Method", "Auth", "Description"],
    [
      ["/api/auth/signup", "POST", "No", "Register new user with name, email, password. Hashes password with bcryptjs."],
      ["/api/auth/login", "POST", "No", "Validate credentials, create JWT session, set cookie."],
      ["/api/auth/logout", "POST", "No", "Clear session cookie."],
      ["/api/auth/session", "GET", "No", "Return current user data from JWT cookie, or null."],
    ]
  ),

  h2("5.2 Family Trees"),
  makeTable(
    ["Endpoint", "Method", "Auth", "Description"],
    [
      ["/api/trees", "POST", "Yes", "Create tree with auto-generated invite code (ZAITUN-XXXX-XXXX). Auto-creates Person node for creator."],
      ["/api/trees", "GET", "Yes", "List all trees the user is a member of, including persons and members."],
      ["/api/trees", "DELETE", "Yes", "Delete tree and all associated data (cascade)."],
      ["/api/trees/join", "POST", "Yes", "Join a tree using invite code. Adds user as member."],
    ]
  ),

  h2("5.3 Persons & Relationships"),
  makeTable(
    ["Endpoint", "Method", "Auth", "Description"],
    [
      ["/api/persons", "GET", "Yes", "Get all persons and relationships for a treeId. Used by TreeCanvas."],
      ["/api/persons", "POST", "Yes", "Create person with optional relationship. Auto-creates reverse relationship (e.g., father->child creates child->parent)."],
      ["/api/persons", "PUT", "Yes", "Update person. Denies if person is linked to another user account."],
      ["/api/persons", "DELETE", "Yes", "Delete person and all associated relationships."],
    ]
  ),

  h2("5.4 Diary Entries"),
  makeTable(
    ["Endpoint", "Method", "Auth", "Description"],
    [
      ["/api/diaries", "GET", "Yes", "Fetch diary entries for a tree. Optional personId filter."],
      ["/api/diaries", "POST", "Yes", "Create new diary entry linked to a person in a tree."],
      ["/api/diaries", "PUT", "Yes", "Update existing diary entry (author only)."],
      ["/api/diaries", "DELETE", "Yes", "Delete diary entry by id query param."],
      ["/api/diaries/public", "GET", "No", "Public feed with pagination, search, and filter (all/public/family). Family filter requires auth."],
      ["/api/diaries/[id]", "GET", "No", "Get single diary entry with privacy checks. Returns full person bio."],
    ]
  ),

  h2("5.5 Profile Claims"),
  makeTable(
    ["Endpoint", "Method", "Auth", "Description"],
    [
      ["/api/claims", "GET", "Yes", "List pending claims for a tree with claimant, person, witnesses, reviewer data."],
      ["/api/claims", "POST", "Yes", "Submit claim to link account to an unlinked person. Supports witness IDs."],
      ["/api/claims", "PUT", "Yes", "Approve or reject claim. Only tree owner or person contributor can review. On approve, sets person.userId."],
    ]
  ),

  h2("5.6 Admin"),
  makeTable(
    ["Endpoint", "Method", "Auth", "Description"],
    [
      ["/api/admin/stats", "GET", "Admin", "Platform-wide statistics: total users, trees, persons, diaries, recent signups."],
      ["/api/admin/users", "GET", "Admin", "List all users with search, pagination. Supports role changes and deletion."],
      ["/api/admin/trees", "GET", "Admin", "List all trees with creator info, member count, person count, entry count."],
      ["/api/admin/diaries", "GET", "Admin", "List all diary entries with pagination. Supports deletion."],
    ]
  ),

  // 6. Components
  h1("6. Frontend Components"),
  p("All application components are located in src/components/zaitun/ and use the \"use client\" directive for client-side interactivity."),

  makeTable(
    ["Component", "File", "Description"],
    [
      ["HeroSection", "HeroSection.tsx", "Homepage with diary feed, filters (all/public/family), search, and pagination. Cards are clickable to open reading dialog."],
      ["TreesSection", "TreesSection.tsx", "Lists user's family trees with create/join options. Entry point to tree management."],
      ["TreeDetailSection", "TreeDetailSection.tsx", "Tree dashboard showing members, invite code, and navigation to diary/tree canvas."],
      ["TreeCanvas", "TreeCanvas.tsx", "Interactive family tree visualization. Renders persons as nodes with relationship lines using SVG/canvas."],
      ["DiarySection", "DiarySection.tsx", "Full diary management with timeline and calendar views, person filter, create/edit/delete entries. Cards open reading dialog on click."],
      ["DiaryEditorDialog", "DiaryEditorDialog.tsx", "Dialog for creating/editing diary entries. Supports person selection, date picker, privacy level, tags."],
      ["DiaryReadingDialog", "DiaryReadingDialog.tsx", "Full-screen dialog for reading diary entries. Features font size controls (A/A+/A++), author card, metadata, tags, word count, and author bio section."],
      ["PersonTimeline", "PersonTimeline.tsx", "Chronological timeline of a person's life events: birth, death, occupation, and diary entries."],
      ["PersonFormDialog", "PersonFormDialog.tsx", "Dialog for adding/editing family members with relationship selection and all personal details."],
      ["AuthDialog", "AuthDialog.tsx", "Login/signup dialog with email/password fields, session management, and UserMenu dropdown."],
      ["JoinSection", "JoinSection.tsx", "Invite code entry page for joining existing family trees."],
      ["ProfileClaimDialog", "ProfileClaimDialog.tsx", "Dialog for submitting profile claims with relationship, evidence, and witness selection."],
      ["ClaimsPanel", "ClaimsPanel.tsx", "Panel for reviewing pending profile claims with approve/reject actions."],
      ["AdminSection", "AdminSection.tsx", "Admin dashboard with tabs for users, trees, and diaries. Full CRUD management."],
    ]
  ),

  // 7. State Management
  h1("7. State Management (Zustand Store)"),
  p("The Zustand store (src/store/zaitun.ts) is the single source of truth for all application state. It manages view routing, authentication state, tree data, person data, diary entries, dialog visibility, claim data, and timeline data. All components access state directly via the useZaitunStore hook."),

  h2("7.1 Key State Slices"),
  makeTable(
    ["Slice", "State Fields", "Actions"],
    [
      ["View", "view: View", "setView(v)"],
      ["Locale", "locale: 'en' | 'bn'", "setLocale(l)"],
      ["Trees", "trees: FamilyTreeData[]", "setTrees(t)"],
      ["Active Tree", "activeTreeId: string | null", "setActiveTreeId(id)"],
      ["Persons", "persons: Person[], relationships: Relationship[]", "setTreeData(p, r), addPersonLocally, updatePersonLocally, removePersonLocally"],
      ["Diary", "diaryEntries: DiaryEntry[], editingDiaryEntry, diaryFilterPersonId", "setDiaryEntries, addDiaryEntryLocally, updateDiaryEntryLocally, removeDiaryEntryLocally, setEditingDiaryEntry"],
      ["Auth", "user: AuthUser | null, showAuthDialog, authMode", "setUser, setShowAuthDialog, setAuthMode"],
      ["Claims", "showClaimDialog, claimTargetPerson, pendingClaims, showClaimsPanel", "setShowClaimDialog, setClaimTargetPerson, setPendingClaims, setShowClaimsPanel"],
      ["Timeline", "timelinePerson: Person | null", "setTimelinePerson"],
      ["Reading", "showReadingDialog, readingDiary: PublicDiaryEntry | null", "openReadingDialog(entry), closeReadingDialog()"],
    ]
  ),

  // 8. File Structure
  h1("8. Project File Structure"),
  code("src/"),
  code("  app/"),
  code("    page.tsx                  # Root SPA page with AnimatePresence"),
  code("    layout.tsx                # Root layout with metadata"),
  code("    globals.css               # Tailwind CSS imports and global styles"),
  code("    api/"),
  code("      auth/login/route.ts     # Login endpoint"),
  code("      auth/signup/route.ts    # Registration endpoint"),
  code("      auth/logout/route.ts    # Logout endpoint"),
  code("      auth/session/route.ts   # Session check endpoint"),
  code("      trees/route.ts          # Tree CRUD"),
  code("      trees/join/route.ts     # Join tree by invite code"),
  code("      persons/route.ts       # Person CRUD + relationships"),
  code("      diaries/route.ts        # Diary CRUD"),
  code("      diaries/public/route.ts # Public feed with pagination"),
  code("      diaries/[id]/route.ts   # Single diary with full details"),
  code("      claims/route.ts        # Profile claim CRUD"),
  code("      admin/stats/route.ts   # Admin statistics"),
  code("      admin/users/route.ts   # Admin user management"),
  code("      admin/trees/route.ts   # Admin tree management"),
  code("      admin/diaries/route.ts # Admin diary management"),
  code("      download/route.ts      # File download endpoint"),
  code("  components/"),
  code("    zaitun/                   # 14 application components (see Section 6)"),
  code("    ui/                       # shadcn/ui base components"),
  code("  store/"),
  code("    zaitun.ts                 # Zustand store (all state + actions)"),
  code("  lib/"),
  code("    i18n/index.ts            # Translation function t(locale, key)"),
  code("    i18n/en.ts                # English dictionary"),
  code("    i18n/bn.ts                # Bengali dictionary"),
  code("    auth.ts                   # JWT session management"),
  code("    db.ts                     # Prisma client singleton"),
  code("    utils.ts                  # cn() utility for Tailwind classes"),
  code("  hooks/"),
  code("    use-toast.ts              # Toast notification hook"),
  code("    use-mobile.ts             # Mobile breakpoint detection"),
  code("prisma/"),
  code("  schema.prisma               # Database schema"),
  code("  migrations/                 # Database migration files"),
  code("public/"),
  code("  logo.svg                   # Zaitun logo (olive tree icon)"),
  code("  robots.txt                 # Search engine directives"),
  code("server.js                     # Custom Node.js server for cPanel deployment"),
  code(".cpanel.yml                   # cPanel build deployment config"),
  code(".env.example                 # Environment variable template"),

  // 9. Deployment
  h1("9. Deployment Guide"),

  h2("9.1 cPanel Deployment"),
  p("The project includes a .cpanel.yml file for automatic deployment via cPanel's Node.js application interface. The server.js file provides a custom HTTP server compatible with cPanel's process management."),
  p("Step-by-step deployment process:"),
  bullet("Upload the zaitun-cpanel.zip to the cPanel File Manager and extract it"),
  bullet("Copy .env.example to .env and set a strong JWT_SECRET value"),
  bullet("Set DATABASE_URL to file:./db/custom.db (or adjust path)"),
  bullet("Set NEXT_PUBLIC_APP_URL to your domain (e.g., https://zaitun.yourdomain.com)"),
  bullet("In cPanel, go to Setup Node.js App, select Node.js 18, and run:"),
  code("npm install"),
  code("npx prisma generate"),
  code("npx prisma db push"),
  code("npx next build"),
  code("node server.js"),
  p("The .cpanel.yml automates these steps when using cPanel's deployment feature. The server listens on the PORT environment variable provided by cPanel (defaults to 3000)."),

  h2("9.2 Environment Variables"),
  makeTable(
    ["Variable", "Required", "Description"],
    [
      ["DATABASE_URL", "Yes", "SQLite database path, e.g., file:./db/custom.db"],
      ["JWT_SECRET", "Yes", "Secret key for signing JWT tokens. Must be a strong random string."],
      ["NEXT_PUBLIC_APP_URL", "No", "Public URL of the application for SEO and metadata."],
      ["PORT", "No", "Server port (cPanel sets this automatically). Defaults to 3000."],
    ]
  ),

  h2("9.3 Database Management"),
  p("The project uses Prisma ORM with SQLite. For production:"),
  bullet("npx prisma generate \u2014 Generate the Prisma client from schema"),
  bullet("npx prisma db push \u2014 Apply schema changes to the database (no migration files needed)"),
  bullet("npx prisma migrate deploy \u2014 Apply migration files (if using migration-based workflow)"),
  p("The initial database file (custom.db) with sample data is included in the db/ directory. For a fresh deployment, the database will be created automatically by Prisma when db push is run."),

  // 10. Future Roadmap
  h1("10. Future Roadmap"),
  h2("10.1 Phase 2 (In Progress)"),
  bullet("Timeline-based biography system with auto-aggregation from diary entries"),
  bullet("Enhanced diary reading experience with search and keyboard navigation"),

  h2("10.2 Phase 3 (Planned)"),
  bullet("Edit permission system: tree owner can grant edit access to specific members"),
  bullet("Objection/rebuttal system for diary entries with structured debate workflow"),
  bullet("Tree ownership transfer with multi-step approval process"),

  h2("10.3 Phase 4 (Planned)"),
  bullet("Dedicated admin panel website (Falsafa) with full CMS capabilities"),
  bullet("Public-facing website (Pyhood) for showcasing public family trees and diaries"),
  bullet("Photo upload and gallery system for person profiles and diary entries"),
  bullet("Export functionality: PDF generation for diaries, GEDCOM export for family trees"),
  bullet("Mobile-responsive PWA with offline support for diary writing"),
];

// ── Assemble Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.body) },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.body) },
      },
    },
  },
  sections: [
    // Cover section
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCover(),
    },
    // TOC section
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } },
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }),
      },
      children: [
        new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "Table of Contents", size: 32, bold: true, color: c(P.body), font: { ascii: "Calibri" } })] }),
        new TableOfContents("Table of Contents", {
          hyperlink: true, headingStyleRange: "1-2",
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // Body section
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({ children: [new Paragraph({
          alignment: AlignmentType.RIGHT, spacing: { after: 0 },
          children: [new TextRun({ text: "Zaitun \u2014 Developer Documentation", size: 16, color: c(P.secondary), font: { ascii: "Calibri" } })],
        })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }),
      },
      children: body,
    },
  ],
});

const DOCX_SCRIPTS = "/home/z/my-project/skills/docx/scripts";
const outPath = "/home/z/my-project/download/Zaitun-Developer-Documentation.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log("Document created: " + outPath);
  console.log("Size: " + (buf.length / 1024).toFixed(1) + " KB");
});
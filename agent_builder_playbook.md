---

### File 2: `agent_builder_playbook.md`

Save the following content as `agent_builder_playbook.md` in your root project folder:

```markdown
# 🛒 ShopEZ Agent Builder — Meta-Prompt Playbook
# ⚠ AI instruction file. Guided Full-Stack execution. Do NOT manually edit.
# ─────────────────────────────────────────────────────────────────────────────

You are an expert full-stack developer agent specializing in the MERN stack (MongoDB, Express.js, React.js, Node.js). Your objective is to build the application titled "SHOPEZ : E-commerce Application" exactly following the modular directives outlined below.

Follow these instructions sequentially, phase by phase. **Wait for user input at each ✋ pause before proceeding to the next step.**

⚠ OPERATIONAL & STRUCTURAL INTEGRITY RULES:
  - Be concise. Minimize chat fluff. Focus strictly on file trees, setup steps, and code blocks.
  - Do not combine development phases. Verify the current phase works before drafting the next.
  - Ensure clear decoupling between the `frontend/` and `backend/` source directories.
  - All database queries must use robust error handling and structured response layouts.

═══════════════════════════════════════════════════════════════════════════════
PHASE 0 — SYSTEM CHECK & ENVIRONMENT INITIALIZATION
═══════════════════════════════════════════════════════════════════════════════

Execute environment sweeps. Do not assume tools are preset.

── 0a. Verify Runtimes ──
  - Prompt the user to run `node -v` and `npm -v` if you are executing within an interactive agent workspace. 
  - Ensure Node version is >= 18.0.0.

── 0b. Create Project Directory Tree ──
  Generate the following directory structure inside the root workspace folder:
  ```text
  shopez-ecommerce/
  ├── backend/
  │   ├── config/
  │   ├── controllers/
  │   ├── models/
  │   ├── routes/
  │   ├── middleware/
  │   └── server.js
  └── frontend/
      ├── public/
      └── src/
          ├── components/
          ├── pages/
          ├── context/
          └── utils/
── 0c. Backend Dependencies ──
Initialize a Node project inside backend/ and verify initialization of packages:
npm init -y
Install core components:
npm install express mongoose jsonwebtoken bcryptjs cors dotenv

── 0d. Frontend Scaffolding ──
Inside the root folder, run:
npx create-react-app frontend
Then install core libraries:
cd frontend && npm install axios react-router-dom bootstrap chart.js

✋ PAUSE: Report directory creation success, configuration status, and wait for user confirmation.

═══════════════════════════════════════════════════════════════════════════════
PHASE 1 — DATABASE DESIGN & SCHEMAS
═══════════════════════════════════════════════════════════════════════════════

Connect to MongoDB using Mongoose ORM. Create the following four collections with strict schemas inside backend/models/:

User Schema (User.js)

Fields: name (String), email (String, unique), password (String, hashed), role (String, enum: ['USER', 'ADMIN'], default: 'USER'), createdAt.

Product Schema (Product.js)

Fields: title (String), description (String), price (Number), inventoryCount (Number), discount (Number, default: 0), image (String), category (String).

Order Schema (Order.js)

Fields: user (Ref to User), items ([{ product: Ref to Product, quantity: Number, price: Number }]), totalAmount (Number), status (String, enum: ['Pending', 'Completed', 'Cancelled']), timestamp.

Analytics Schema (Analytics.js)

Fields: dailyRevenue (Number), totalOrders (Number), topSellingProducts ([Ref to Product]).

✋ PAUSE: Provide schema definitions, summarize validation rules, and wait for feedback.

═══════════════════════════════════════════════════════════════════════════════
PHASE 2 — BACKEND ARCHITECTURE & REST APIs
═══════════════════════════════════════════════════════════════════════════════

Implement core modular server files:

── 2a. Server Gateway (backend/server.js) ──

Standard Express configurations, global error handling, CORS policies matching frontend port, database initial connections.

── 2b. Authentication Middleware (backend/middleware/auth.js) ──

Validate JWT bearer tokens incoming via request headers.

Implement role screening middleware (verifyAdmin) protecting sensitive operations.

── 2c. Modules & Routing Paths ──

routes/auth.js: Registration (bcrypt hashing), Login (JWT payload signature delivery).

routes/products.js: Public read list/search access, Admin-protected POST/PUT/DELETE operations.

routes/orders.js: User order placement with atomic database updates; Admin order management routes.

routes/analytics.js: Dashboard metrics calculation aggregations.

✋ PAUSE: Output complete code structures for controllers/routes, explain connectivity flow, and pause.

═══════════════════════════════════════════════════════════════════════════════
PHASE 3 — FRONTEND APPLICATION DEVELOPMENT
═══════════════════════════════════════════════════════════════════════════════

Build interface layer inside frontend/src/:

── 3a. Global Configurations ──

Setup Global Context state (AuthContext.js) to persist JWT payload sessions and handle Axios client interceptors.

Implement protected routing rules wrapper inside react-router-dom.

── 3b. UI Components & Pages ──

Navigation Bar: Conditional link renderings based on active authenticated roles (Guest vs Buyer vs Admin Dashboard links).

Home/Catalog Page: Search capabilities, product inventory listing layouts, discount highlights.

Product Detail View: Expanded metadata descriptions, reviews, and dynamic adding to shopping cart state.

Secure Checkout Page: Order summary confirmation processing mapping directly to standard backend transaction pipelines.

Admin Analytical Dashboard: Order status manager tool, and analytical data visualization components populated using Chart.js hooks.

✋ PAUSE: Provide the core frontend files layout, explain communication links via Axios, and await final approval.

═══════════════════════════════════════════════════════════════════════════════
PHASE 4 — TESTING & OPTIMIZATION CLOSURE
═══════════════════════════════════════════════════════════════════════════════

── 4a. Query Tuning ──

Instruct the insertion of MongoDB indexing optimization for frequently grouped string parameters (e.g., product titles/categories).

── 4b. Front-Back Integration Smoke Test ──

Give instructions to run node backend/server.js alongside npm start in the frontend console to perform comprehensive integration verification steps.


---

### Prompt for Sandboxed Web AI Tools (bolt.new, Replit Agent, Lovable)

If you decide to skip complex local terminal pipelines and build the entire codebase in a browser-based automated developer like **bolt.new**, **Replit Agent**, or **Lovable.dev**, copy and paste the detailed block below into their prompt window. These tools run their own sandboxed backend environments and do not require your machine to have Node or Java runtimes installed locally.

```text
Please build a complete, production-ready Full-Stack MERN E-commerce web application called "ShopEZ". 

The platform must be cleanly decoupled into a backend (Node.js/Express/MongoDB) and a frontend (React.js with Bootstrap for UI styling).

Follow this exact architecture and build sequence:

1. COMPONENT DIRECTORY SETUP:
   - Create a dual-folder architecture: `backend/` for server runtime and data layers, and `frontend/` for client rendering logic.

2. BACKEND LAYER (& CORE DEPENDENCIES):
   - Configure a standard Express server file (`server.js`) equipped with CORS controls, native JSON parsers, and a central request exception routing structure.
   - Install and tie database connectivity down using Mongoose to interface with MongoDB.
   - Models to construct:
     - User (fields: name, email, encrypted password using bcrypt, role matching either 'USER' or 'ADMIN').
     - Product (fields: title, description, price, inventoryCount, discount percentage, category).
     - Order (fields: user reference, itemized arrays tracking products with quantities, total price, and fulfillment statuses).
     - Analytics (aggregated calculations tracker tracking revenues and overall order quantities).
   - Write core route handlers: User account sign-up/login generating secure JWT payloads, public searchable API paths for product records, and state-locked order submission controllers.
   - Include custom middleware files: an authentication gate that parses incoming JWT strings from Bearer HTTP headers, and a secondary verification gate that enforces ADMIN-only permissions.

3. FRONTEND CONSUMER INTERFACE:
   - Scaffold a modular React app utilizing React Router Dom for route mapping and Bootstrap for crisp, modern layout views.
   - Implement an AuthContext provider component to securely manage user profile sessions and assign access authorization headers automatically to Axios client instances.
   - Build out the primary template sections:
     - Header Nav Bar: Shows clear navigational context toggling between Login/Register buttons and transactional options based on active authentication.
     - Product Discovery Showcase: Contains instant item filter/search queries, product view card grids, and discount highlights.
     - Deep Detail Layout: Detailed item descriptions, availability counters, and quick add-to-cart operations.
     - Check-out Gateway: Form submission workflow that tracks inventory deductions and pushes transactional details to the backend API, rendering an instant order confirmation ticket.

4. SELLER ANALYTICS & MONITORING INTERFACE:
   - Implement an Admin Panel layout component protected by your route security gate.
   - Add structural tools to create, modify, or eliminate items from the inventory catalog database.
   - Build an operations display console allowing managers to override delivery status conditions.
   - Wire up dynamic analytic visualizations powered by Chart.js or Recharts rendering sales reports, top-converting product performance statistics, and chronological revenues.

Please construct the foundational backend elements completely before writing frontend layout views, ensuring full database-to-client schema alignment.
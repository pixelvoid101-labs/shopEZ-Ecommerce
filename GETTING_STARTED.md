# 🚀 Getting Started — ShopEZ E-Commerce Platform Build

Read this file completely before initiating the build session with your AI agent.

---

> [!IMPORTANT]
> **Pre-Build Check Recommendation:**
> Building a full-stack MERN application requires continuous tokens and reliable API orchestration.
> - ✅ **Local Stack Verification**: Ensure Node.js and MongoDB are running locally or reachable via URI string before prompting the agent to write data controllers.
> - ✅ **Google AI Studio Pro / Gemini Advanced account** — Higher rate limits are highly recommended if building using the Antigravity IDE platform.
> - If your local development environment lacks Node.js (v18+) or npm, follow Step 1 below immediately.

---

## Technical Architecture Overview

ShopEZ is structured as a decoupled Full-Stack MERN architecture:

| Component | Technology Stack | Core Responsibility |
|-----------|------------------|---------------------|
| **Frontend** | React.js (v18+), Bootstrap, Axios, React Router Dom, Chart.js | Responsive User Interface, client-side routing, seller analytics dashboard. |
| **Backend** | Node.js, Express.js, REST APIs | Endpoint routing, business logic, JWT issuance, order workflow processing. |
| **Database** | MongoDB (Mongoose ORM) | Document storage for Users, Products, Orders, and Analytics metadata. |
| **Security** | JSON Web Tokens (JWT), Bcrypt.js, CORS | Secure session tokens, password hashing, cross-origin resource protection. |

---

## Step-by-Step System Check Setup

### 1. Pre-Flight Environment Validation (Run on Your System)
Open your terminal and run the following commands to confirm that the required runtime engines are installed:

**Node.js Runtime (v18 or above required)**
```bash
node --version
**npm Package Manager (v9 or above)**
```bash
npm --version
**Git Version Control**
```bash
git --version


### 2. Initializing the Project Workspace
You have already created your folder at `E:\shopez-ecommerce`. Drop this `GETTING_STARTED.md` and the accompanying `agent_builder_playbook.md` directly into that folder.

---

## Frequently Asked Questions & Troubleshooting

**Q: The AI Agent starts generating full backend code without verifying my system architecture first. How can I stop it?**
A: Ensure your first prompt to the agent forces it to execute **Phase 0** of the `agent_builder_playbook.md`. The playbook explicitly mandates environment validation before code output begins.

**Q: How do I handle database connection strings safely?**
A: The project setup automatically provisions an `.env` file in the backend root directory. Never hardcode passwords or database URIs directly into your source repository. Paste your MongoDB Compass URI string there when the agent requests it.

**Q: I am encountering CORS blockages during frontend-to-backend Axios requests.**
A: The Express application relies on the `cors` package configured dynamically to accept requests originating from your local React development host port (typically `http://localhost:3000`).
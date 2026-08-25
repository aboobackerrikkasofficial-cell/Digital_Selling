# Aboobacker Rikkas - Digital Products Storefront 🚀

A luxury dark-themed digital storefront built for **Aboobacker Rikkas** (Python Full-Stack Developer & Automation Creator). It allows customers to browse, explore, filter, and buy automation tools, AI calling agents, job finding scrapers, Instagram growth suites, website templates, e-books, and mobile apps.

---

## 🎨 Visual Identity & Aesthetic Choices
- **Theme**: Luxury Dark Obsidian (`#0B0B0C`) with warm dark espresso charcoal cards (`#141212`) & glassmorphism.
- **Primary Action Accent ("Deadpool Red")**: `#E52E2E` (High urgency CTAs, glow shadows, buy buttons).
- **Secondary & Trust Accent ("Hulk Green")**: `#00E676` (Verified UPI badges, active sales tags, discount badges).
- **Typography**: `Space Grotesk` (Display headings) and `Plus Jakarta Sans` (Body text).
- **Zero AI Cliché Colors**: No bright purple, neon blue, or gold gradients.

---

## ⚡ Key Features

1. **Direct UPI Payment Setup**:
   - Integrated with GPay UPI ID: **`aboobackerrikkas16@okicici`**.
   - Automatic QR Code Generator rendering dynamic payment URIs (`upi://pay?pa=aboobackerrikkas16@okicici&pn=Aboobacker%20Rikkas&am=...`).
   - One-click copy UPI ID button with toast notification.
   - Direct GPay / PhonePe / Paytm mobile app launch button.
   - UTR Payment Proof form that auto-formats an order message and redirects the customer directly to your WhatsApp (`+91 9188072646`).

2. **Dual Pricing Modes**:
   - **Single Amount (Lifetime Purchase)**: Pay once and get full source code.
   - **Subscription Mode (Monthly)**: Recurring billing rate option with instant currency switcher between INR (₹) and USD ($).

3. **1-Click Admin Product Management**:
   - Accessible via the **"Manage Products"** button in the header.
   - Add new products live with custom title, tagline, category, single price, subscription price, thumbnail URL, description, features, and tech stack tags.
   - Saved dynamically in browser `localStorage` and persistent across refreshes!

4. **Responsive 3D Depth Elements**:
   - Interactive 3D tilt movement on product cards as cursor moves over them.
   - Mobile-first responsive grid for smooth experience on smartphones, tablets, and desktops.

---

## 📁 Directory Structure

```
DigitalProducts_Rikkas/
├── index.html              # Main HTML structure with semantic SEO tags & modals
├── css/
│   └── styles.css          # Luxury dark design system, 3D tilt effects & responsive rules
├── js/
│   ├── products-data.js    # Pre-loaded initial digital products & LocalStorage manager
│   └── app.js              # State management, search, filters, payment modal & admin CRUD
└── assets/
    └── images/             # 3D Rendered product covers
        ├── whatsapp_bot.png
        ├── ai_calling_agent.png
        ├── job_automation.png
        └── instagram_automation.png
```

---

## 🖼️ Prompts for Generating 3D Product Thumbnails (for future tools)

When you create new tools, websites, ebooks, or apps in the future, use these high-yield prompts with Midjourney, DALL-E 3, or Imagen to generate matching luxury 3D dark thumbnails:

### 1. General Tool / Script Thumbnail Prompt:
> *"A luxury dark 3D render of [INSERT TOOL NAME/TYPE], sleek obsidian black glass floating card with subtle glowing deadpool red and emerald green neon accents, 3D isometric floating elements, ultra high resolution, clean dark studio lighting, depth of field, 8k resolution, minimalist developer aesthetic"*

### 2. AI & Voice Bot Product Prompt:
> *"A luxury dark 3D render of an AI Voice Calling Agent software, futuristic obsidian spherical core with glowing red voice wave spectrum and emerald green status indicator, floating 3D audio wave cards, hyper detailed, 8k resolution, premium dark aesthetic"*

### 3. Website / SaaS Kit Prompt:
> *"A luxury 3D floating website dashboard frame, dark obsidian theme with glowing crimson neon borders, floating 3D analytical charts and UI code windows, dark glossy glass reflections, modern web design concept"*

### 4. Developer E-Book Prompt:
> *"A luxury 3D dark hardcover book mockup resting on obsidian glass, sleek matte black cover with metallic embossed red title text and subtle green glowing neon code snippets, high tech dark aesthetic"*

---

## 🚀 How to Run Locally

You can open `index.html` directly in any web browser, or serve it using Python / Node:

```bash
# Using Python:
python -m http.server 8000

# Or using Node npx:
npx serve .
```

Then navigate to `http://localhost:8000` or `http://localhost:3000` in your browser.

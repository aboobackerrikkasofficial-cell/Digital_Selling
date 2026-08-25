/**
 * Aboobacker Rikkas - Digital Products Storefront Engine
 * Clean Architecture, State Management, Product Details Modal & Direct UPI Payment Engine
 */

document.addEventListener("DOMContentLoaded", () => {
  // Store App State
  const state = {
    products: [],
    activeCategory: "all",
    searchQuery: "",
    pricingMode: "single", // 'single' | 'subscription'
    currency: "INR", // 'INR' | 'USD'
    selectedProduct: null,
    upiId: "aboobackerrikkas16@okicici",
    whatsappNumber: "919188072646"
  };

  // DOM Cache
  const productsGrid = document.getElementById("productsGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryPills = document.getElementById("categoryPills");
  const singleBtn = document.getElementById("btnSinglePrice");
  const subBtn = document.getElementById("btnSubPrice");
  const currencyBtn = document.getElementById("btnCurrencyToggle");
  const adminBtn = document.getElementById("btnAdminOpen");
  
  const detailModal = document.getElementById("detailModal");
  const paymentModal = document.getElementById("paymentModal");
  const adminModal = document.getElementById("adminModal");
  const loginModal = document.getElementById("loginModal");

  // Initialize Data
  async function initApp() {
    setupEventListeners();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const res = await fetch('https://digital-selling-7w8x.onrender.com/api/products', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error("API Error");
      
      const data = await res.json();
      if (data.success) {
        state.products = data.products;
      } else {
        state.products = [];
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      // Removed dummy products as per user request so they can add original products
      state.products = [];
    }
    renderProducts();
  }

  // Format Currency
  function formatPrice(singlePriceObj, subPriceObj) {
    const isSub = state.pricingMode === "subscription";
    const priceObj = isSub ? subPriceObj : singlePriceObj;
    
    if (!priceObj) {
      const fallback = isSub ? singlePriceObj : subPriceObj;
      if (!fallback) return "Custom";
      return formatPriceVal(fallback);
    }

    return formatPriceVal(priceObj) + (isSub ? "/mo" : "");
  }

  function formatPriceVal(priceObj) {
    if (state.currency === "INR") {
      return `â‚¹${priceObj.inr.toLocaleString("en-IN")}`;
    } else {
      return `$${priceObj.usd.toLocaleString("en-US")}`;
    }
  }

  // Filter Products
  function getFilteredProducts() {
    return state.products.filter(product => {
      // Category Match
      const matchesCategory = state.activeCategory === "all" || product.category === state.activeCategory;
      
      // Search Match
      const query = state.searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        product.title.toLowerCase().includes(query) ||
        product.tagline.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.techStack.some(t => t.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }

  // Render Product Grid
  function renderProducts() {
    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
      productsGrid.innerHTML = `
        <div class="no-results">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <h3>No digital products found</h3>
          <p style="color: var(--text-coffee-muted);">Try adjusting your search terms or filter category.</p>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = filtered.map(product => {
      const priceDisplay = formatPrice(product.singlePrice, product.subscriptionPrice);
      const isSub = state.pricingMode === "subscription";
      
      return `
        <article class="product-card" data-id="${product.id}">
          <div class="product-thumb-wrap">
            <span class="product-badge-overlay">${product.badge || "Featured"}</span>
            <span class="product-rating-overlay">â˜… ${product.rating || "4.9"}</span>
            <img src="${product.image}" alt="${product.title}" class="product-thumb" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'">
          </div>
          <div class="product-body">
            <div class="product-category-tag">${product.category.replace('_', ' ')}</div>
            <h3 class="product-title">${product.title}</h3>
            <p class="product-tagline">${product.tagline}</p>
            
            <div class="product-tech-stack">
              ${(product.techStack || []).map(tech => `<span class="tech-chip">${tech}</span>`).join('')}
            </div>

            <div class="product-footer">
              <div class="price-box">
                <span class="price-amount">${priceDisplay}</span>
                <span class="price-period">${isSub ? "billed monthly" : "one-time lifetime"}</span>
              </div>
              <div class="card-actions">
                <button class="btn-outline btn-detail" data-id="${product.id}" aria-label="View Details for ${product.title}">Details</button>
                <button class="btn-primary btn-buy" data-id="${product.id}" aria-label="Buy ${product.title}">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join("");

    attachCardListeners();
  }

  // Attach Listeners to Rendered Cards
  function attachCardListeners() {
    document.querySelectorAll(".btn-detail").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        openDetailModal(id);
      });
    });

    document.querySelectorAll(".btn-buy").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        openPaymentModal(id);
      });
    });
  }

  // Open Detail Modal (Cleanly styled with theme variables & full details)
  function openDetailModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    state.selectedProduct = product;

    const modalBody = document.getElementById("detailModalContent");
    const priceDisplay = formatPrice(product.singlePrice, product.subscriptionPrice);
    const isSub = state.pricingMode === "subscription";

    modalBody.innerHTML = `
      <div style="padding: 1.8rem;">
        <div style="display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: flex-start; margin-bottom: 1.4rem;">
          <img src="${product.image}" style="width: 120px; height: 120px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-cream);" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'">
          <div style="flex: 1; min-width: 220px;">
            <span class="product-category-tag">${product.category.replace('_', ' ')}</span>
            <h2 style="font-size: 1.5rem; margin-bottom: 0.4rem; color: var(--text-coffee-dark); font-weight: 800;">${product.title}</h2>
            <p style="color: var(--text-coffee-muted); font-size: 0.92rem; margin-bottom: 0.8rem; line-height: 1.5;">${product.tagline}</p>
            <div style="display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
              <span class="price-amount" style="font-size: 1.45rem;">${priceDisplay}</span>
              <span class="discount-tag" style="background: var(--bg-green-soft); color: var(--accent-green); font-size: 0.78rem;">â˜… ${product.rating || '4.9'} (${product.salesCount || 100}+ Downloads)</span>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.2rem; margin-bottom: 1.2rem;">
          <h4 style="font-size: 1.05rem; margin-bottom: 0.6rem; color: var(--text-coffee-dark); font-weight: 700;">Product Overview</h4>
          <p style="color: var(--text-coffee-muted); font-size: 0.92rem; line-height: 1.6;">${product.description}</p>
        </div>

        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.2rem; margin-bottom: 1.2rem;">
          <h4 style="font-size: 1.05rem; margin-bottom: 0.6rem; color: var(--text-coffee-dark); font-weight: 700;">Key Capabilities & Features Included</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem;">
            ${(product.features || []).map(f => `
              <li style="display: flex; align-items: flex-start; gap: 0.6rem; color: var(--text-coffee-dark); font-size: 0.9rem;">
                <span style="color: var(--accent-green); font-weight: 800; flex-shrink: 0;">âœ“</span>
                <span>${f}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            ${(product.techStack || []).map(t => `<span class="tech-chip">${t}</span>`).join('')}
          </div>
          <button class="btn-primary" id="btnDetailModalBuy">
            Proceed to Checkout (${priceDisplay})
          </button>
        </div>
      </div>
    `;

    document.getElementById("btnDetailModalBuy").addEventListener("click", () => {
      closeModal(detailModal);
      openPaymentModal(productId);
    });

    openModal(detailModal);
  }

  // Open Payment (Razorpay Integration)
  async function openPaymentModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    state.selectedProduct = product;

    const planType = state.pricingMode;

    try {
      showToast("Initializing Secure Checkout...");
      
      // 1. Call secure Vercel API
      const res = await fetch("https://digital-selling-7w8x.onrender.com/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          planType: planType,
          customerEmail: "customer@example.com", // In a full app, collect this beforehand
          customerPhone: "9999999999"
        })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        showToast("Error starting checkout: " + data.message);
        return;
      }

      // 2. Open Razorpay Checkout Window
      const options = {
        key: "rzp_live_TSkfPKvHtyq6BO", // Safe to expose public key
        amount: data.amount,
        currency: data.currency,
        name: "Aboobacker Rikkas",
        description: product.title,
        order_id: data.orderId,
        handler: function (response) {
          // Success Callback
          const waMsg = `Hi Aboobacker Rikkas! ðŸ‘‹%0A%0AI have just purchased *${encodeURIComponent(product.title)}*.%0A%0AðŸ“Œ *Payment Details:*%0A- Payment ID: ${response.razorpay_payment_id}%0A- Order ID: ${response.razorpay_order_id}%0A%0APlease send my instant access download link!`;
          
          showToast("Payment Successful! Redirecting to WhatsApp for access...");
          
          setTimeout(() => {
            window.open(`https://wa.me/${state.whatsappNumber}?text=${waMsg}`, "_blank");
          }, 1500);
        },
        prefill: {
          name: "Valued Customer",
          email: "customer@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#c2a688" // Brand Coffee Muted color
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        showToast("Payment Failed: " + response.error.description);
      });
      rzp1.open();

    } catch (error) {
      console.error(error);
      showToast("Could not connect to payment gateway.");
    }
  }

  // Modal Controls
  function openModal(modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Search Listener
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      renderProducts();
    });

    // Category Pills Listener
    categoryPills.addEventListener("click", (e) => {
      if (e.target.classList.contains("cat-btn")) {
        document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        state.activeCategory = e.target.getAttribute("data-cat");
        renderProducts();
      }
    });

    // Pricing Mode Toggle
    singleBtn?.addEventListener("click", () => {
      singleBtn.classList.add("active");
      subBtn.classList.remove("active");
      state.pricingMode = "single";
      renderProducts();
    });

    subBtn?.addEventListener("click", () => {
      subBtn.classList.add("active");
      singleBtn.classList.remove("active");
      state.pricingMode = "subscription";
      renderProducts();
    });

    // Currency Switcher
    currencyBtn.addEventListener("click", () => {
      state.currency = state.currency === "INR" ? "USD" : "INR";
      currencyBtn.innerHTML = `<span>${state.currency === "INR" ? "â‚¹ INR" : "$ USD"}</span>`;
      renderProducts();
    });

    // Copy UPI ID Button
    document.getElementById("btnCopyUpi")?.addEventListener("click", () => {
      navigator.clipboard.writeText(state.upiId).then(() => {
        showToast("UPI ID copied to clipboard!");
      }).catch(() => {
        showToast("UPI ID: " + state.upiId);
      });
    });

    // Close Modal Buttons
    document.querySelectorAll(".modal-close-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const modal = e.currentTarget.closest(".modal-overlay");
        closeModal(modal);
      });
    });

    // Close Modal on Overlay Click
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    });

    // FAQ Accordion
    document.querySelectorAll(".faq-question").forEach(q => {
      q.addEventListener("click", () => {
        const item = q.closest(".faq-item");
        const isActive = item.classList.contains("active");
        
        document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("active"));
        if (!isActive) item.classList.add("active");
      });
    });

    // Admin Modal Logic (Now protected by Login)
    adminBtn.addEventListener("click", () => {
      // Check if already authenticated (simple check, backend verifies actual actions)
      const token = localStorage.getItem("adminToken");
      if (token) {
        openModal(adminModal);
      } else {
        openModal(loginModal);
      }
    });

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;
        const errorDiv = document.getElementById("loginError");
        errorDiv.style.display = "none";

        try {
          const res = await fetch("https://digital-selling-7w8x.onrender.com/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
          });
          const data = await res.json();

          if (data.success) {
            localStorage.setItem("adminToken", data.token);
            closeModal(loginModal);
            loginForm.reset();
            openModal(adminModal);
            showToast("Logged in successfully!");
          } else {
            errorDiv.textContent = data.message || "Invalid credentials";
            errorDiv.style.display = "block";
          }
        } catch (err) {
          console.error(err);
          errorDiv.textContent = "Server connection failed";
          errorDiv.style.display = "block";
        }
      });
    }

    const addProductForm = document.getElementById("addProductForm");
    if (addProductForm) {
      addProductForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const fileInput = document.getElementById("productFile");
        if (!fileInput.files || fileInput.files.length === 0) {
          showToast("Please select a digital product file to upload.", "error");
          return;
        }

        const formData = new FormData();
        formData.append("title", document.getElementById("newTitle").value.trim());
        formData.append("short_description", document.getElementById("newTagline").value.trim());
        formData.append("category", document.getElementById("newCategory").value);
        formData.append("badge", document.getElementById("newBadge").value.trim() || "New Tool âš¡");
        formData.append("thumbnail", document.getElementById("newImage").value.trim() || "assets/images/default.jpg");
        formData.append("price", document.getElementById("newSingleInr").value);
        
        // Append the actual file
        formData.append("product_file", fileInput.files[0]);

        try {
          const res = await fetch("https://digital-selling-7w8x.onrender.com/api/products", {
            method: "POST",
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            state.products.push(data.product);
            renderProducts();
            closeModal(adminModal);
            addProductForm.reset();
            showToast("New product published successfully!");
          } else {
            showToast("Failed to publish product.");
          }
        } catch (err) {
          console.error(err);
          showToast("Server error while publishing.");
        }
      });
    }

    document.getElementById("btnResetProducts")?.addEventListener("click", async () => {
      if (confirm("Are you sure? This doesn't apply to the database.")) {
        // Just reload for now
        await initApp();
        closeModal(adminModal);
        showToast("Products reloaded from database.");
      }
    });
  }

  // Toast Notification Helper
  function showToast(message) {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Start App
  initApp();
});


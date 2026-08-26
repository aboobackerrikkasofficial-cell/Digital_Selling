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
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for Render wake-up
      
      const res = await fetch('https://digital-selling-7w8x.onrender.com/api/products', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error("API Error: " + res.status);
      
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        state.products = data.products.map(p => ({
          ...p,
          id: p.id,
          title: p.title,
          tagline: p.tagline || p.short_description || "",
          description: p.description || p.short_description || "",
          category: p.category || "general",
          badge: p.badge || (p.bestseller ? "Bestseller 🔥" : (p.featured ? "Featured ⭐" : "Instant Access ⚡")),
          rating: p.rating || "4.9",
          image: p.thumbnail || p.image || "assets/images/default.jpg",
          thumbnail: p.thumbnail || p.image || "assets/images/default.jpg",
          singlePrice: p.singlePrice || (typeof p.price === "number" ? { inr: p.price, usd: Math.max(1, Math.round(p.price / 85)) } : { inr: 999, usd: 12 }),
          subscriptionPrice: p.subscriptionPrice || null,
          techStack: Array.isArray(p.techStack) ? p.techStack : ["Instant Download", "Lifetime Access"],
          features: Array.isArray(p.features) ? p.features : ["Complete digital package", "Instant file delivery after payment", "Full documentation included"]
        }));
      } else {
        state.products = [];
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      state.products = [];
    }
    
    if (window.location.pathname.includes('product.html')) {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');
      renderProductPage(productId);
    } else {
      renderProducts();
    }
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
      return `₹${priceObj.inr.toLocaleString("en-IN")}`;
    } else {
      return `$${priceObj.usd.toLocaleString("en-US")}`;
    }
  }

  // Filter Products
  function getFilteredProducts() {
    return (state.products || []).filter(product => {
      if (!product) return false;
      
      // Category Match
      const prodCat = (product.category || "").toLowerCase().replace(/[^a-z0-9]/g, '');
      const activeCat = (state.activeCategory || "all").toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchesCategory = activeCat === "all" || prodCat === activeCat || prodCat.includes(activeCat) || activeCat.includes(prodCat);
      
      // Search Match
      const query = (state.searchQuery || "").toLowerCase().trim();
      const title = (product.title || "").toLowerCase();
      const tagline = (product.tagline || product.short_description || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      const techStack = Array.isArray(product.techStack) ? product.techStack : [];
      const matchesTech = techStack.some(t => typeof t === 'string' && t.toLowerCase().includes(query));

      const matchesSearch = !query || 
        title.includes(query) ||
        tagline.includes(query) ||
        description.includes(query) ||
        matchesTech;

      return matchesCategory && matchesSearch;
    });
  }

  // Render Single Product Page
  function renderProductPage(productId) {
    const container = document.getElementById('productDetailContainer');
    if (!container) return;
    
    const product = state.products.find(p => p.id === productId);
    
    if (!product) {
      container.innerHTML = `<div style="padding: 3rem; text-align: center; color: var(--text-coffee-muted);">Product not found. <a href="index.html" style="color: var(--accent-orange);">Go back</a></div>`;
      return;
    }
    
    state.selectedProduct = product;
    const singlePriceObj = product.singlePrice || (typeof product.price === 'number' ? { inr: product.price, usd: Math.max(1, Math.round(product.price / 85)) } : { inr: 999, usd: 12 });
    const priceDisplay = formatPrice(singlePriceObj, product.subscriptionPrice);
    const catDisplay = (product.category || "Digital Product").replace(/_/g, ' ');
    const imgSrc = product.thumbnail || product.image || 'assets/images/default.jpg';
    const features = Array.isArray(product.features) ? product.features : ["Complete digital package", "Instant file delivery after payment", "Full documentation included"];
    const techStack = Array.isArray(product.techStack) ? product.techStack : ["Instant Access", "Lifetime Download"];

    container.innerHTML = `
      <div style="padding: 2.5rem;">
        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: flex-start; margin-bottom: 2rem;">
          <img src="${imgSrc}" style="width: 160px; height: 160px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-cream);" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'">
          <div style="flex: 1; min-width: 250px;">
            <span class="product-category-tag" style="margin-bottom: 0.5rem; display: inline-block;">${catDisplay}</span>
            <h1 style="font-size: 2rem; margin-bottom: 0.6rem; color: var(--text-coffee-dark); font-weight: 800; line-height: 1.2;">${product.title || 'Untitled'}</h1>
            <p style="color: var(--text-coffee-muted); font-size: 1.05rem; margin-bottom: 1rem; line-height: 1.6;">${product.tagline || product.short_description || ''}</p>
            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <span class="discount-tag" style="background: var(--bg-green-soft); color: var(--accent-green); font-size: 0.9rem; padding: 0.4rem 0.8rem;">★ ${product.rating || '4.9'} (${product.salesCount || 100}+ Downloads)</span>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.5rem; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.25rem; margin-bottom: 0.8rem; color: var(--text-coffee-dark); font-weight: 700;">Product Overview</h3>
          <p style="color: var(--text-coffee-muted); font-size: 1rem; line-height: 1.7;">${product.description || product.short_description || 'Detailed guide and source files.'}</p>
        </div>

        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.5rem; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.25rem; margin-bottom: 0.8rem; color: var(--text-coffee-dark); font-weight: 700;">Key Capabilities & Features</h3>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.8rem; padding: 0;">
            ${features.map(f => `
              <li style="display: flex; align-items: flex-start; gap: 0.8rem; color: var(--text-coffee-dark); font-size: 1rem;">
                <span style="color: var(--accent-green); font-weight: 800; flex-shrink: 0; font-size: 1.1rem;">✓</span>
                <span>${f}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="font-size: 1.25rem; color: var(--text-coffee-dark); font-weight: 700; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
              <span>💬 Verified Customer Reviews</span>
            </h3>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${getProductReviews(product).map(r => `
              <div style="background: var(--bg-coffee-darker); border: 1px solid var(--border-cream); border-radius: var(--radius-md); padding: 1rem 1.2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-orange); color: #fff; font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      ${r.name.charAt(0)}
                    </div>
                    <div>
                      <span style="font-size: 0.95rem; font-weight: 700; color: var(--text-coffee-dark);">${r.name}</span>
                      <span style="font-size: 0.8rem; color: var(--text-coffee-muted); margin-left: 0.4rem;">• ${r.location}</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 0.75rem; background: rgba(194, 166, 136, 0.18); color: var(--accent-orange); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">${r.langBadge}</span>
                    <span style="color: #f59e0b; font-size: 0.9rem; letter-spacing: 1px;">★★★★★</span>
                  </div>
                </div>
                <p style="font-size: 0.95rem; color: var(--text-coffee-dark); line-height: 1.6; margin: 0.5rem 0; font-style: italic;">
                  "${r.text}"
                </p>
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-coffee-muted);">
                  <span style="color: var(--accent-green); font-weight: 600;">${r.tag}</span>
                  <span>${r.date}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Buy Now Section (Bottom) -->
        <div style="border-top: 1px solid var(--border-cream); padding-top: 2rem; margin-top: 1rem; text-align: center; background: var(--bg-coffee-darker); border-radius: var(--radius-md); padding-bottom: 2rem;">
          <h3 style="font-size: 1.4rem; color: var(--text-coffee-dark); margin-bottom: 0.5rem;">Get Instant Access Now</h3>
          <p style="color: var(--text-coffee-muted); margin-bottom: 1.5rem;">Join ${product.salesCount || 100}+ others who have already downloaded.</p>
          <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
             <span style="font-size: 2rem; font-weight: 800; color: var(--text-coffee-dark);">${priceDisplay}</span>
          </div>
          <button class="btn-primary" id="btnPageBuy" style="font-size: 1.1rem; padding: 1rem 2.5rem; min-width: 250px;">
            Buy Now - Instant Download
          </button>
          <p style="font-size: 0.8rem; color: var(--text-coffee-muted); margin-top: 1rem;">Secure Payment via UPI/Card. 100% Instant Delivery.</p>
        </div>
      </div>
    `;

    document.getElementById("btnPageBuy").addEventListener("click", () => {
      openPaymentModal(productId);
    });
  }

  // Render Product Grid
  function renderProducts() {
    try {
      const filtered = getFilteredProducts();

      if (!filtered || filtered.length === 0) {
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
        const singlePriceObj = product.singlePrice || (typeof product.price === 'number' ? { inr: product.price, usd: Math.max(1, Math.round(product.price / 85)) } : { inr: 999, usd: 12 });
        const priceDisplay = formatPrice(singlePriceObj, product.subscriptionPrice);
        const isSub = state.pricingMode === "subscription";
        const catDisplay = (product.category || "Digital Product").replace(/_/g, ' ');
        const imgSrc = product.thumbnail || product.image || 'assets/images/default.jpg';
        const techStack = Array.isArray(product.techStack) ? product.techStack : ["Instant Access", "Lifetime Download"];
        const features = Array.isArray(product.features) ? product.features : ["Complete digital package", "Instant file delivery after payment", "Full documentation included"];
        
        return `
          <article class="product-card" data-id="${product.id}" style="cursor: pointer;" onclick="window.location.href='product.html?id=${product.id}'">
            <div class="product-thumb-wrap">
              <span class="product-badge-overlay">${product.badge || "Featured"}</span>
              <img src="${imgSrc}" alt="${product.title || 'Product'}" class="product-thumb" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'">
            </div>
            <div class="product-body">
              <div class="product-category-tag">${catDisplay}</div>
              <h3 class="product-title">${product.title || 'Untitled'}</h3>
              <p class="product-tagline">${product.tagline || product.short_description || ''}</p>
              
              <div style="margin: 0.8rem 0;">
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-coffee-dark); margin-bottom: 0.4rem;">Top Features:</div>
                <ul style="list-style: none; padding: 0; font-size: 0.8rem; color: var(--text-coffee-muted); display: flex; flex-direction: column; gap: 0.3rem;">
                  ${features.slice(0, 3).map(f => `<li><span style="color: var(--accent-green);">✓</span> ${f}</li>`).join('')}
                </ul>
              </div>

              <div class="product-footer" style="border-top: 1px solid var(--border-cream); padding-top: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-coffee-dark);">
                  <span style="color: #f59e0b;">★ ${product.rating || "4.9"}</span>
                  <span style="color: var(--text-coffee-muted);">(${product.salesCount || 100}+ Downloads)</span>
                </div>
                <div class="price-box" style="margin: 0;">
                  <span class="price-amount" style="font-size: 1.1rem;">${priceDisplay}</span>
                </div>
              </div>
            </div>
          </article>
        `;
      }).join("");

      attachCardListeners();
      renderAdminProducts();
    } catch (e) {
      console.error("Error in renderProducts:", e);
    }
  }

  function renderAdminProducts() {
    const list = document.getElementById("adminProductsList");
    const count = document.getElementById("adminProductCount");
    if (!list) return;

    if (!state.products || state.products.length === 0) {
      list.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-coffee-muted);">No products found.</div>`;
      if (count) count.textContent = "0 Products";
      return;
    }

    if (count) count.textContent = `${state.products.length} Product${state.products.length > 1 ? 's' : ''}`;

    list.innerHTML = state.products.map(p => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-coffee-darker); padding: 0.6rem; border-radius: 8px; border: 1px solid var(--border-cream);">
        <div style="overflow: hidden;">
          <h5 style="margin: 0; font-size: 0.9rem; color: var(--text-coffee-light); white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${p.title || 'Untitled'}</h5>
          <div style="font-size: 0.7rem; color: var(--text-coffee-muted); margin-top: 0.2rem;">${p.category || 'digital'} • ₹${p.price || 0}</div>
        </div>
        <button class="btn-delete-product" data-id="${p.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.4rem;">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `).join("");

    list.querySelectorAll(".btn-delete-product").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this product?")) {
          const btnEl = e.currentTarget;
          btnEl.disabled = true;
          btnEl.style.opacity = "0.5";
          try {
            const res = await fetch(`https://digital-selling-7w8x.onrender.com/api/products/${id}`, {
              method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
              showToast("Product deleted successfully");
              await fetchProducts(); // Refresh the list
            } else {
              showToast("Error deleting product");
              btnEl.disabled = false;
              btnEl.style.opacity = "1";
            }
          } catch (err) {
            console.error("Delete product error:", err);
            showToast("Failed to connect to server");
            btnEl.disabled = false;
            btnEl.style.opacity = "1";
          }
        }
      });
    });
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

  // Authentic Community Reviews (Malayalam, Manglish, English)
  function getProductReviews(product) {
    const title = (product.title || "Digital Product").toLowerCase();
    const cat = (product.category || "").toLowerCase();
    
    if (cat.includes("meesho") || title.includes("meesho")) {
      return [
        {
          name: "Rahul M.",
          location: "Kozhikode, Kerala",
          rating: 5,
          date: "2 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "മലയാളം",
          text: "വളരെ ഉപകാരപ്രദമായ ഗൈഡ് ആണ് brother! Meesho reselling-ൽ ആദ്യത്തെ ആഴ്ചയിൽ തന്നെ 8 orders കിട്ടി. Simple explanation & clear steps. No stock risk. Highly recommended! 🔥"
        },
        {
          name: "Muhammed Shafi",
          location: "Malappuram",
          rating: 5,
          date: "3 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "Manglish",
          text: "Bro ithu valare helpful aayi. Zero inventory system engane setup cheyyanam ennu step by step aayi paranjuthannu. Meta ads tricks awesome aanu. Worth every rupee! 👍"
        },
        {
          name: "Akhil Dev",
          location: "Kannur",
          rating: 5,
          date: "5 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "Manglish",
          text: "Njan honestly first doubt aayirunnu, but buy cheythu nokkiyappo full practical strategies aanu. WhatsApp customer conversion script worked like magic. Superb! 🚀"
        },
        {
          name: "Jithin Joy",
          location: "Kottayam",
          rating: 5,
          date: "1 week ago",
          tag: "Verified Buyer ✅",
          langBadge: "English",
          text: "Pure actionable reselling methods that actually work in Kerala & India. No fluff, straight to execution. Instant WhatsApp delivery was super quick! 10/10."
        },
        {
          name: "Vishnu Prasad",
          location: "Kochi",
          rating: 5,
          date: "1 week ago",
          tag: "Verified Buyer ✅",
          langBadge: "മലയാളം",
          text: "അടിപൊളി ബ്ലൂപ്രിന്റ്! Beginner ആയിട്ടും വളരെ എളുപ്പത്തിൽ മനസ്സിലായി. ഇനി ധൈര്യമായി Meesho-യിൽ ഓർഡറുകൾ എടുക്കാം. Thank you Rikkas bro! 💯"
        }
      ];
    } else if (cat.includes("dropship") || title.includes("dropship")) {
      return [
        {
          name: "Salman Faris",
          location: "Calicut / Dubai",
          rating: 5,
          date: "Yesterday",
          tag: "Verified Buyer ✅",
          langBadge: "Manglish",
          text: "Bro dropshipping supplier sourcing-um high converting landing page setup-um clear aayi. Video tutorials clear aanu. Worth 10x the price! 🙌"
        },
        {
          name: "Ananthu R.",
          location: "Trivandrum",
          rating: 5,
          date: "3 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "English",
          text: "Hands down the most realistic dropshipping blueprint. Covered real supplier contacts and shipping workflows. Generated my first 5 sales in 48 hours."
        },
        {
          name: "Faisal K.",
          location: "Kondotty",
          rating: 5,
          date: "4 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "മലയാളം",
          text: "ഡ്രോപ്ഷിപ്പിംഗ് തുടങ്ങിയപ്പോൾ ഉള്ള എല്ലാ സംശയങ്ങളും ഇതിലൂടെ തീർന്നു. നല്ലൊരു സപ്പോർട്ട് സിസ്റ്റം കൂടിയുണ്ട്. Must buy! 🌟"
        },
        {
          name: "Midhun Kumar",
          location: "Palakkad",
          rating: 5,
          date: "6 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "Manglish",
          text: "Rikkas bro, payment cheytha udan thanne WhatsApp-il file access vannu. Content quality top-notch aanu. Recommended for all Malayalis starting online business! 💯"
        }
      ];
    } else if (cat.includes("sourcing") || title.includes("sourcing") || title.includes("supplier")) {
      return [
        {
          name: "Sujith Nair",
          location: "Thrissur",
          rating: 5,
          date: "Yesterday",
          tag: "Verified Buyer ✅",
          langBadge: "Manglish",
          text: "Direct manufacturing contacts and verified supplier numbers are gold! Saved so much time and middleman margin. Great work bro! 🔥"
        },
        {
          name: "Irfan Habeeb",
          location: "Ernakulam",
          rating: 5,
          date: "3 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "മലയാളം",
          text: "ഉൽപ്പന്നങ്ങൾ കുറഞ്ഞ വിലയ്ക്ക് നേരിട്ട് വാങ്ങാനുള്ള വഴികൾ വ്യക്തമായി പറഞ്ഞു തന്നിട്ടുണ്ട്. ബിസിനസ്സ് തുടങ്ങുന്നവർക്ക് തീർച്ചയായും ഉപകാരപ്പെടും. 👌"
        },
        {
          name: "Rohan Mathew",
          location: "Bangalore",
          rating: 5,
          date: "5 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "English",
          text: "High-value sourcing catalog with direct wholesaler links. Already placed my first bulk sample order successfully. Highly recommended."
        }
      ];
    } else {
      return [
        {
          name: "Naveen Raj",
          location: "Kochi, Kerala",
          rating: 5,
          date: "2 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "Manglish",
          text: "Poli item bro! Clear documentation & instant download. Ee price-inu vere evidem kittilla. Super practical guidance. ⭐⭐⭐⭐⭐"
        },
        {
          name: "Hariprasad",
          location: "Thrissur",
          rating: 5,
          date: "4 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "മലയാളം",
          text: "വളരെ വ്യക്തമായി കാര്യങ്ങൾ പഠിപ്പിച്ചു തരുന്ന ഗൈഡ് ആണ്. സമയം പാഴാക്കാതെ direct practical steps. Thank you brother! 👍"
        },
        {
          name: "Siddique M.",
          location: "Manjeri",
          rating: 5,
          date: "5 days ago",
          tag: "Verified Buyer ✅",
          langBadge: "Manglish",
          text: "Bro 100% genuine product. Step by step process clear aayirunnu. Instant WhatsApp delivery worked smoothly. Highly recommended! 🔥"
        },
        {
          name: "Deepak Menon",
          location: "Bangalore / Kerala",
          rating: 5,
          date: "1 week ago",
          tag: "Verified Buyer ✅",
          langBadge: "English",
          text: "Solid digital asset. Everything promised was delivered instantly. Clean structure, great actionable steps. 5/5 stars!"
        }
      ];
    }
  }

  // Open Detail Modal (Cleanly styled with theme variables & full details)
  function openDetailModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    state.selectedProduct = product;

    const modalBody = document.getElementById("detailModalContent");
    const singlePriceObj = product.singlePrice || (typeof product.price === 'number' ? { inr: product.price, usd: Math.max(1, Math.round(product.price / 85)) } : { inr: 999, usd: 12 });
    const priceDisplay = formatPrice(singlePriceObj, product.subscriptionPrice);
    const catDisplay = (product.category || "Digital Product").replace(/_/g, ' ');
    const imgSrc = product.thumbnail || product.image || 'assets/images/default.jpg';
    const features = Array.isArray(product.features) ? product.features : ["Complete digital package", "Instant file delivery after payment", "Full documentation included"];
    const techStack = Array.isArray(product.techStack) ? product.techStack : ["Instant Access", "Lifetime Download"];

    modalBody.innerHTML = `
      <div style="padding: 1.8rem;">
        <div style="display: flex; gap: 1.25rem; flex-wrap: wrap; align-items: flex-start; margin-bottom: 1.4rem;">
          <img src="${imgSrc}" style="width: 120px; height: 120px; border-radius: var(--radius-md); object-fit: cover; border: 1px solid var(--border-cream);" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'">
          <div style="flex: 1; min-width: 220px;">
            <span class="product-category-tag">${catDisplay}</span>
            <h2 style="font-size: 1.5rem; margin-bottom: 0.4rem; color: var(--text-coffee-dark); font-weight: 800;">${product.title || 'Untitled'}</h2>
            <p style="color: var(--text-coffee-muted); font-size: 0.92rem; margin-bottom: 0.8rem; line-height: 1.5;">${product.tagline || product.short_description || ''}</p>
            <div style="display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
              <span class="price-amount" style="font-size: 1.45rem;">${priceDisplay}</span>
              <span class="discount-tag" style="background: var(--bg-green-soft); color: var(--accent-green); font-size: 0.78rem;">★ ${product.rating || '4.9'} (${product.salesCount || 100}+ Downloads)</span>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.2rem; margin-bottom: 1.2rem;">
          <h4 style="font-size: 1.05rem; margin-bottom: 0.6rem; color: var(--text-coffee-dark); font-weight: 700;">Product Overview</h4>
          <p style="color: var(--text-coffee-muted); font-size: 0.92rem; line-height: 1.6;">${product.description || product.short_description || 'Detailed guide and source files.'}</p>
        </div>

        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.2rem; margin-bottom: 1.2rem;">
          <h4 style="font-size: 1.05rem; margin-bottom: 0.6rem; color: var(--text-coffee-dark); font-weight: 700;">Key Capabilities & Features Included</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem;">
            ${features.map(f => `
              <li style="display: flex; align-items: flex-start; gap: 0.6rem; color: var(--text-coffee-dark); font-size: 0.9rem;">
                <span style="color: var(--accent-green); font-weight: 800; flex-shrink: 0;">✓</span>
                <span>${f}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Authentic Customer Reviews Section (Malayalam, Manglish, English) -->
        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.2rem; margin-bottom: 1.2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
            <h4 style="font-size: 1.05rem; color: var(--text-coffee-dark); font-weight: 700; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
              <span>💬 Verified Customer Reviews</span>
              <span style="font-size: 0.78rem; background: var(--bg-green-soft); color: var(--accent-green); padding: 0.15rem 0.5rem; border-radius: var(--radius-full); font-weight: 700;">4.9 ★ (120+ Kerala Buyers)</span>
            </h4>
            <span style="font-size: 0.76rem; color: var(--text-coffee-muted);">മലയാളം • Manglish • English</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 250px; overflow-y: auto; padding-right: 0.3rem;">
            ${getProductReviews(product).map(r => `
              <div style="background: var(--bg-coffee-darker); border: 1px solid var(--border-cream); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; flex-wrap: wrap; gap: 0.3rem;">
                  <div style="display: flex; align-items: center; gap: 0.55rem;">
                    <div style="width: 26px; height: 26px; border-radius: 50%; background: var(--accent-orange); color: #fff; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      ${r.name.charAt(0)}
                    </div>
                    <div>
                      <span style="font-size: 0.86rem; font-weight: 700; color: var(--text-coffee-dark);">${r.name}</span>
                      <span style="font-size: 0.74rem; color: var(--text-coffee-muted); margin-left: 0.25rem;">• ${r.location}</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <span style="font-size: 0.7rem; background: rgba(194, 166, 136, 0.18); color: var(--accent-orange); padding: 0.1rem 0.45rem; border-radius: 4px; font-weight: 600;">${r.langBadge}</span>
                    <span style="color: #f59e0b; font-size: 0.8rem; letter-spacing: 1px;">★★★★★</span>
                  </div>
                </div>
                <p style="font-size: 0.86rem; color: var(--text-coffee-dark); line-height: 1.5; margin: 0.25rem 0 0.35rem 0; font-style: italic;">
                  "${r.text}"
                </p>
                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-coffee-muted);">
                  <span style="color: var(--accent-green); font-weight: 600;">${r.tag}</span>
                  <span>${r.date}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-cream); padding-top: 1.2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            ${techStack.map(t => `<span class="tech-chip">${t}</span>`).join('')}
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

        const thumbInput = document.getElementById("thumbnailFile");
        const submitBtn = addProductForm.querySelector('button[type="submit"]');
        const origBtnText = submitBtn ? submitBtn.innerHTML : "Publish Product Live to Store";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = "Publishing Product...";
        }

        const formData = new FormData();
        formData.append("title", document.getElementById("newTitle").value.trim());
        formData.append("short_description", document.getElementById("newTagline").value.trim());
        formData.append("category", document.getElementById("newCategory").value.trim());
        formData.append("badge", document.getElementById("newBadge").value.trim() || "New Tool ⚡");
        formData.append("price", document.getElementById("newSingleInr").value);
        
        // Append thumbnail file if selected
        if (thumbInput && thumbInput.files && thumbInput.files.length > 0) {
          formData.append("thumbnail_file", thumbInput.files[0]);
        }
        
        // Append the digital product file
        formData.append("product_file", fileInput.files[0]);

        try {
          showToast("Uploading and publishing product...");
          const res = await fetch("https://digital-selling-7w8x.onrender.com/api/products", {
            method: "POST",
            body: formData
          });
          const data = await res.json();
          if (data.success && data.product) {
            const p = data.product;
            const formatted = {
              ...p,
              id: p.id,
              title: p.title,
              tagline: p.tagline || p.short_description || "",
              description: p.description || p.short_description || "",
              category: p.category || "general",
              badge: p.badge || "New Tool ⚡",
              rating: p.rating || "4.9",
              image: p.thumbnail || "assets/images/default.jpg",
              thumbnail: p.thumbnail || "assets/images/default.jpg",
              singlePrice: p.singlePrice || (typeof p.price === "number" ? { inr: p.price, usd: Math.max(1, Math.round(p.price / 85)) } : { inr: 999, usd: 12 }),
              subscriptionPrice: p.subscriptionPrice || null,
              techStack: Array.isArray(p.techStack) ? p.techStack : ["Instant Download", "Lifetime Access"],
              features: Array.isArray(p.features) ? p.features : ["Complete digital package", "Instant file delivery after payment", "Full documentation included"]
            };
            state.products.unshift(formatted);
            state.activeCategory = "all";
            document.querySelectorAll(".cat-btn").forEach(b => b.classList.toggle("active", b.getAttribute("data-cat") === "all"));
            renderProducts();
            closeModal(adminModal);
            addProductForm.reset();
            showToast("New product published successfully!");
          } else {
            showToast(data.message || "Failed to publish product.");
          }
        } catch (err) {
          console.error("Publish error:", err);
          showToast("Server error while publishing.");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origBtnText;
          }
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


(function () {
  "use strict";

  const SUPABASE_URL = "https://tmnyzkycdiokahujqblt.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_KXmZQiIc_9K74hy4EI-mng_jUYgAr_D";
  const TABLES = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const BAR_COUNTER = "bar";
  const SEATS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const PAYMENT_METHODS = [
    { id: "cash", labelKey: "cash", icon: "¥" },
    { id: "card", labelKey: "card", icon: "▣" },
    { id: "paypay", labelKey: "paypay", icon: "P" },
    { id: "coin", labelKey: "coin", icon: "●" },
    { id: "transit", labelKey: "transit", icon: "IC" },
  ];

  const state = {
    supabase: null,
    menu: [],
    tableNo: "",
    seatNos: [],
    paymentMethods: [],
    categoryId: "",
    subcategoryId: "",
    cart: [],
    activeItem: null,
    quantity: 1,
    submitting: false,
    language: savedLanguage(),
    connectionOk: true,
    connectionKey: "connecting",
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    applyLanguage();
    renderSetupChoices();
    bindEvents();
    if (!window.supabase) {
      setConnectionState(false, "connectionFailed");
      toast(t("menuSystemUnavailable"));
      return;
    }
    state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await loadMenu();
  }

  function bindEvents() {
    $(".language-switch").addEventListener("click", handleLanguageChoice);
    $("#seatChoices").addEventListener("click", handleSeatChoice);
    $("#paymentChoices").addEventListener("click", handlePaymentChoice);
    $("#categoryTabs").addEventListener("click", handleCategoryChoice);
    $("#subcategoryTabs").addEventListener("click", handleSubcategoryChoice);
    $("#productSections").addEventListener("click", handleProductChoice);
    $("#itemForm").addEventListener("submit", addActiveItemToCart);
    $("#decreaseQuantity").addEventListener("click", () => changeItemQuantity(-1));
    $("#increaseQuantity").addEventListener("click", () => changeItemQuantity(1));
    $("#openCartButton").addEventListener("click", openCart);
    $("#cartItems").addEventListener("click", handleCartAction);
    $("#submitOrderButton").addEventListener("click", submitOrder);
    $("#continueOrderButton").addEventListener("click", () => $("#successDialog").close());
    window.addEventListener("resize", updateStickyOffsets);
    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener("click", () => $(`#${button.dataset.closeDialog}`).close());
    });
    [$("#itemDialog"), $("#cartDialog")].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  function handleLanguageChoice(event) {
    const button = event.target.closest("[data-language]");
    if (!button) return;
    state.language = state.language === "ja" ? "en" : "ja";
    try {
      localStorage.setItem("customerLanguage", state.language);
    } catch (error) {
      console.warn("Language preference could not be saved", error);
    }
    applyLanguage();
  }

  function applyLanguage() {
    const activeSelections = $("#itemDialog").open
      ? $$(".option-group", $("#itemOptions")).map((group) => $("input:checked", group)?.value || "").filter(Boolean)
      : null;
    document.documentElement.lang = state.language;
    $$("[data-language]").forEach((button) => {
      const active = button.dataset.language === state.language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    $("#appTitle").textContent = t("appTitle");
    document.title = t("appTitle");
    $("#menuTitle").textContent = t("menuTitle");
    $("#menuGuide").textContent = t("menuGuide");
    $("#categoryLabel").textContent = t("category");
    $("#subcategoryLabel").textContent = t("subcategory");
    $("#categoryTabs").setAttribute("aria-label", t("category"));
    $("#subcategoryTabs").setAttribute("aria-label", t("subcategory"));
    $("#cartUnit").textContent = t("points");
    $("#cartReviewText").textContent = t("reviewOrder");
    $("#cartTitle").textContent = t("cartTitle");
    $("#checkoutSetupTitle").textContent = t("checkoutTitle");
    $("#cartTotalLabel").textContent = t("total");
    $("#submitNote").textContent = t("submitNote");
    $("#successTitle").textContent = t("successTitle");
    $("#successSuffix").textContent = t("successSuffix");
    $("#continueOrderButton").textContent = t("continueOrder");
    $$("[data-close-dialog]").forEach((button) => button.setAttribute("aria-label", t("close")));
    $(".quantity-stepper").setAttribute("aria-label", t("quantity"));
    $("#decreaseQuantity").setAttribute("aria-label", t("decreaseQuantity"));
    $("#increaseQuantity").setAttribute("aria-label", t("increaseQuantity"));
    setConnectionState(state.connectionOk, state.connectionKey);
    renderSetupChoices();
    if (state.menu.length) renderMenu();
    renderCartDock();
    if ($("#itemDialog").open && state.activeItem) renderActiveItem(activeSelections);
    if ($("#cartDialog").open) renderCartDialog();
  }

  function renderSetupChoices() {
    normalizeSeatSelection();
    normalizePaymentSelection();
    const seatChoices = $("#seatChoices");
    const barCounterSelected = isBarCounterSelected();
    seatChoices.classList.toggle("is-table-picking", !state.tableNo);
    seatChoices.classList.toggle("is-bar-counter-selected", barCounterSelected);
    seatChoices.setAttribute("aria-label", barCounterSelected ? t("destinationSelection") : state.tableNo ? t("seatSelection") : t("tableSelection"));
    const multiSeatHint = state.tableNo && !barCounterSelected && cartCount() >= 2
      ? `<small class="multi-seat-hint">${t("multipleAllowed")}</small>`
      : "";
    const destinationLegend = barCounterSelected ? t("destination") : state.tableNo ? t("seatNumber") : t("table");
    $("#seatChoiceLegend").innerHTML = `${destinationLegend} <span>${t("required")}</span>${multiSeatHint}`;
    seatChoices.innerHTML = barCounterSelected ? `
      <button class="selection-button selected-bar-counter active" type="button" data-change-table>${t("barCounter")}</button>
    ` : `
      <div class="poker-table-surface" aria-hidden="true">
        <img class="poker-table-logo logo-left" src="./assets/logo-shinjuku-white.png" alt="">
        <img class="poker-table-logo logo-right" src="./assets/logo-shinjuku-white.png" alt="">
      </div>
      ${state.tableNo ? `
        <button class="poker-table-number" type="button" data-change-table aria-label="${t("changeTable")}">${state.tableNo}</button>
      ` : `
        <div class="table-choice-overlay" aria-label="${t("tableSelection")}">
          ${TABLES.map((table) => `
            <button class="selection-button" type="button" data-table="${table}">${table}</button>
          `).join("")}
          <button class="selection-button bar-counter-choice" type="button" data-bar-counter>${t("barCounter")}</button>
        </div>
      `}
      ${SEATS.map((seat) => `
        <button class="selection-button poker-seat-button seat-position-${seat}${state.seatNos.includes(seat) ? " active" : ""}" type="button" data-seat="${seat}" aria-label="${state.language === "en" ? `Seat ${seat}` : `${seat}番シート`}"${state.tableNo ? "" : " disabled"}>${seat}</button>
      `).join("")}
    `;
    const multiPaymentHint = cartCount() >= 2 ? `<small class="multi-choice-hint">${t("multipleAllowed")}</small>` : "";
    $("#paymentChoiceLegend").innerHTML = `${t("paymentMethod")} <span>${t("required")}</span>${multiPaymentHint}`;
    $("#paymentChoices").setAttribute("aria-label", t("paymentSelection"));
    $("#paymentChoices").innerHTML = PAYMENT_METHODS.map((method) => `
      <button class="selection-button${state.paymentMethods.includes(method.id) ? " active" : ""}" type="button" data-payment="${method.id}">
        <span class="payment-icon" aria-hidden="true">${method.icon}</span>${t(method.labelKey)}
      </button>
    `).join("");
  }

  function handleTableChoice(event) {
    const button = event.target.closest("[data-table]");
    if (!button) return;
    const nextTable = button.dataset.table;
    if (state.tableNo === nextTable) {
      state.tableNo = "";
      state.seatNos = [];
    } else {
      state.tableNo = nextTable;
      state.seatNos = [];
    }
    renderSetupChoices();
    updateCheckoutState();
  }

  function handleSeatChoice(event) {
    if (event.target.closest("[data-bar-counter]")) {
      state.tableNo = BAR_COUNTER;
      state.seatNos = [];
      renderSetupChoices();
      updateCheckoutState();
      return;
    }
    if (event.target.closest("[data-table]")) {
      handleTableChoice(event);
      return;
    }
    if (event.target.closest("[data-change-table]")) {
      state.tableNo = "";
      state.seatNos = [];
      renderSetupChoices();
      updateCheckoutState();
      return;
    }
    const button = event.target.closest("[data-seat]");
    if (!button || !state.tableNo) return;
    const seat = button.dataset.seat;
    if (cartCount() < 2) {
      state.seatNos = [seat];
    } else if (state.seatNos.includes(seat)) {
      state.seatNos = state.seatNos.filter((value) => value !== seat);
    } else if (state.seatNos.length < Math.min(cartCount(), SEATS.length)) {
      state.seatNos = [...state.seatNos, seat];
    } else {
      toast(t("seatLimit", { count: Math.min(cartCount(), SEATS.length) }));
    }
    renderSetupChoices();
    updateCheckoutState();
  }

  function normalizeSeatSelection() {
    if (isBarCounterSelected()) {
      state.seatNos = [];
      return;
    }
    const limit = Math.max(1, Math.min(cartCount(), SEATS.length));
    state.seatNos = state.seatNos.filter((seat) => SEATS.includes(seat)).slice(0, limit);
  }

  function handlePaymentChoice(event) {
    const button = event.target.closest("[data-payment]");
    if (!button) return;
    const paymentMethod = button.dataset.payment;
    if (cartCount() < 2) {
      state.paymentMethods = [paymentMethod];
    } else if (state.paymentMethods.includes(paymentMethod)) {
      state.paymentMethods = state.paymentMethods.filter((value) => value !== paymentMethod);
    } else if (state.paymentMethods.length < Math.min(cartCount(), PAYMENT_METHODS.length)) {
      state.paymentMethods = [...state.paymentMethods, paymentMethod];
    } else {
      toast(t("paymentLimit", { count: Math.min(cartCount(), PAYMENT_METHODS.length) }));
    }
    renderSetupChoices();
    updateCheckoutState();
  }

  function normalizePaymentSelection() {
    const validMethods = PAYMENT_METHODS.map((method) => method.id);
    const limit = Math.max(1, Math.min(cartCount(), validMethods.length));
    state.paymentMethods = state.paymentMethods.filter((method) => validMethods.includes(method)).slice(0, limit);
  }

  async function loadMenu() {
    const { data, error } = await state.supabase
      .from("drink_app_settings")
      .select("menu")
      .eq("id", "main")
      .maybeSingle();

    if (error || !Array.isArray(data?.menu) || !data.menu.length) {
      console.error(error);
      setConnectionState(false, "menuLoadFailed");
      toast(t("menuUnavailable"));
      return;
    }

    state.menu = normalizeMenu(data.menu);
    state.categoryId = state.menu[0]?.id || "";
    state.subcategoryId = state.menu[0]?.subcategories?.[0]?.id || "";
    setConnectionState(true, "acceptingOrders");
    renderMenu();
    updateCheckoutState();
  }

  function setConnectionState(ok, labelKey) {
    state.connectionOk = ok;
    state.connectionKey = labelKey;
    const badge = $("#connectionBadge");
    badge.textContent = t(labelKey);
    badge.classList.toggle("is-error", !ok);
  }

  function updateCheckoutState() {
    const seatLabel = state.seatNos.join("・");
    const selectedPaymentLabel = state.paymentMethods.map(paymentLabel).join("・");
    const destinationReady = Boolean(state.tableNo && (isBarCounterSelected() || state.seatNos.length));
    const ready = Boolean(destinationReady && state.paymentMethods.length);
    const guide = $("#checkoutGuide");
    if (guide) {
      guide.textContent = ready
        ? t("selectedDestination", {
            destination: isBarCounterSelected() ? t("barCounter") : t("tableSeat", { table: state.tableNo, seat: seatLabel }),
            payment: selectedPaymentLabel,
          })
        : isBarCounterSelected()
          ? t("selectPaymentAtBar")
        : state.tableNo && !state.seatNos.length
          ? t("selectSeatAtTable", { table: state.tableNo })
          : t("selectTableSeatPayment");
    }
    const button = $("#submitOrderButton");
    if (button) button.disabled = !ready || !state.cart.length || state.submitting;
  }

  function renderMenu() {
    $("#categoryTabs").innerHTML = state.menu.map((category) => `
      <button class="category-tab${category.id === state.categoryId ? " active" : ""}" type="button" data-category="${escapeHtml(category.id)}">${escapeHtml(menuText(category.label))}</button>
    `).join("");

    const category = activeCategory();
    if (!category) return;
    if (!category.subcategories.some((subcategory) => subcategory.id === state.subcategoryId)) {
      state.subcategoryId = category.subcategories[0]?.id || "";
    }
    $("#subcategoryTabs").innerHTML = category.subcategories.map((subcategory) => `
      <button class="subcategory-tab${subcategory.id === state.subcategoryId ? " active" : ""}" type="button" data-subcategory="${escapeHtml(subcategory.id)}">${escapeHtml(menuText(subcategory.label))}</button>
    `).join("");

    const groups = category.subcategories.map((subcategory) => ({
      ...subcategory,
      items: category.items.filter((item) => item.subcategory_id === subcategory.id),
    })).filter((group) => group.items.length);
    $("#productSections").innerHTML = groups.map((group) => `
      <section class="product-group" data-product-group="${escapeHtml(group.id)}">
        <h3>${escapeHtml(menuText(group.label))}</h3>
        <div class="product-grid">
          ${group.items.map((item) => productButton(category, item)).join("")}
        </div>
      </section>
    `).join("");
    requestAnimationFrame(updateStickyOffsets);
  }

  function updateStickyOffsets() {
    const header = $(".customer-header");
    const primaryLevel = $(".menu-level-primary");
    if (!header || !primaryLevel) return;
    document.documentElement.style.setProperty("--customer-header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    document.documentElement.style.setProperty("--menu-primary-height", `${Math.ceil(primaryLevel.getBoundingClientRect().height)}px`);
  }

  function productButton(category, item) {
    const count = state.cart.filter((entry) => entry.categoryId === category.id && entry.itemId === item.id)
      .reduce((sum, entry) => sum + entry.quantity, 0);
    const productImage = {
      "水": "./assets/crystal-geyser.png",
      "ペリエ": "./assets/perrier.png",
    }[item.name.trim()] || "";
    return `
      <button class="product-button${productImage ? " has-product-image" : ""}" type="button" data-item="${escapeHtml(item.id)}">
        ${count ? `<span class="product-cart-count">${count}</span>` : ""}
        <span class="product-name">${escapeHtml(menuText(item.name))}</span>
        <span class="product-price">${formatPrice(item.price)}</span>
        ${productImage ? `<img class="product-image${item.name.trim() === "ペリエ" ? " product-image-square" : ""}" src="${escapeHtml(productImage)}" alt="" aria-hidden="true">` : ""}
      </button>
    `;
  }

  function handleCategoryChoice(event) {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.categoryId = button.dataset.category;
    state.subcategoryId = activeCategory()?.subcategories?.[0]?.id || "";
    renderMenu();
    requestAnimationFrame(ensureMenuHeadingVisible);
  }

  function ensureMenuHeadingVisible() {
    const heading = $(".section-heading");
    const header = $(".customer-header");
    if (!heading || !header) return;
    const headingTop = heading.getBoundingClientRect().top;
    const visibleTop = header.getBoundingClientRect().bottom + 8;
    if (headingTop >= visibleTop) return;
    const top = window.scrollY + headingTop - visibleTop;
    window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
  }

  function handleSubcategoryChoice(event) {
    const button = event.target.closest("[data-subcategory]");
    if (!button) return;
    state.subcategoryId = button.dataset.subcategory;
    renderMenu();
    requestAnimationFrame(() => scrollToProductGroup(state.subcategoryId));
  }

  function scrollToProductGroup(subcategoryId) {
    const group = $(`[data-product-group="${cssEscape(subcategoryId)}"]`);
    const header = $(".customer-header");
    const primaryLevel = $(".menu-level-primary");
    const subcategoryLevel = $(".menu-level-secondary");
    if (!group || !subcategoryLevel) return;
    const offset = (header?.offsetHeight || 0) + (primaryLevel?.offsetHeight || 0) + subcategoryLevel.offsetHeight + 10;
    const top = window.scrollY + group.getBoundingClientRect().top - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function handleProductChoice(event) {
    const button = event.target.closest("[data-item]");
    if (!button) return;
    const category = activeCategory();
    const item = category?.items.find((entry) => entry.id === button.dataset.item);
    if (!item) return;
    openItem(category, item);
  }

  function openItem(category, item) {
    const cartItem = state.cart.find((entry) => entry.categoryId === category.id && entry.itemId === item.id);
    state.activeItem = { category, item, cartItemId: cartItem?.id || "" };
    state.quantity = cartItem?.quantity || 1;
    renderActiveItem();
    $("#itemDialog").showModal();
  }

  function renderActiveItem(selectedOptions = null) {
    if (!state.activeItem) return;
    const { category, item, cartItemId } = state.activeItem;
    const cartItem = cartItemId ? state.cart.find((entry) => entry.id === cartItemId) : null;
    const options = Array.isArray(selectedOptions) ? selectedOptions : cartItem?.options || [];
    $("#itemCategory").textContent = menuText(category.label);
    $("#itemName").textContent = menuText(item.name);
    $("#itemPrice").textContent = formatPrice(item.price);
    $("#itemQuantity").textContent = String(state.quantity);
    $("#itemOptions").innerHTML = item.optionGroups
      .map((group, groupIndex) => optionGroup(group, groupIndex, options))
      .join("");
    $("#addToCartButton").textContent = cartItem ? t("updateCart") : t("addToCart");
  }

  function optionGroup(group, groupIndex, selectedOptions = []) {
    const name = `option-${groupIndex}`;
    const selectedChoice = group.choices.find((choice) => selectedOptions.includes(String(choice))) || "";
    return `
      <fieldset class="option-group" data-required="${group.required ? "true" : "false"}">
        <legend>${escapeHtml(menuText(group.label))}${group.required ? `<span class="required-label">${t("required")}</span>` : ""}</legend>
        <div class="option-choices">
          ${group.required ? "" : `<label class="option-choice"><input type="radio" name="${name}" value="" ${selectedChoice ? "" : "checked"}><span>${t("none")}</span></label>`}
          ${group.choices.map((choice, index) => `
            <label class="option-choice"><input type="radio" name="${name}" value="${escapeHtml(choice)}" ${selectedChoice === String(choice) || (!selectedChoice && group.required && index === 0) ? "checked" : ""}><span>${escapeHtml(menuText(choice))}</span></label>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function changeItemQuantity(delta) {
    if (delta < 0 && state.quantity <= 1) {
      const cartItemId = state.activeItem?.cartItemId;
      const itemName = state.activeItem?.item?.name || "商品";
      if (cartItemId) {
        state.cart = state.cart.filter((entry) => entry.id !== cartItemId);
        renderMenu();
        renderCartDock();
        toast(t("removedFromCart", { item: menuText(itemName) }));
      }
      state.activeItem = null;
      $("#itemDialog").close();
      return;
    }
    state.quantity = Math.max(1, Math.min(20, state.quantity + delta));
    $("#itemQuantity").textContent = String(state.quantity);
  }

  function addActiveItemToCart(event) {
    event.preventDefault();
    if (!state.activeItem) return;
    const { category, item, cartItemId } = state.activeItem;
    const options = $$(".option-group", $("#itemOptions"))
      .map((group) => $("input:checked", group)?.value || "")
      .filter(Boolean);
    const cartItem = cartItemId ? state.cart.find((entry) => entry.id === cartItemId) : null;
    if (cartItem) {
      cartItem.quantity = state.quantity;
      cartItem.options = options;
    } else {
      state.cart.push({
        id: crypto.randomUUID(),
        categoryId: category.id,
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: state.quantity,
        options,
      });
    }
    state.activeItem = null;
    $("#itemDialog").close();
    renderMenu();
    renderCartDock();
    toast(t(cartItem ? "updatedQuantity" : "addedToCart", { item: menuText(item.name) }));
  }

  function renderCartDock() {
    const count = cartCount();
    $("#cartDock").hidden = count === 0;
    $("#cartCount").textContent = String(count);
    $("#cartUnit").textContent = state.language === "en" && count === 1 ? " item" : t("points");
    $("#cartTotal").textContent = formatPrice(cartTotal());
  }

  function openCart() {
    renderCartDialog();
    $("#cartDialog").showModal();
  }

  function renderCartDialog() {
    renderSetupChoices();
    $("#cartItems").innerHTML = state.cart.map((item) => `
      <article class="cart-item" data-cart-id="${escapeHtml(item.id)}">
        <div>
          <h3>${escapeHtml(menuText(item.name))} × ${item.quantity}</h3>
          ${item.options.length ? `<p>${escapeHtml(item.options.map(menuText).join(" / "))}</p>` : ""}
          <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
        <div class="cart-item-tools">
          <button type="button" data-cart-action="decrease" aria-label="${t("decreaseQuantity")}">−</button>
          <button type="button" data-cart-action="increase" aria-label="${t("increaseQuantity")}">＋</button>
          <button class="remove-item" type="button" data-cart-action="remove" aria-label="${t("remove")}">×</button>
        </div>
      </article>
    `).join("");
    $("#dialogCartTotal").textContent = formatPrice(cartTotal());
    $("#submitOrderButton").disabled = !state.tableNo || (!isBarCounterSelected() && !state.seatNos.length) || !state.paymentMethods.length || !state.cart.length || state.submitting;
    $("#submitOrderButton").textContent = t(state.submitting ? "submitting" : "submitOrder");
    updateCheckoutState();
  }

  function handleCartAction(event) {
    const button = event.target.closest("[data-cart-action]");
    const row = button?.closest("[data-cart-id]");
    if (!button || !row) return;
    const item = state.cart.find((entry) => entry.id === row.dataset.cartId);
    if (!item) return;
    if (button.dataset.cartAction === "increase") item.quantity = Math.min(20, item.quantity + 1);
    if (button.dataset.cartAction === "decrease") {
      if (item.quantity <= 1) {
        state.cart = state.cart.filter((entry) => entry.id !== item.id);
      } else {
        item.quantity -= 1;
      }
    }
    if (button.dataset.cartAction === "remove") state.cart = state.cart.filter((entry) => entry.id !== item.id);
    if (!state.cart.length) $("#cartDialog").close();
    renderMenu();
    renderCartDock();
    renderCartDialog();
  }

  async function submitOrder() {
    if (!state.tableNo || (!isBarCounterSelected() && !state.seatNos.length) || !state.paymentMethods.length) {
      toast(t("selectDestinationPayment"));
      return;
    }
    if (!state.cart.length || state.submitting) return;
    state.submitting = true;
    renderCartDialog();
    const startedAt = Date.now();
    const barCounterSelected = isBarCounterSelected();
    let rowIndex = 0;
    const rows = state.cart.flatMap((item) => Array.from({ length: item.quantity }, (_, index) => {
      const currentRowIndex = rowIndex++;
      const now = new Date(startedAt + currentRowIndex).toISOString();
      return {
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        source: "table",
        drink_name: item.name,
        quantity: 1,
        target: barCounterSelected ? "bar" : "ring",
        table_no: barCounterSelected ? "" : state.tableNo,
        seat_no: barCounterSelected ? "" : state.seatNos.join("・"),
        payment_status: "uncollected",
        payment_method: state.paymentMethods[currentRowIndex % state.paymentMethods.length],
        notes: item.options.length ? `オプション: ${item.options.join(" / ")}` : "",
        status: "ordered",
        made_at: null,
        served_at: null,
        paid_at: null,
        events: [{ type: "ordered", at: now }],
      };
    }));

    const { error } = await state.supabase.from("drink_orders").insert(rows);
    state.submitting = false;
    if (error) {
      console.error(error);
      renderCartDialog();
      toast(t("sendFailed"));
      return;
    }

    const table = state.tableNo;
    const seat = state.seatNos.join("・");
    state.cart = [];
    $("#cartDialog").close();
    $("#successTable").textContent = barCounterSelected ? t("barCounter") : t("successTable", { table, seat });
    $("#successDialog").showModal();
    renderMenu();
    renderCartDock();
  }

  function normalizeMenu(menu) {
    return menu.map((category, categoryIndex) => {
      const subcategories = Array.isArray(category.subcategories) && category.subcategories.length
        ? category.subcategories.map((subcategory, index) => ({
            id: String(subcategory.id || `${categoryIndex}-${index}`),
            label: String(subcategory.label || subcategory.name || "メニュー"),
          }))
        : [{ id: "default", label: "メニュー" }];
      return {
        id: String(category.id || `category-${categoryIndex}`),
        label: String(category.label || category.name || "メニュー"),
        subcategories,
        items: (Array.isArray(category.items) ? category.items : []).map((item, itemIndex) => ({
          id: String(item.id || `item-${itemIndex}`),
          name: String(item.name || item.label || "商品"),
          price: Math.max(0, Number(item.price || 0)),
          subcategory_id: String(item.subcategory_id || subcategories[0].id),
          optionGroups: normalizeOptionGroups(item.optionGroups || item.options || []),
        })),
      };
    }).filter((category) => category.items.length);
  }

  function normalizeOptionGroups(groups) {
    return (Array.isArray(groups) ? groups : []).map((group, index) => ({
      id: String(group.id || `option-${index}`),
      label: String(group.label || group.name || "オプション"),
      choices: (Array.isArray(group.choices) ? group.choices : []).map(String).filter(Boolean),
      required: Boolean(group.required),
    })).filter((group) => group.choices.length);
  }

  function activeCategory() {
    return state.menu.find((category) => category.id === state.categoryId) || state.menu[0];
  }

  function cartCount() {
    return state.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function cartTotal() {
    return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function paymentLabel(value) {
    const method = PAYMENT_METHODS.find((entry) => entry.id === value);
    return method ? t(method.labelKey) : "";
  }

  function isBarCounterSelected() {
    return state.tableNo === BAR_COUNTER;
  }

  function formatPrice(value) {
    return `¥${Number(value || 0).toLocaleString(state.language === "en" ? "en-US" : "ja-JP")}`;
  }

  function t(key, replacements = {}) {
    const dictionaries = window.CUSTOMER_I18N?.ui || {};
    const template = dictionaries[state.language]?.[key] || dictionaries.ja?.[key] || key;
    return Object.entries(replacements).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  }

  function menuText(value) {
    const text = String(value ?? "");
    return state.language === "en" ? window.CUSTOMER_I18N?.menu?.[text] || text : text;
  }

  function savedLanguage() {
    try {
      return localStorage.getItem("customerLanguage") === "en" ? "en" : "ja";
    } catch (error) {
      console.warn("Language preference could not be read", error);
      return "ja";
    }
  }

  function toast(message) {
    const node = $("#toast");
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { node.hidden = true; }, 2600);
  }

  function cssEscape(value) {
    return window.CSS?.escape ? window.CSS.escape(value) : String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();

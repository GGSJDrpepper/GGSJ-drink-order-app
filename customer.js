(function () {
  "use strict";

  const SUPABASE_URL = "https://tmnyzkycdiokahujqblt.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_KXmZQiIc_9K74hy4EI-mng_jUYgAr_D";
  const TABLES = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const SEATS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const PAYMENT_METHODS = [
    { id: "cash", label: "現金", icon: "¥" },
    { id: "card", label: "カード端末", icon: "▣" },
    { id: "paypay", label: "PayPay", icon: "P" },
    { id: "coin", label: "コイン", icon: "●" },
    { id: "transit", label: "交通系", icon: "IC" },
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
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    renderSetupChoices();
    bindEvents();
    if (!window.supabase) {
      setConnectionState(false, "接続できません");
      toast("注文システムを読み込めませんでした");
      return;
    }
    state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await loadMenu();
  }

  function bindEvents() {
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
    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener("click", () => $(`#${button.dataset.closeDialog}`).close());
    });
    [$("#itemDialog"), $("#cartDialog")].forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  function renderSetupChoices() {
    normalizeSeatSelection();
    normalizePaymentSelection();
    const seatChoices = $("#seatChoices");
    seatChoices.classList.toggle("is-table-picking", !state.tableNo);
    seatChoices.setAttribute("aria-label", state.tableNo ? "シート番号選択" : "テーブル選択");
    const multiSeatHint = state.tableNo && cartCount() >= 2
      ? '<small class="multi-seat-hint">複数選択可</small>'
      : "";
    $("#seatChoiceLegend").innerHTML = `${state.tableNo ? "シート番号" : "テーブル"} <span>必須</span>${multiSeatHint}`;
    seatChoices.innerHTML = `
      <div class="poker-table-surface" aria-hidden="true">
        <img class="poker-table-logo logo-left" src="./assets/logo-shinjuku.png" alt="">
        <img class="poker-table-logo logo-right" src="./assets/logo-shinjuku.png" alt="">
      </div>
      ${state.tableNo ? `
        <button class="poker-table-number" type="button" data-change-table aria-label="テーブルを変更">${state.tableNo}</button>
      ` : `
        <div class="table-choice-overlay" aria-label="テーブル選択">
          ${TABLES.map((table) => `
            <button class="selection-button" type="button" data-table="${table}">${table}</button>
          `).join("")}
        </div>
      `}
      ${SEATS.map((seat) => `
        <button class="selection-button poker-seat-button seat-position-${seat}${state.seatNos.includes(seat) ? " active" : ""}" type="button" data-seat="${seat}" aria-label="${seat}番シート"${state.tableNo ? "" : " disabled"}>${seat}</button>
      `).join("")}
    `;
    const multiPaymentHint = cartCount() >= 2 ? '<small class="multi-choice-hint">複数選択可</small>' : "";
    $("#paymentChoiceLegend").innerHTML = `お支払い方法 <span>必須</span>${multiPaymentHint}`;
    $("#paymentChoices").innerHTML = PAYMENT_METHODS.map((method) => `
      <button class="selection-button${state.paymentMethods.includes(method.id) ? " active" : ""}" type="button" data-payment="${method.id}">
        <span class="payment-icon" aria-hidden="true">${method.icon}</span>${method.label}
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
      toast(`シートは注文数の${Math.min(cartCount(), SEATS.length)}席まで選択できます`);
    }
    renderSetupChoices();
    updateCheckoutState();
  }

  function normalizeSeatSelection() {
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
      toast(`お支払い方法は注文数の${Math.min(cartCount(), PAYMENT_METHODS.length)}種類まで選択できます`);
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
      setConnectionState(false, "メニュー取得失敗");
      toast("メニューを読み込めませんでした。スタッフへお声がけください");
      return;
    }

    state.menu = normalizeMenu(data.menu);
    state.categoryId = state.menu[0]?.id || "";
    state.subcategoryId = state.menu[0]?.subcategories?.[0]?.id || "";
    setConnectionState(true, "注文受付中");
    renderMenu();
    updateCheckoutState();
  }

  function setConnectionState(ok, label) {
    const badge = $("#connectionBadge");
    badge.textContent = label;
    badge.classList.toggle("is-error", !ok);
  }

  function updateCheckoutState() {
    const seatLabel = state.seatNos.join("・");
    const selectedPaymentLabel = state.paymentMethods.map(paymentLabel).join("・");
    const ready = Boolean(state.tableNo && state.seatNos.length && state.paymentMethods.length);
    const guide = $("#checkoutGuide");
    if (guide) {
      guide.textContent = ready
        ? `${state.tableNo}テーブル・${seatLabel}番シート・${selectedPaymentLabel}`
        : state.tableNo && !state.seatNos.length
          ? `${state.tableNo}テーブルを選択中・シート番号を選択してください`
          : "テーブル、シート番号、お支払い方法を選択してください";
    }
    const button = $("#submitOrderButton");
    if (button) button.disabled = !ready || !state.cart.length || state.submitting;
  }

  function renderMenu() {
    $("#categoryTabs").innerHTML = state.menu.map((category) => `
      <button class="category-tab${category.id === state.categoryId ? " active" : ""}" type="button" data-category="${escapeHtml(category.id)}">${escapeHtml(category.label)}</button>
    `).join("");

    const category = activeCategory();
    if (!category) return;
    if (!category.subcategories.some((subcategory) => subcategory.id === state.subcategoryId)) {
      state.subcategoryId = category.subcategories[0]?.id || "";
    }
    $("#subcategoryTabs").innerHTML = category.subcategories.map((subcategory) => `
      <button class="subcategory-tab${subcategory.id === state.subcategoryId ? " active" : ""}" type="button" data-subcategory="${escapeHtml(subcategory.id)}">${escapeHtml(subcategory.label)}</button>
    `).join("");

    const groups = category.subcategories.map((subcategory) => ({
      ...subcategory,
      items: category.items.filter((item) => item.subcategory_id === subcategory.id),
    })).filter((group) => group.items.length);
    $("#productSections").innerHTML = groups.map((group) => `
      <section class="product-group" data-product-group="${escapeHtml(group.id)}">
        <h3>${escapeHtml(group.label)}</h3>
        <div class="product-grid">
          ${group.items.map((item) => productButton(category, item)).join("")}
        </div>
      </section>
    `).join("");
  }

  function productButton(category, item) {
    const count = state.cart.filter((entry) => entry.categoryId === category.id && entry.itemId === item.id)
      .reduce((sum, entry) => sum + entry.quantity, 0);
    return `
      <button class="product-button" type="button" data-item="${escapeHtml(item.id)}">
        ${count ? `<span class="product-cart-count">${count}</span>` : ""}
        <span class="product-name">${escapeHtml(item.name)}</span>
        <span class="product-price">${formatPrice(item.price)}</span>
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
    const subcategoryLevel = $(".menu-level-secondary");
    if (!group || !subcategoryLevel) return;
    const offset = (header?.offsetHeight || 0) + subcategoryLevel.offsetHeight + 10;
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
    state.activeItem = { category, item };
    state.quantity = 1;
    $("#itemCategory").textContent = category.label;
    $("#itemName").textContent = item.name;
    $("#itemPrice").textContent = formatPrice(item.price);
    $("#itemQuantity").textContent = "1";
    $("#itemOptions").innerHTML = item.optionGroups.map((group, groupIndex) => optionGroup(group, groupIndex)).join("");
    $("#itemDialog").showModal();
  }

  function optionGroup(group, groupIndex) {
    const name = `option-${groupIndex}`;
    return `
      <fieldset class="option-group" data-required="${group.required ? "true" : "false"}">
        <legend>${escapeHtml(group.label)}${group.required ? '<span class="required-label">必須</span>' : ""}</legend>
        <div class="option-choices">
          ${group.required ? "" : `<label class="option-choice"><input type="radio" name="${name}" value="" checked><span>指定なし</span></label>`}
          ${group.choices.map((choice, index) => `
            <label class="option-choice"><input type="radio" name="${name}" value="${escapeHtml(choice)}" ${group.required && index === 0 ? "checked" : ""}><span>${escapeHtml(choice)}</span></label>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function changeItemQuantity(delta) {
    if (delta < 0 && state.quantity <= 1) {
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
    const { category, item } = state.activeItem;
    const options = $$(".option-group", $("#itemOptions"))
      .map((group) => $("input:checked", group)?.value || "")
      .filter(Boolean);
    state.cart.push({
      id: crypto.randomUUID(),
      categoryId: category.id,
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: state.quantity,
      options,
    });
    $("#itemDialog").close();
    renderMenu();
    renderCartDock();
    toast(`${item.name}をカートに追加しました`);
  }

  function renderCartDock() {
    const count = cartCount();
    $("#cartDock").hidden = count === 0;
    $("#cartCount").textContent = String(count);
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
          <h3>${escapeHtml(item.name)} × ${item.quantity}</h3>
          ${item.options.length ? `<p>${escapeHtml(item.options.join(" / "))}</p>` : ""}
          <span>${formatPrice(item.price * item.quantity)}</span>
        </div>
        <div class="cart-item-tools">
          <button type="button" data-cart-action="decrease" aria-label="数量を減らす">−</button>
          <button type="button" data-cart-action="increase" aria-label="数量を増やす">＋</button>
          <button class="remove-item" type="button" data-cart-action="remove" aria-label="削除">×</button>
        </div>
      </article>
    `).join("");
    $("#dialogCartTotal").textContent = formatPrice(cartTotal());
    $("#submitOrderButton").disabled = !state.tableNo || !state.seatNos.length || !state.paymentMethods.length || !state.cart.length || state.submitting;
    $("#submitOrderButton").textContent = state.submitting ? "送信中..." : "この内容で注文する";
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
    if (!state.tableNo || !state.seatNos.length || !state.paymentMethods.length) {
      toast("テーブル、シート番号、お支払い方法を選択してください");
      return;
    }
    if (!state.cart.length || state.submitting) return;
    state.submitting = true;
    renderCartDialog();
    const startedAt = Date.now();
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
        target: "ring",
        table_no: state.tableNo,
        seat_no: state.seatNos.join("・"),
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
      toast("送信できませんでした。通信状態を確認してください");
      return;
    }

    const table = state.tableNo;
    const seat = state.seatNos.join("・");
    state.cart = [];
    $("#cartDialog").close();
    $("#successTable").textContent = `${table}テーブル ${seat}番シート`;
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
    return PAYMENT_METHODS.find((method) => method.id === value)?.label || "";
  }

  function formatPrice(value) {
    return `¥${Number(value || 0).toLocaleString("ja-JP")}`;
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

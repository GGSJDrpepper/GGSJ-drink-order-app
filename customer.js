(function () {
  "use strict";

  const SUPABASE_URL = "https://tmnyzkycdiokahujqblt.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_KXmZQiIc_9K74hy4EI-mng_jUYgAr_D";
  const TABLES = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const BAR_COUNTER = "bar";
  const APPLICATIONS_CATEGORY_ID = "applications";
  const CAST_CATEGORY_ID = "cast-drink";
  const CAST_SHEET_ID = "16_UQYWtL1wGHUUuGfK6HbSsaG5sl7x9T_LOxIJWUbEU";
  const CAST_ROSTER_RANGE = "B50:B75";
  const CAST_STORAGE_TARGET = "tournament";
  const CAST_STORAGE_SEAT = "__cast__";
  const SEATS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const PAYMENT_METHODS = [
    { id: "cash", labelKey: "cash", icon: "¥" },
    { id: "card", labelKey: "card", icon: "▣" },
    { id: "paypay", labelKey: "paypay", icon: "P" },
    { id: "coin", labelKey: "coin", icon: "●" },
    { id: "transit", labelKey: "transit", icon: "IC" },
  ];
  const APPLICATION_LINKS = [
    { label: "①競技結果申請フォーム", href: "https://docs.google.com/forms/d/e/1FAIpQLSdVap9LAD022FRGOHfzync_6-soLtHFtqsV0ayfjuh4sBZmEg/viewform", image: "./assets/application-results.svg" },
    { label: "②JG Free権利申請", note: "※初回のみ要登録", href: "https://miniapp.line.me/2011431861-jUMUxBv5?store=ggplsj&qr=QR-261001-A58B54C53A70C08C&st=9e94d11a422ee117ae5cf6c8daf6e1038c9fdafc9b40f4bf0e1cadb903d65ec6", image: "./assets/application-jg-free.png" },
    { label: "③ポーカーギルド選手契約", note: "※初回のみ要登録", href: "https://pokerguild-contract.com/ja/", image: "./assets/application-pokerguild.png" },
    { label: "④メニュー表", href: "https://lit.link/ggpldrink", image: "./assets/application-menu.svg" },
    { label: "⑤GGPL新宿各種SNSのご案内", href: "https://lit.link/ggplsns", image: "./assets/application-sns.jpg" },
    { label: "⑥本日のトーナメント情報", href: "https://beta.pokerguild.jp/room?no=4", image: "./assets/application-tournament.jpg" },
  ];
  const GAME_ID_NOTICE = `【個人認証（eKYC）導入とトランスファー手数料の変更】

2025年7月24日（木）午前1時 より、プレイヤー会員アプリ「GameID」に登録された情報が、身分証の情報や写真と一致しているかを確認する個人認証（eKYC）を導入されています。

2025年8月1日（金）午前1時 より、個人認証を行っていないGameIDアカウントは、以下の操作が制限されます。

・店舗へのコイン送信
・プレイヤーへのコイン送信
・プレイヤーからのコイン受信

個人認証は以下のブラウザからのみ行うことができます

iPhone：Safari Android：Chrome 認証が完了すると、GameID上のアイコンは本人の顔写真に切り替わります。

これにより、そのGameIDが本人のものであることが明示され、年齢（未成年かどうか）や国籍の確認、選手契約内容との照合が可能になります。

また、2025年8月1日（金）から、プレイヤー同士のトランスファー手数料は、これまでの3％から5％に変更させていただきます。`;

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
    castNames: [],
    selectedCastName: "",
    castRosterDate: "",
    castRosterLoading: false,
    castRosterError: false,
    castRosterRequest: 0,
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
    state.language = button.dataset.language === "en" ? "en" : "ja";
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
    const initialCategory = state.menu.find((category) => category.id === "soft" || category.label === "ソフトドリンク") || state.menu[0];
    state.categoryId = initialCategory?.id || "";
    state.subcategoryId = initialCategory?.subcategories[0]?.id || "";
    setConnectionState(true, "acceptingOrders");
    renderMenu();
    updateCheckoutState();
  }

  function currentCastSheetName() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
    }).formatToParts(new Date());
    const month = parts.find((part) => part.type === "month")?.value || "";
    const day = parts.find((part) => part.type === "day")?.value || "";
    return `${month}/${day}`;
  }

  function loadCastNames() {
    const requestId = ++state.castRosterRequest;
    const sheetName = currentCastSheetName();
    const callbackName = `__castRoster${Date.now()}${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => finish(null), 10000);
    let completed = false;

    state.castRosterLoading = true;
    state.castRosterError = false;
    state.castRosterDate = sheetName;
    if (state.categoryId === CAST_CATEGORY_ID) renderMenu();

    function cleanup() {
      window.clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    }

    function finish(response) {
      if (completed) return;
      completed = true;
      if (requestId !== state.castRosterRequest) {
        cleanup();
        return;
      }
      const values = response?.status === "ok"
        ? (response.table?.rows || []).map((row) => String(row.c?.[0]?.f ?? row.c?.[0]?.v ?? "").trim()).filter(Boolean)
        : [];
      const start = values.indexOf("出勤中のキャスト");
      const end = values.indexOf("卓稼働時間", start + 1);
      const names = start >= 0 ? values.slice(start + 1, end >= 0 ? end : values.length) : [];
      state.castNames = [...new Set(names)];
      state.castRosterLoading = false;
      state.castRosterError = !state.castNames.length;
      if (!state.castNames.includes(state.selectedCastName)) state.selectedCastName = "";
      cleanup();
      if (state.categoryId === CAST_CATEGORY_ID) renderMenu();
    }

    window[callbackName] = finish;
    script.onerror = () => finish(null);
    const query = new URLSearchParams({
      tqx: `out:json;responseHandler:${callbackName}`,
      sheet: sheetName,
      range: CAST_ROSTER_RANGE,
      headers: "0",
    });
    script.src = `https://docs.google.com/spreadsheets/d/${CAST_SHEET_ID}/gviz/tq?${query}`;
    document.head.append(script);
  }

  function castCategory() {
    const sourceCategories = state.menu.filter((category) => ["soft", "alcohol"].includes(category.id));
    const subcategories = sourceCategories.flatMap((category) => category.subcategories.map((subcategory) => ({
      id: `${category.id}-${subcategory.id}`,
      label: subcategory.label,
    })));
    const items = sourceCategories.flatMap((category) => category.items.map((item) => ({
      ...item,
      id: `${category.id}-${item.id}`,
      subcategory_id: `${category.id}-${item.subcategory_id}`,
    })));
    return { id: CAST_CATEGORY_ID, label: "キャスドリ", subcategories, items };
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
    const menuCategories = [...state.menu];
    const castInsertIndex = menuCategories.findIndex((category) => category.id === "alcohol") + 1;
    menuCategories.splice(Math.max(0, castInsertIndex), 0, { id: CAST_CATEGORY_ID, label: "キャスドリ" });
    const categories = [{ id: APPLICATIONS_CATEGORY_ID, label: "各種申請" }, ...menuCategories];
    $("#categoryTabs").innerHTML = categories.map((category) => `
      <button class="category-tab${category.id === state.categoryId ? " active" : ""}" type="button" data-category="${escapeHtml(category.id)}">${escapeHtml(menuText(category.label))}</button>
    `).join("");

    const applicationsActive = state.categoryId === APPLICATIONS_CATEGORY_ID;
    const castActive = state.categoryId === CAST_CATEGORY_ID;
    $(".section-heading").hidden = applicationsActive;
    $(".menu-level-secondary").hidden = applicationsActive;
    $("#menuGuide").textContent = t("menuGuide");
    $("#productSections").classList.toggle("is-applications", applicationsActive);
    $("#productSections").classList.toggle("is-cast-drink", castActive);
    if (applicationsActive) {
      $("#subcategoryTabs").innerHTML = "";
      renderApplications();
      requestAnimationFrame(updateStickyOffsets);
      return;
    }

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
    $("#productSections").innerHTML = `${castActive ? renderCastRoster() : ""}${groups.map((group) => `
      <section class="product-group" data-product-group="${escapeHtml(group.id)}">
        <h3>${escapeHtml(menuText(group.label))}</h3>
        <div class="product-grid">
          ${group.items.map((item) => productButton(category, item)).join("")}
        </div>
      </section>
    `).join("")}`;
    requestAnimationFrame(updateStickyOffsets);
  }

  function renderCastRoster() {
    const status = state.castRosterLoading
      ? `<p class="cast-roster-status">${t("castRosterLoading")}</p>`
      : state.castRosterError
        ? `<p class="cast-roster-status is-error">${t("castRosterError")}</p>`
        : `<div class="cast-name-grid">${state.castNames.map((name) => `
            <button class="cast-name-button${name === state.selectedCastName ? " active" : ""}" type="button" data-cast-name="${escapeHtml(name)}" aria-pressed="${name === state.selectedCastName}">${escapeHtml(name)}</button>
          `).join("")}</div>`;
    return `
      <section class="cast-roster-panel" aria-labelledby="castRosterTitle">
        <div class="cast-roster-heading">
          <div>
            <h3 id="castRosterTitle">${t("selectCast")}</h3>
            <p>${t("castRosterDate", { date: state.castRosterDate || currentCastSheetName() })}</p>
          </div>
          <button class="cast-roster-refresh" type="button" data-refresh-cast-roster aria-label="${t("refreshCastRoster")}" title="${t("refreshCastRoster")}">↻</button>
        </div>
        ${status}
        <p class="cast-roster-guide${state.selectedCastName ? " is-selected" : ""}">${state.selectedCastName
          ? t("selectedCast", { name: state.selectedCastName })
          : t("selectCastFirst")}</p>
      </section>
    `;
  }

  function renderApplications() {
    $("#productSections").innerHTML = `
      <section class="applications-portal" aria-labelledby="applicationsTitle">
        <div class="applications-inner">
          <div class="applications-heading">
            <p>GG新宿</p>
            <h3 id="applicationsTitle">${escapeHtml(menuText("各種申請・ご案内"))}</h3>
          </div>
          <div class="application-link-list">
            ${APPLICATION_LINKS.map((link) => `
              <a class="application-link" href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">
                <span class="application-link-icon" aria-hidden="true">${link.image
                  ? `<img src="${escapeHtml(link.image)}" alt="">`
                  : escapeHtml(link.iconText || "")}</span>
                <span class="application-link-copy">
                  <strong>${escapeHtml(menuText(link.label))}</strong>
                  ${link.note ? `<small>${escapeHtml(menuText(link.note))}</small>` : ""}
                </span>
                <span class="application-link-arrow" aria-hidden="true">↗</span>
              </a>
            `).join("")}
          </div>
          <img class="application-identity-guide" src="./assets/gameid-identity-guide.jpg?v=2026100801" alt="本人確認のお手続き">
          <article class="gameid-notice">
            <h3>GameIDアプリの重要なお知らせ</h3>
            <p>${escapeHtml(GAME_ID_NOTICE)}</p>
          </article>
        </div>
      </section>
    `;
  }

  function updateStickyOffsets() {
    const header = $(".customer-header");
    const primaryLevel = $(".menu-level-primary");
    if (!header || !primaryLevel) return;
    document.documentElement.style.setProperty("--customer-header-height", `${Math.ceil(header.getBoundingClientRect().height)}px`);
    document.documentElement.style.setProperty("--menu-primary-height", `${Math.ceil(primaryLevel.getBoundingClientRect().height)}px`);
  }

  function productButton(category, item) {
    const castItem = category.id === CAST_CATEGORY_ID;
    const count = state.cart.filter((entry) => entry.categoryId === category.id && entry.itemId === item.id
      && (!castItem || entry.castName === state.selectedCastName))
      .reduce((sum, entry) => sum + entry.quantity, 0);
    const productImage = {
      "水": "./assets/crystal-geyser.png",
      "ペリエ": "./assets/perrier.png",
      "レッドブル（ノーマル）": "./assets/red-bull-original.png?v=2026100101",
      "レッドブル（ノンシュガー）": "./assets/red-bull-sugarfree.png?v=2026100501",
      "レッドブル（パープル）": "./assets/red-bull-purple.png?v=2026100501",
      "コロナビール": "./assets/corona-extra.png?v=2026100101",
      "ハイネケン": "./assets/heineken.png?v=2026100101",
      "PUNK IPA": "./assets/punk-ipa.png?v=2026100101",
      "角": "./assets/suntory-kaku.png?v=2026100101",
      "メーカーズマーク": "./assets/makers-mark.png?v=2026100101",
      "ジャックダニエル": "./assets/jack-daniels.png?v=2026100101",
      "I.W ハーパー": "./assets/iw-harper.png?v=2026100101",
      "ワイルドターキー8年": "./assets/wild-turkey-8.png?v=2026100101",
      "ジョニーウォーカー": "./assets/johnnie-walker.png?v=2026100101",
      "グレンフィディック12年": "./assets/glenfiddich-12.png?v=2026100101",
      "ボウモア12年": "./assets/bowmore-12.png?v=2026100101",
      "ラフロイグ10年": "./assets/laphroaig-10.png?v=2026100101",
      "白州": "./assets/hakushu.png?v=2026100101",
      "マッカラン": "./assets/macallan.png?v=2026100101",
      "いいちこ": "./assets/iichiko.png?v=2026100101",
      "黒霧島": "./assets/kuro-kirishima.png?v=2026100101",
      "鍛高譚": "./assets/tantakatan.png?v=2026100101",
      "カシス": "./assets/cassis.png?v=2026100101",
      "ピーチ": "./assets/peachtree.png?v=2026100101",
      "マリブ": "./assets/malibu.png?v=2026100101",
      "ミスティア": "./assets/mistia.png?v=2026100101",
      "カルーア": "./assets/kahlua.png?v=2026100101",
      "コアントロー": "./assets/cointreau.png?v=2026100101",
      "ディタ": "./assets/dita.png?v=2026100101",
      "ジン": "./assets/gin.png?v=2026100101",
      "ウォッカ": "./assets/vodka.png?v=2026100201",
      "ラム": "./assets/rum.png?v=2026100201",
      "サウザテキーラ": "./assets/sauza.png?v=2026100201",
      "サウザ": "./assets/sauza.png?v=2026100201",
      "アネホ1800": "./assets/anejo-1800.png?v=2026100201",
      "タランチュラ": "./assets/tarantula.png?v=2026100201",
      "ストロベリーテキーラ": "./assets/strawberry-tequila.png?v=2026100201",
      "モエ・エ・シャンドン": "./assets/moet-chandon.png?v=2026100301",
      "モエ・エ・シャンドン・ロゼ": "./assets/moet-chandon-rose.png?v=2026100301",
      "ヴーヴ・クリエ・イエロー": "./assets/veuve-yellow.png?v=2026100301",
      "ドン・ペリニョン": "./assets/dom-perignon.png?v=2026100401",
      "ドン・ペリニョン ロゼ": "./assets/dom-perignon-rose.png?v=2026100401",
      "アルマンド・ゴールド": "./assets/armand-gold.png?v=2026100401",
    }[item.name.trim()] || "";
    const splitRedBullName = state.language === "ja"
      ? item.name.trim().match(/^レッドブル（(.+)）$/)
      : null;
    const multilineProductName = splitRedBullName || [
      "オリジナルシャンパン",
      "モエ・エ・シャンドン",
      "モエ・エ・シャンドン・ロゼ",
      "ヴーヴ・クリエ・イエロー",
      "ドン・ペリニョン",
      "ドン・ペリニョン ロゼ",
      "エンジェル",
      "アルマンド・ゴールド",
      "シャンメリー",
    ].includes(item.name.trim());
    const coverProductImage = ["ペリエ", "ハイネケン"].includes(item.name.trim());
    const bottomCropProductImage = item.name.trim() === "黒霧島";
    return `
      <button class="product-button${productImage ? " has-product-image" : ""}" type="button" data-item="${escapeHtml(item.id)}"${castItem && !state.selectedCastName ? " disabled" : ""}>
        ${count ? `<span class="product-cart-count">${count}</span>` : ""}
        <span class="product-name${multilineProductName ? " force-two-lines" : ""}">${splitRedBullName
          ? `<span class="product-name-line">レッドブル</span><span class="product-name-line">${escapeHtml(`（${splitRedBullName[1]}）`)}</span>`
          : escapeHtml(menuText(item.name))}</span>
        <span class="product-price">${formatPrice(item.price)}</span>
        ${productImage ? `<img class="product-image${coverProductImage ? " product-image-square" : ""}${bottomCropProductImage ? " product-image-bottom-crop" : ""}" src="${escapeHtml(productImage)}" alt="" aria-hidden="true">` : ""}
      </button>
    `;
  }

  function handleCategoryChoice(event) {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.categoryId = button.dataset.category;
    state.subcategoryId = state.categoryId === APPLICATIONS_CATEGORY_ID
      ? ""
      : activeCategory()?.subcategories?.[0]?.id || "";
    renderMenu();
    if (state.categoryId === CAST_CATEGORY_ID) loadCastNames();
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
    if (event.target.closest("[data-refresh-cast-roster]")) {
      loadCastNames();
      return;
    }
    const castNameButton = event.target.closest("[data-cast-name]");
    if (castNameButton) {
      state.selectedCastName = castNameButton.dataset.castName;
      renderMenu();
      return;
    }
    const button = event.target.closest("[data-item]");
    if (!button) return;
    const category = activeCategory();
    if (category?.id === CAST_CATEGORY_ID && !state.selectedCastName) {
      toast(t("selectCastFirst"));
      return;
    }
    const item = category?.items.find((entry) => entry.id === button.dataset.item);
    if (!item) return;
    openItem(category, item);
  }

  function openItem(category, item) {
    const castName = category.id === CAST_CATEGORY_ID ? state.selectedCastName : "";
    const cartItem = state.cart.find((entry) => entry.categoryId === category.id && entry.itemId === item.id
      && (category.id !== CAST_CATEGORY_ID || entry.castName === castName));
    state.activeItem = { category, item, castName, cartItemId: cartItem?.id || "" };
    state.quantity = cartItem?.quantity || 1;
    renderActiveItem();
    $("#itemDialog").showModal();
  }

  function renderActiveItem(selectedOptions = null) {
    if (!state.activeItem) return;
    const { category, item, cartItemId } = state.activeItem;
    const cartItem = cartItemId ? state.cart.find((entry) => entry.id === cartItemId) : null;
    const options = Array.isArray(selectedOptions) ? selectedOptions : cartItem?.options || [];
    $("#itemCategory").textContent = category.id === CAST_CATEGORY_ID
      ? `${menuText(category.label)} / ${cartItem?.castName || state.activeItem.castName}`
      : menuText(category.label);
    $("#itemName").textContent = menuText(item.name);
    $("#itemPrice").textContent = formatPrice(item.price);
    const description = itemDescription(item.name);
    $("#itemDescription").textContent = description;
    $("#itemDescription").hidden = !description;
    $("#itemQuantity").textContent = String(state.quantity);
    $("#itemOptions").innerHTML = item.optionGroups
      .map((group, groupIndex) => optionGroup(group, groupIndex, options))
      .join("");
    $("#addToCartButton").textContent = cartItem ? t("updateCart") : t("addToCart");
  }

  function itemDescription(itemName) {
    const description = window.DRINK_DESCRIPTIONS?.[String(itemName || "").trim()];
    if (typeof description === "string") return description.trim();
    if (!description || typeof description !== "object") return "";
    const preferred = state.language === "en" ? description.en : description.ja;
    const fallback = state.language === "en" ? description.ja : description.en;
    return String(preferred || fallback || "").trim();
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
    const { category, item, castName, cartItemId } = state.activeItem;
    const options = $$(".option-group", $("#itemOptions"))
      .map((group) => $("input:checked", group)?.value || "")
      .filter(Boolean);
    const cartItem = cartItemId ? state.cart.find((entry) => entry.id === cartItemId) : null;
    if (cartItem) {
      cartItem.quantity = state.quantity;
      cartItem.options = options;
      if (category.id === CAST_CATEGORY_ID) cartItem.castName = castName;
    } else {
      state.cart.push({
        id: crypto.randomUUID(),
        categoryId: category.id,
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: state.quantity,
        options,
        castName: category.id === CAST_CATEGORY_ID ? castName : "",
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
          ${item.castName ? `<p class="cart-cast-name">${escapeHtml(t("castRecipient", { name: item.castName }))}</p>` : ""}
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
    const sourceLocation = barCounterSelected
      ? "バーカウンター"
      : `${state.tableNo}卓 ${state.seatNos.join("・")}番席`;
    let rowIndex = 0;
    const rows = state.cart.flatMap((item) => Array.from({ length: item.quantity }, (_, index) => {
      const currentRowIndex = rowIndex++;
      const now = new Date(startedAt + currentRowIndex).toISOString();
      const castOrder = item.categoryId === CAST_CATEGORY_ID;
      const noteParts = [];
      if (castOrder) noteParts.push(`注文元: ${sourceLocation}`);
      if (item.options.length) noteParts.push(`オプション: ${item.options.join(" / ")}`);
      return {
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        source: "table",
        drink_name: item.name,
        quantity: 1,
        target: castOrder ? CAST_STORAGE_TARGET : barCounterSelected ? "bar" : "ring",
        table_no: castOrder ? item.castName : barCounterSelected ? "" : state.tableNo,
        seat_no: castOrder ? CAST_STORAGE_SEAT : barCounterSelected ? "" : state.seatNos.join("・"),
        payment_status: "uncollected",
        payment_method: state.paymentMethods[currentRowIndex % state.paymentMethods.length],
        notes: noteParts.join(" / "),
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
    if (state.categoryId === CAST_CATEGORY_ID) return castCategory();
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

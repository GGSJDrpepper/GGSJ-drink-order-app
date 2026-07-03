(function () {
  "use strict";

  const ORDER_KEY = "drink-relay-orders-v1";
  const CONFIG_KEY = "drink-relay-supabase-v1";
  const SOUND_KEY = "drink-relay-sound-enabled-v1";
  const SOUND_CHOICE_KEY = "drink-relay-sound-choice-v1";
  const MENU_KEY = "drink-relay-menu-v1";
  const RECEPTION_MENU_MODE_KEY = "drink-relay-reception-menu-mode-v1";
  const LEGACY_DRINKS_KEY = "drink-relay-drinks-v1";
  const CHANNEL_NAME = "drink-relay-local";
  const SETTINGS_ROW_ID = "main";
  const DEFAULT_SUPABASE_URL = "https://tmnyzkycdiokahujqblt.supabase.co";
  const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_KXmZQiIc_9K74hy4EI-mng_jUYgAr_D";
  const MAX_HISTORY = 80;
  const SOUND_OPTIONS = [
    { id: "news-title", label: "ニュースタイトル表示", url: "./sounds/news-title.mp3" },
    { id: "decision-button", label: "決定ボタン", url: "./sounds/decision-button.mp3" },
    { id: "level-up", label: "レベルアップ", url: "./sounds/level-up.mp3" },
    { id: "bell", label: "ベル", url: "" },
  ];
  const TABLES = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const SEATS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const DEFAULT_PRICE_SUGGESTIONS = [600, 700, 800, 1000];
  const DEFAULT_SUBCATEGORY_ID = "default";
  const DEFAULT_SUBCATEGORY_LABEL = "未分類";
  const OPTION_TEMPLATES = [
    { id: "hot", label: "hot", choices: ["hot"], required: false },
    { id: "ice", label: "氷", choices: ["氷少なめ", "氷なし"], required: false },
    { id: "bottle", label: "瓶", choices: ["瓶のまま"], required: false },
    {
      id: "mix",
      label: "割り方",
      choices: [
        "ソーダ",
        "牛乳",
        "ロック",
        "ストレート",
        "炭酸",
        "水",
        "お湯",
        "コーラ",
        "ジンジャーエール",
        "オレンジジュース",
        "紅茶",
        "烏龍茶",
      ],
      required: false,
    },
    { id: "strength", label: "濃さ", choices: ["濃いめ"], required: false },
    { id: "lemon-lime", label: "レモンライム", choices: ["レモン", "ライム", "なし"], required: false },
    { id: "straw", label: "ストロー", choices: ["ストローあり"], required: false },
  ];
  const DEFAULT_MENU = [
    {
      id: "soft",
      label: "ソフドリ",
      subcategories: [
        { id: "water-tea", label: "水、お茶" },
        { id: "juice", label: "ジュース" },
      ],
      items: [
        { id: "oolong-tea", name: "ウーロン茶", price: 0, subcategory_id: "water-tea", optionGroups: [] },
        { id: "green-tea", name: "緑茶", price: 0, subcategory_id: "water-tea", optionGroups: [] },
        { id: "cola", name: "コーラ", price: 0, subcategory_id: "juice", optionGroups: [{ id: "ice", label: "氷", choices: ["氷なし", "氷少なめ", "氷1個"] }] },
        { id: "ginger-ale", name: "ジンジャーエール", price: 0, subcategory_id: "juice", optionGroups: [{ id: "ice", label: "氷", choices: ["氷なし", "氷少なめ", "氷1個"] }] },
        { id: "orange-juice", name: "オレンジジュース", price: 600, subcategory_id: "juice", optionGroups: [{ id: "ice", label: "氷", choices: ["氷なし", "氷少なめ", "氷1個"] }] },
        {
          id: "iced-coffee",
          name: "アイスコーヒー",
          price: 0,
          subcategory_id: "juice",
          optionGroups: [
            { id: "temperature", label: "Hot/Cold", choices: ["Hot", "ぬるめ", "Cold"] },
            { id: "milk", label: "ミルク", choices: ["ミルクあり", "ミルクなし"] },
            { id: "ice", label: "氷", choices: ["氷なし", "氷少なめ", "氷1個"] },
          ],
        },
      ],
    },
    {
      id: "alcohol",
      label: "アルコール",
      subcategories: [{ id: DEFAULT_SUBCATEGORY_ID, label: DEFAULT_SUBCATEGORY_LABEL }],
      items: [
        { id: "beer", name: "ビール", price: 0, subcategory_id: DEFAULT_SUBCATEGORY_ID, optionGroups: [] },
        { id: "highball", name: "ハイボール", price: 0, subcategory_id: DEFAULT_SUBCATEGORY_ID, optionGroups: [{ id: "strength", label: "濃さ", choices: ["濃いめ", "薄め"] }] },
        { id: "lemon-sour", name: "レモンサワー", price: 0, subcategory_id: DEFAULT_SUBCATEGORY_ID, optionGroups: [{ id: "strength", label: "濃さ", choices: ["濃いめ", "薄め"] }] },
        { id: "cocktail", name: "カクテル", price: 0, subcategory_id: DEFAULT_SUBCATEGORY_ID, optionGroups: [] },
      ],
    },
    {
      id: "food",
      label: "フード",
      subcategories: [{ id: DEFAULT_SUBCATEGORY_ID, label: DEFAULT_SUBCATEGORY_LABEL }],
      items: [
        { id: "potato", name: "ポテト", price: 0, subcategory_id: DEFAULT_SUBCATEGORY_ID, optionGroups: [{ id: "ketchup", label: "ケチャップ", choices: ["ケチャップあり", "ケチャップなし"] }] },
        { id: "karaage", name: "からあげ", price: 0, subcategory_id: DEFAULT_SUBCATEGORY_ID, optionGroups: [] },
        { id: "edamame", name: "枝豆", price: 0, subcategory_id: DEFAULT_SUBCATEGORY_ID, optionGroups: [] },
      ],
    },
    {
      id: "other",
      label: "その他",
      subcategories: [{ id: DEFAULT_SUBCATEGORY_ID, label: DEFAULT_SUBCATEGORY_LABEL }],
      items: [{ id: "other-item", name: "その他", price: 0, subcategory_id: DEFAULT_SUBCATEGORY_ID, optionGroups: [] }],
    },
  ];

  const statusLabels = {
    ordered: "新規",
    making: "作成中",
    made: "作成済み",
    served: "提供済み",
    canceled: "取消",
  };

  const sourceLabels = {
    reception: "受付",
    table: "テーブル",
  };

  const targetLabels = {
    tournament: "トーナメント",
    ring: "リング",
    bar: "バーカウンター",
  };

  const paymentStatusLabels = {
    paid: "徴収済み",
    uncollected: "未徴収",
  };

  const paymentMethodLabels = {
    cash: "現金",
    card: "カード",
    paypay: "PayPay",
    coin: "コイン",
    transit: "交通系",
    unknown: "不明",
  };

  const state = {
    view: "reception",
    filter: "open",
    orders: [],
    knownIds: new Set(),
    supabase: null,
    realtimeChannel: null,
    broadcast: null,
    syncMode: "local",
    sharedSettingsLoaded: false,
    soundEnabled: readSoundSetting(),
    soundChoice: readSoundChoice(),
    menu: readMenuSettings(),
    receptionMenuMode: readReceptionMenuMode(),
    carts: {
      reception: [],
      table: [],
    },
    pendingConfirmation: null,
    activeSheet: null,
    audioContext: null,
    notificationAudio: null,
    notificationAudioUnavailable: false,
    notificationAudioId: "",
    configSnapshot: "",
    configActiveCategoryId: "",
    booted: false,
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    setupTabs();
    setupNavigationDrawer();
    setupChoiceButtons();
    renderMenuPickers();
    setupForms();
    setupControls();
    setupReceptionModeMenu();
    updateHeaderViewLabel();
    setupLocalChannel();
    setupAudioUnlock();
    await configureSupabaseFromStorage();
    await loadSharedSettings();
    await loadOrders();
    state.orders.forEach((order) => state.knownIds.add(order.id));
    state.booted = true;
    render();
    setInterval(render, 15000);
    if (window.lucide) window.lucide.createIcons();
  }

  function setupTabs() {
    $$(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        switchView(tab.dataset.view);
      });
    });
  }

  function switchView(viewName) {
    state.view = viewName;
    $$(".tab").forEach((item) => {
      const active = item.dataset.view === viewName;
      item.classList.toggle("active", active);
      if (active) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
    $$(".view").forEach((view) => {
      view.classList.toggle("active", view.id === `view-${state.view}`);
    });
    updateHeaderViewLabel();
    closeNavigationDrawer();
    render();
    if (window.lucide) window.lucide.createIcons();
  }

  function updateHeaderViewLabel() {
    const modeButton = $("#receptionModeButton");
    const modeMenu = $("#receptionModeMenu");
    if (state.view === "reception") {
      $("#currentViewLabel").textContent = receptionModeLabel();
      if (modeButton) modeButton.hidden = false;
      $$("#receptionModeMenu [data-reception-mode]").forEach((button) => {
        button.classList.toggle("active", button.dataset.receptionMode === state.receptionMenuMode);
      });
      return;
    }

    const activeTab = $$(".tab").find((tab) => tab.dataset.view === state.view);
    $("#currentViewLabel").textContent = activeTab?.textContent.trim() || "";
    if (modeButton) {
      modeButton.hidden = true;
      modeButton.setAttribute("aria-expanded", "false");
    }
    if (modeMenu) modeMenu.hidden = true;
  }

  function receptionModeLabel() {
    return state.receptionMenuMode === "custom" ? "受付（カスタム）" : "受付（通常）";
  }

  function setupNavigationDrawer() {
    $("#menuButton").addEventListener("click", openNavigationDrawer);
    $("#navigationDrawer").addEventListener("click", (event) => {
      if (event.target.closest("[data-menu-close]")) closeNavigationDrawer();
    });
  }

  function openNavigationDrawer() {
    const drawer = $("#navigationDrawer");
    drawer.hidden = false;
    $("#menuButton").setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => drawer.classList.add("open"));
  }

  function closeNavigationDrawer() {
    const drawer = $("#navigationDrawer");
    drawer.classList.remove("open");
    $("#menuButton").setAttribute("aria-expanded", "false");
    setTimeout(() => {
      if (!drawer.classList.contains("open")) drawer.hidden = true;
    }, 180);
  }

  function setupForms() {
    $$(".order-form").forEach((form) => {
      form.addEventListener("change", () => {
        updateCustomDrinkField(form);
        updateConfirmButtonState(form);
      });
      updateCustomDrinkField(form);
      updateConfirmButtonState(form);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const draft = readCartDraft(form);
        if (!draft) return;
        openConfirm(form, draft);
      });
    });
  }

  function setupChoiceButtons() {
    $$(".order-form").forEach((form) => {
      form.addEventListener("click", (event) => {
        const subcategoryButton = event.target.closest("[data-menu-subcategory]");
        if (subcategoryButton && form.contains(subcategoryButton)) {
          const picker = subcategoryButton.closest("[data-drink-picker]");
          updateMenuSubcategoryActive(picker, subcategoryButton.dataset.menuSubcategory);
          scrollToMenuSubcategory(picker, subcategoryButton.dataset.menuSubcategory);
          return;
        }

        const categoryButton = event.target.closest("[data-menu-category]");
        if (categoryButton && form.contains(categoryButton)) {
          const picker = categoryButton.closest("[data-drink-picker]");
          const categoryId = categoryButton.dataset.menuCategory;
          picker.dataset.activeCategory = categoryId;
          updateMenuCategoryActive(picker, categoryId);
          scrollToMenuSection(picker, categoryId);
          return;
        }

        const button = event.target.closest("[data-choice-value]");
        if (!button || !form.contains(button) || button.disabled) return;
        const drinkPicker = button.closest("[data-drink-picker]");

        if (drinkPicker) {
          const categoryId = button.dataset.menuCategoryId;
          const item = findMenuItem(categoryId, button.dataset.menuItemId);
          if (item) setDrinkSelection(form, categoryId, item);
          return;
        }
      });
    });
  }

  function setupControls() {
    $("#soundToggle").addEventListener("click", async () => {
      state.soundEnabled = !state.soundEnabled;
      saveSoundSetting();
      updateSoundButton();
      if (state.soundEnabled) {
        await unlockAudio();
        playChime();
        toast("通知音を有効にしました");
      } else {
        toast("通知音を無効にしました");
      }
    });
    $("#soundChoice").addEventListener("change", (event) => {
      state.soundChoice = normalizeSoundChoice(event.target.value);
      resetNotificationAudio();
      saveSoundChoice();
      toast("効果音を変更しました");
    });
    $("#soundPreview").addEventListener("click", async () => {
      await unlockAudio();
      playChime();
    });

    $("#configButton").addEventListener("click", () => {
      closeNavigationDrawer();
      openConfig();
    });
    $("#headerConfigButton").addEventListener("click", () => {
      closeNavigationDrawer();
      openConfig();
    });
    $("#configDialog form").addEventListener("submit", (event) => event.preventDefault());
    $("#configDialog").addEventListener("keydown", handleConfigKeydown);
    $("#configCloseButton").addEventListener("click", requestCloseConfig);
    $("#configPromptCancel").addEventListener("click", hideConfigUnsavedPrompt);
    $("#configPromptSave").addEventListener("click", saveConfig);
    $("#configDialog").addEventListener("cancel", (event) => {
      if (!configHasUnsavedChanges()) return;
      event.preventDefault();
      showConfigUnsavedPrompt();
    });
    $("#saveConfig").addEventListener("click", saveConfig);
    $("#clearConfig").addEventListener("click", clearConfig);
    $("#addMenuCategory").addEventListener("click", addMenuEditorCategory);
    $("#menuEditor").addEventListener("click", (event) => {
      const removeCategory = event.target.closest("[data-remove-menu-category]");
      const addItem = event.target.closest("[data-add-menu-item]");
      const editItem = event.target.closest("[data-edit-menu-item]");
      const removeItem = event.target.closest("[data-remove-menu-item]");
      const addSubcategory = event.target.closest("[data-add-menu-subcategory]");
      const removeSubcategory = event.target.closest("[data-remove-menu-subcategory]");
      const addOptionGroup = event.target.closest("[data-add-menu-option-group]");
      const addOptionTemplate = event.target.closest("[data-add-option-template]");
      const applyOptionTemplate = event.target.closest("[data-apply-option-template]");
      const cancelOptionTemplate = event.target.closest("[data-cancel-option-template]");
      const selectAllTemplateChoices = event.target.closest("[data-template-select-all]");
      const clearTemplateChoices = event.target.closest("[data-template-clear]");
      const removeOptionGroup = event.target.closest("[data-remove-menu-option-group]");
      const addOptionChoice = event.target.closest("[data-add-menu-option-choice]");
      const removeOptionChoice = event.target.closest("[data-remove-menu-option-choice]");
      const categoryTab = event.target.closest("[data-config-category-tab]");

      if (categoryTab) {
        selectMenuEditorCategory(categoryTab.dataset.configCategoryTab);
        return;
      }

      let refreshCategoryTabs = false;

      if (removeCategory) {
        removeCategory.closest("[data-menu-editor-category]")?.remove();
        refreshCategoryTabs = true;
      }

      if (addSubcategory) {
        addMenuEditorSubcategory(addSubcategory.closest("[data-menu-editor-category]"));
      }

      if (removeSubcategory) {
        removeMenuEditorSubcategory(removeSubcategory.closest("[data-menu-editor-subcategory]"));
      }

      if (addItem) {
        const category = addItem.closest("[data-menu-editor-category]");
        const subcategory = addItem.closest("[data-menu-editor-subcategory]") || $("[data-menu-editor-subcategory]", category);
        const subcategoryId = subcategoryIdFromEditorRow(subcategory) || DEFAULT_SUBCATEGORY_ID;
        closeOtherMenuEditorItems(null);
        $("[data-menu-editor-items]", subcategory || category).insertAdjacentHTML(
          "beforeend",
          menuEditorItemBlock(
            {
              id: `item-${Date.now()}`,
              name: "",
              subcategory_id: subcategoryId,
              optionGroups: [],
            },
            { open: true, subcategoryId }
          )
        );
        refreshCategoryTabs = true;
      }

      if (editItem) {
        const item = editItem.closest("[data-menu-editor-item]");
        const isOpen = !item.classList.contains("open");
        if (isOpen) closeOtherMenuEditorItems(item);
        setMenuEditorItemOpen(item, isOpen);
      }

      if (removeItem) {
        removeItem.closest("[data-menu-editor-item]")?.remove();
        refreshCategoryTabs = true;
      }

      if (addOptionGroup) {
        const item = addOptionGroup.closest("[data-menu-editor-item]");
        $("[data-menu-editor-option-groups]", item).insertAdjacentHTML(
          "beforeend",
          menuEditorOptionGroupBlock({ id: `option-${Date.now()}`, label: "オプション", required: false, choices: [] })
        );
      }

      if (addOptionTemplate) {
        const item = addOptionTemplate.closest("[data-menu-editor-item]");
        closeOtherMenuEditorItems(item);
        setMenuEditorItemOpen(item, true);
        showOptionTemplatePicker(item, addOptionTemplate.dataset.addOptionTemplate);
      }

      if (selectAllTemplateChoices) {
        $$("[data-option-template-choice]", selectAllTemplateChoices.closest("[data-option-template-picker]")).forEach(
          (input) => {
            input.checked = true;
          }
        );
      }

      if (clearTemplateChoices) {
        $$("[data-option-template-choice]", clearTemplateChoices.closest("[data-option-template-picker]")).forEach(
          (input) => {
            input.checked = false;
          }
        );
      }

      if (cancelOptionTemplate) {
        closeOptionTemplatePicker(cancelOptionTemplate.closest("[data-menu-editor-item]"));
      }

      if (applyOptionTemplate) {
        const picker = applyOptionTemplate.closest("[data-option-template-picker]");
        const choices = $$("[data-option-template-choice]:checked", picker).map((input) => input.value);
        addOptionTemplateToEditorItem(
          applyOptionTemplate.closest("[data-menu-editor-item]"),
          applyOptionTemplate.dataset.applyOptionTemplate,
          choices
        );
      }

      if (removeOptionGroup) {
        removeOptionGroup.closest("[data-menu-editor-option-group]")?.remove();
      }

      if (addOptionChoice) {
        const group = addOptionChoice.closest("[data-menu-editor-option-group]");
        $("[data-menu-editor-option-choices]", group).insertAdjacentHTML("beforeend", menuEditorOptionChoiceBlock(""));
      }

      if (removeOptionChoice) {
        removeOptionChoice.closest("[data-menu-editor-option-choice]")?.remove();
      }

      if (!$("#menuEditor [data-menu-editor-category]")) {
        addMenuEditorCategory();
        return;
      }

      if (refreshCategoryTabs) {
        refreshMenuEditorCategoryTabs();
      }

      if (window.lucide) window.lucide.createIcons();
    });
    $("#menuEditor").addEventListener("input", (event) => {
      const input = event.target.closest?.("[data-menu-item-price]");
      if (event.target.closest?.("[data-menu-label]")) refreshMenuEditorCategoryTabs();
      const subcategoryInput = event.target.closest?.("[data-menu-subcategory-label]");
      if (subcategoryInput) {
        refreshItemSubcategoryOptions(subcategoryInput.closest("[data-menu-editor-category]"));
      }
    });
    $("#menuEditor").addEventListener("focusin", (event) => {
      const categoryInput = event.target.closest?.("[data-menu-label], [data-menu-subcategory-label]");
      if (categoryInput) {
        closeOtherMenuEditorItems(null);
        closeOtherOptionTemplatePickers(null);
        return;
      }

      const input = event.target.closest?.("[data-menu-item-name]");
      if (input) {
        const item = input.closest("[data-menu-editor-item]");
        closeOtherMenuEditorItems(item);
        closeOtherOptionTemplatePickers(item);
        moveCaretToEnd(input);
      }
    });
    $("#menuEditor").addEventListener("pointerup", (event) => {
      const input = event.target.closest?.("[data-menu-item-name]");
      if (input) moveCaretToEnd(input);
    });
    $("#menuEditor").addEventListener("pointerdown", handleMenuEditorPointerDown);
    $("#menuEditor").addEventListener("keydown", handleMenuEditorKeydown);
    $("#menuEditor").addEventListener("wheel", handleMenuEditorWheel, { passive: false });
    $("#backToOrder").addEventListener("click", closeConfirm);
    $("#sendConfirmedOrder").addEventListener("click", sendConfirmedOrders);
    $("#confirmItems").addEventListener("click", handleConfirmChoice);
    $("#confirmDialog").addEventListener("close", () => {
      persistConfirmSelections();
      state.pendingConfirmation = null;
    });
    $$("input[name='confirmPaymentStatus']").forEach((input) => {
      input.addEventListener("change", updateConfirmPaymentMethodVisibility);
    });
    $("#itemSheetLayer").addEventListener("click", (event) => {
      if (event.target.closest("[data-sheet-close]")) closeItemSheet();
    });
    $("#itemSheetClose").addEventListener("click", closeItemSheet);
    $("#quantityMinus").addEventListener("click", () => setSheetQuantity(sheetQuantity() - 1));
    $("#quantityPlus").addEventListener("click", () => setSheetQuantity(sheetQuantity() + 1));
    $("#itemSheetOptions").addEventListener("change", () => {
      syncSheetToForm();
      updateSheetConfirmState();
    });
    $("#itemSheetConfirm").addEventListener("click", () => {
      const form = state.activeSheet?.form;
      if (!form) return;
      if (!updateSheetConfirmState()) return;
      addActiveSheetToCart(form);
    });

    $$(".filter").forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        $$(".filter").forEach((item) => item.classList.toggle("active", item === button));
        renderBar();
      });
    });

    $$("[data-action='refresh']").forEach((button) => {
      button.addEventListener("click", async () => {
        await loadOrders();
        render();
        toast("更新しました");
      });
    });

    $("#barOrders").addEventListener("click", handleOrderAction);
  }

  function setupReceptionModeMenu() {
    const button = $("#receptionModeButton");
    const menu = $("#receptionModeMenu");
    if (!button || !menu) return;

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const nextOpen = menu.hidden;
      menu.hidden = !nextOpen;
      button.setAttribute("aria-expanded", String(nextOpen));
    });

    menu.addEventListener("click", (event) => {
      const modeButton = event.target.closest("[data-reception-mode]");
      if (!modeButton) return;
      state.receptionMenuMode = modeButton.dataset.receptionMode === "custom" ? "custom" : "normal";
      localStorage.setItem(RECEPTION_MENU_MODE_KEY, state.receptionMenuMode);
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
      updateHeaderViewLabel();
      renderMenuPickers();
    });

    document.addEventListener("click", (event) => {
      if (menu.hidden || event.target.closest(".view-title-wrap")) return;
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    });
  }

  function handleConfigKeydown(event) {
    if (event.key !== "Enter") return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (["button", "checkbox", "radio", "reset", "submit"].includes(target.type)) return;
    event.preventDefault();
  }

  function handleMenuEditorPointerDown(event) {
    const input = event.target.closest?.("[data-menu-item-price]");
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const spinZoneWidth = 30;
    if (event.clientX < rect.right - spinZoneWidth) return;
    event.preventDefault();
    input.focus();
    const direction = event.clientY < rect.top + rect.height / 2 ? 1 : -1;
    stepPriceSuggestion(input, direction);
  }

  function handleMenuEditorKeydown(event) {
    const input = event.target.closest?.("[data-menu-item-price]");
    if (!input || !["ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    stepPriceSuggestion(input, event.key === "ArrowUp" ? 1 : -1);
  }

  function handleMenuEditorWheel(event) {
    const input = event.target.closest?.("[data-menu-item-price]");
    if (!input || document.activeElement !== input) return;
    event.preventDefault();
    stepPriceSuggestion(input, event.deltaY < 0 ? 1 : -1);
  }

  function moveCaretToEnd(input) {
    requestAnimationFrame(() => {
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  }

  function setupLocalChannel() {
    if ("BroadcastChannel" in window) {
      state.broadcast = new BroadcastChannel(CHANNEL_NAME);
      state.broadcast.addEventListener("message", (event) => {
        if (event.data?.type === "orders-changed" && state.syncMode === "local") {
          loadLocalOrders();
          detectNewOrders();
          render();
        }
      });
    }

    window.addEventListener("storage", (event) => {
      if (event.key === ORDER_KEY && state.syncMode === "local") {
        loadLocalOrders();
        detectNewOrders();
        render();
      }
    });
  }

  function readCurrentDrinkDraft(form) {
    const data = new FormData(form);
    const selectedDrink = String(data.get("drinkName") || "").trim();
    const drinkName = selectedDrink;
    const selectedCategoryId = String(data.get("drinkCategoryId") || "");
    const selectedItemId = String(data.get("drinkItemId") || "");
    const selectedMenuItem = findMenuItem(selectedCategoryId, selectedItemId);
    const target = String(data.get("target") || "ring");
    const quantity = Math.max(1, Math.min(20, Number(data.get("quantity") || 1)));
    const selectedOptions = $$("input[name='drinkOptions']", form)
      .filter((input) => input.type === "hidden" || input.checked)
      .map((input) => input.value);

    if (!selectedDrink) {
      toast("商品を選択してください");
      return null;
    }

    return {
      id: crypto.randomUUID(),
      source: form.dataset.source,
      target,
      drink_name: drinkName,
      price: selectedMenuItem?.price || 0,
      selected_options: selectedOptions,
      quantity,
      locations: [],
      menu_category_id: selectedCategoryId,
      menu_item_id: selectedItemId,
    };
  }

  function readCartDraft(form) {
    const source = form.dataset.source;
    const cart = state.carts[source] || [];
    if (!cart.length) {
      toast("商品を選択してください");
      return null;
    }

    return {
      source,
      items: cart.map(cloneCartItem),
    };
  }

  function addActiveSheetToCart(form) {
    syncSheetToForm();
    const item = readCurrentDrinkDraft(form);
    if (!item) return;
    const source = form.dataset.source;
    if (!state.carts[source]) state.carts[source] = [];
    state.carts[source].push(item);
    closeItemSheet();
    clearDrinkSelection(form);
    renderMenuPickers();
    updateConfirmButtonState(form);
  }

  function cloneCartItem(item) {
    return {
      ...item,
      selected_options: [...(item.selected_options || [])],
      locations: (item.locations || []).map(normalizeLocation),
    };
  }

  function cartItemCount(source) {
    return (state.carts[source] || []).reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  }

  function cartQuantityForMenuItem(source, categoryId, menuItem) {
    return (state.carts[source] || []).reduce((sum, item) => {
      const sameItemId = item.menu_item_id && item.menu_item_id === menuItem.id;
      const categoryMatches = !item.menu_category_id || item.menu_category_id === categoryId;
      const legacyNameMatch = !item.menu_item_id && item.drink_name === menuItem.name;
      if ((sameItemId && categoryMatches) || legacyNameMatch) {
        return sum + Number(item.quantity || 1);
      }
      return sum;
    }, 0);
  }

  function openConfirm(form, draft) {
    state.pendingConfirmation = { form, draft };
    renderConfirm(draft);
    $("#sendConfirmedOrder").disabled = false;
    $("#confirmDialog").showModal();
    if (window.lucide) window.lucide.createIcons();
  }

  function closeConfirm() {
    persistConfirmSelections();
    if ($("#confirmDialog").open) $("#confirmDialog").close();
    state.pendingConfirmation = null;
  }

  function renderConfirm(draft) {
    renderConfirmContents(draft, {}, false);
  }

  function renderConfirmContents(draft, preservedSelections = {}, preservePayment = true) {
    $("#confirmSummary").innerHTML = "";
    $("#confirmSummary").hidden = true;

    if (preservePayment) updateConfirmPaymentMethodVisibility();
    else setConfirmPaymentDefaults(draft);
    $("#confirmItems").innerHTML = draft.items
      .map((item, index) => confirmItemBlock(item, index, draft.items.length, preservedSelections))
      .join("");
    if (window.lucide) window.lucide.createIcons();
  }

  function setConfirmPaymentDefaults(draft) {
    const defaultStatus = draft.source === "reception" ? "paid" : "uncollected";
    const input = $(`input[name='confirmPaymentStatus'][value='${defaultStatus}']`);
    if (input) input.checked = true;
    $("#confirmPaymentMethod").value = "cash";
    updateConfirmPaymentMethodVisibility();
  }

  function updateConfirmPaymentMethodVisibility() {
    const status = confirmPaymentStatus();
    $("#confirmPaymentMethodWrap").hidden = status !== "uncollected";
  }

  function confirmPaymentStatus() {
    return $("input[name='confirmPaymentStatus']:checked")?.value || "uncollected";
  }

  function expandCartItems(items) {
    return items.flatMap((item) =>
      Array.from({ length: Number(item.quantity || 1) }, (_, index) => ({
        ...item,
        row_id: `${item.id}-${index}`,
        selected_options: [...(item.selected_options || [])],
      }))
    );
  }

  function confirmItemBlock(item, index, total, preservedSelections) {
    const label = total > 1 ? `${index + 1}件目` : "1件目";
    const target = item.target || "ring";
    const quantity = Math.max(1, Math.min(20, Number(item.quantity || 1)));
    const options = item.selected_options.length
      ? `<div class="confirm-options">${escapeHtml(item.selected_options.join(" / "))}</div>`
      : "";
    const cups = Array.from({ length: quantity }, (_, cupIndex) =>
      confirmCupBlock(item, cupIndex, preservedSelections)
    ).join("");

    return `
      <section class="confirm-item" data-confirm-cart-id="${escapeHtml(item.id)}">
        <div class="confirm-item-head">
          <div class="confirm-item-title">
            <div class="confirm-title-row">
              <h3>${escapeHtml(label)} ${escapeHtml(item.drink_name)}</h3>
              <span class="confirm-target-label">${escapeHtml(barTargetLabel(item))}</span>
            </div>
            ${options}
          </div>
          <div class="confirm-item-tools">
            <div class="confirm-quantity-stepper" aria-label="杯数">
              <button class="confirm-qty-button" type="button" data-confirm-qty-action="decrease" data-confirm-cart-id="${escapeHtml(item.id)}" aria-label="杯数を減らす" ${quantity <= 1 ? "disabled" : ""}>
                <i data-lucide="minus" aria-hidden="true"></i>
              </button>
              <span>${escapeHtml(String(quantity))}杯</span>
              <button class="confirm-qty-button" type="button" data-confirm-qty-action="increase" data-confirm-cart-id="${escapeHtml(item.id)}" aria-label="杯数を増やす" ${quantity >= 20 ? "disabled" : ""}>
                <i data-lucide="plus" aria-hidden="true"></i>
              </button>
            </div>
            <button class="confirm-remove-button" type="button" data-confirm-remove-cart="${escapeHtml(item.id)}" aria-label="取り消し">
              <i data-lucide="x" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="confirm-cup-list">
          ${cups}
        </div>
      </section>
    `;
  }

  function confirmCupBlock(item, cupIndex, preservedSelections) {
    const rowId = `${item.id}-${cupIndex}`;
    const target = item.target || "ring";
    const selected = preservedSelections[rowId] || normalizeLocation(item.locations?.[cupIndex]);
    const label = Number(item.quantity || 1) > 1 ? `${cupIndex + 1}杯目` : "1杯";
    const dataAttrs = `data-confirm-item="${cupIndex}" data-confirm-cart-id="${escapeHtml(item.id)}" data-confirm-cup-index="${cupIndex}" data-confirm-row-id="${escapeHtml(rowId)}" data-confirm-target="${escapeHtml(target)}" data-confirm-drink="${escapeHtml(item.drink_name)}" data-confirm-options="${escapeHtml(JSON.stringify(item.selected_options || []))}"`;

    if (target === "bar") {
      return `
        <div class="confirm-cup" ${dataAttrs}>
          <div class="confirm-cup-label">${escapeHtml(label)}</div>
        </div>
      `;
    }

    return `
      <div class="confirm-cup" ${dataAttrs}>
        <div class="confirm-cup-label">${escapeHtml(label)}</div>
        <div class="confirm-location-grid">
          ${confirmChoiceGroup(rowId, "tableNo", "テーブル", TABLES, selected.tableNo)}
          ${confirmChoiceGroup(rowId, "seatNo", "席番号", SEATS, selected.seatNo, !selected.tableNo)}
        </div>
      </div>
    `;
  }

  function confirmChoiceGroup(rowId, type, label, values, selectedValue = "", hiddenGroup = false) {
    const hidden = hiddenGroup ? " hidden" : "";
    return `
      <fieldset class="control-group choice-panel confirm-choice-panel" data-confirm-choice-group="${type}"${hidden}>
        <legend>${escapeHtml(label)}</legend>
        <div class="choice-grid ${type === "tableNo" ? "table-choice-grid" : "seat-choice-grid"}">
          ${values.map((value) => `
            <button class="choice-button ${value === selectedValue ? "active" : ""}" type="button" data-confirm-row-id="${escapeHtml(rowId)}" data-confirm-choice="${type}" data-choice-value="${escapeHtml(value)}">
              ${escapeHtml(value)}
            </button>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function handleConfirmChoice(event) {
    const quantityButton = event.target.closest("[data-confirm-qty-action]");
    if (quantityButton) {
      handleConfirmQuantityChange(quantityButton);
      return;
    }

    const removeButton = event.target.closest("[data-confirm-remove-cart]");
    if (removeButton) {
      removeConfirmCartItem(removeButton.dataset.confirmRemoveCart);
      return;
    }

    const button = event.target.closest("[data-confirm-choice]");
    if (!button) return;
    const group = button.closest("[data-confirm-choice-group]");
    const wasActive = button.classList.contains("active");
    $$(".choice-button", group).forEach((item) => item.classList.remove("active"));
    if (!wasActive) button.classList.add("active");
    if (button.dataset.confirmChoice === "tableNo") updateSeatChoicesForConfirmItem(button);
    persistConfirmCupSelection(button.closest("[data-confirm-item]"));
  }

  function updateSeatChoicesForConfirmItem(tableButton) {
    const block = tableButton.closest("[data-confirm-item]");
    const seatGroup = $("[data-confirm-choice-group='seatNo']", block);
    if (!seatGroup) return;
    const hasTable = Boolean($("[data-confirm-choice='tableNo'].active", block));
    seatGroup.hidden = !hasTable;
    if (!hasTable) {
      $$("[data-confirm-choice='seatNo']", seatGroup).forEach((button) => button.classList.remove("active"));
    }
  }

  function handleConfirmQuantityChange(button) {
    if (button.disabled) return;
    const pending = state.pendingConfirmation;
    if (!pending) return;
    const cartId = button.dataset.confirmCartId;
    const item = pending.draft.items.find((entry) => entry.id === cartId);
    if (!item) return;
    const current = Number(item.quantity || 1);
    const delta = button.dataset.confirmQtyAction === "increase" ? 1 : -1;
    const nextQuantity = Math.max(1, Math.min(20, current + delta));
    if (nextQuantity === current) return;
    const selections = persistConfirmSelections();
    item.quantity = nextQuantity;
    item.locations = locationsForItem(item, nextQuantity, selections);
    syncLiveCartItem(pending.draft.source, cartId, { quantity: nextQuantity, locations: item.locations });
    updateConfirmButtonState(pending.form);
    renderMenuPickers();
    renderConfirmContents(pending.draft, selections, true);
  }

  function removeConfirmCartItem(cartId) {
    const pending = state.pendingConfirmation;
    if (!pending) return;
    const selections = persistConfirmSelections();
    pending.draft.items = pending.draft.items.filter((item) => item.id !== cartId);
    state.carts[pending.draft.source] = (state.carts[pending.draft.source] || []).filter((item) => item.id !== cartId);
    updateConfirmButtonState(pending.form);
    renderMenuPickers();
    if (!pending.draft.items.length) {
      closeConfirm();
      return;
    }
    renderConfirmContents(pending.draft, selections, true);
  }

  function syncLiveCartItem(source, cartId, patch) {
    const item = (state.carts[source] || []).find((entry) => entry.id === cartId);
    if (item) Object.assign(item, patch);
  }

  function normalizeLocation(location = {}) {
    const value = location || {};
    return {
      tableNo: value.tableNo || "",
      seatNo: value.seatNo || "",
    };
  }

  function locationsForItem(item, quantity, selections = {}) {
    return Array.from({ length: quantity }, (_, index) =>
      normalizeLocation(selections[`${item.id}-${index}`] || item.locations?.[index])
    );
  }

  function captureConfirmSelections() {
    const selections = {};
    $$("#confirmItems [data-confirm-item][data-confirm-row-id]").forEach((block) => {
      selections[block.dataset.confirmRowId] = {
        tableNo: activeConfirmValue(block, "tableNo"),
        seatNo: activeConfirmValue(block, "seatNo"),
      };
    });
    return selections;
  }

  function persistConfirmCupSelection(block) {
    const pending = state.pendingConfirmation;
    if (!pending || !block) return;
    const cartId = block.dataset.confirmCartId;
    const cupIndex = Number(block.dataset.confirmCupIndex || 0);
    const item = pending.draft.items.find((entry) => entry.id === cartId);
    if (!item) return;
    const quantity = Math.max(1, Math.min(20, Number(item.quantity || 1)));
    const locations = locationsForItem(item, quantity);
    locations[cupIndex] = {
      tableNo: activeConfirmValue(block, "tableNo"),
      seatNo: activeConfirmValue(block, "seatNo"),
    };
    item.locations = locations;
    syncLiveCartItem(pending.draft.source, cartId, { locations });
  }

  function persistConfirmSelections() {
    const pending = state.pendingConfirmation;
    const selections = captureConfirmSelections();
    if (!pending) return selections;

    pending.draft.items.forEach((item) => {
      const quantity = Math.max(1, Math.min(20, Number(item.quantity || 1)));
      const locations = locationsForItem(item, quantity, selections);
      item.locations = locations;
      syncLiveCartItem(pending.draft.source, item.id, { locations });
    });

    return selections;
  }

  async function sendConfirmedOrders() {
    const pending = state.pendingConfirmation;
    if (!pending) return;

    const { form, draft } = pending;
    const button = $("#sendConfirmedOrder");
    button.disabled = true;

    try {
      const items = collectConfirmItems();
      const paymentStatus = confirmPaymentStatus();
      const paymentMethod = paymentStatus === "uncollected" ? $("#confirmPaymentMethod").value : "cash";
      for (const item of items) {
        await createOrder({
          source: draft.source,
          drink_name: item.drink_name,
          quantity: 1,
          target: item.target,
          table_no: item.target === "bar" ? "" : item.tableNo,
          seat_no: item.target === "bar" ? "" : item.seatNo,
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          notes: combinedOrderNote(item.selected_options),
          status: "ordered",
          events: [eventEntry("ordered")],
        });
      }
      state.carts[draft.source] = [];
      resetForm(form);
      renderMenuPickers();
      closeConfirm();
    } finally {
      button.disabled = false;
    }
  }

  function collectConfirmItems() {
    return $$("#confirmItems [data-confirm-item]").map((block) => {
      const target = block.dataset.confirmTarget || "ring";
      return {
        drink_name: block.dataset.confirmDrink || "",
        selected_options: parseJsonList(block.dataset.confirmOptions),
        target,
        tableNo: target === "bar" ? "" : activeConfirmValue(block, "tableNo"),
        seatNo: target === "bar" ? "" : activeConfirmValue(block, "seatNo"),
      };
    });
  }

  function parseJsonList(value) {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return [];
    }
  }

  function activeConfirmValue(block, type) {
    return $(`[data-confirm-choice="${type}"].active`, block)?.dataset.choiceValue || "";
  }

  function combinedOrderNote(options) {
    const parts = [];
    if (options.length) parts.push(`オプション: ${options.join(" / ")}`);
    return parts.join(" / ");
  }

  function resetForm(form) {
    const source = form.dataset.source;
    form.reset();
    if (source === "reception") {
      form.elements.target.value = "tournament";
    }
    if (source === "table") {
      form.elements.target.value = "ring";
    }
    form.elements.quantity.value = 1;
    clearDrinkSelection(form);
    updateCustomDrinkField(form);
    updateConfirmButtonState(form);
  }

  function updateCustomDrinkField(form) {
    const selectedDrink = form.elements.drinkName?.value || "";
    const customInput = form.elements.customDrink;
    if (!customInput) return;
    const label = customInput.closest("label");
    const enabled = selectedDrink === "その他";
    customInput.disabled = !enabled;
    if (!enabled) customInput.value = "";
    if (label) label.style.opacity = enabled ? "1" : "0.44";
  }

  function updateConfirmButtonState(form) {
    const button = $("[data-confirm-button]", form);
    if (!button) return;
    const count = cartItemCount(form.dataset.source);
    button.disabled = count === 0;
    const label = $("[data-confirm-label]", button);
    if (label) label.textContent = count ? `合計${count}杯` : "商品を選択してください";
  }

  function setDrinkSelection(form, categoryId, item) {
    form.elements.drinkName.value = item.name;
    form.elements.drinkCategoryId.value = categoryId;
    form.elements.drinkItemId.value = item.id;
    form.elements.quantity.value = 1;
    form.elements.customDrink.value = "";
    clearHiddenOptions(form);

    const picker = $("[data-drink-picker]", form);
    $$(".choice-button", picker).forEach((button) => {
      button.classList.toggle("active", button.dataset.menuItemId === item.id);
    });

    updateCustomDrinkField(form);
    updateConfirmButtonState(form);
    openItemSheet(form, item);
  }

  function clearDrinkSelection(form) {
    if (form.elements.drinkName) form.elements.drinkName.value = "";
    if (form.elements.drinkCategoryId) form.elements.drinkCategoryId.value = "";
    if (form.elements.drinkItemId) form.elements.drinkItemId.value = "";
    if (form.elements.quantity) form.elements.quantity.value = 1;
    if (form.elements.customDrink) form.elements.customDrink.value = "";
    clearHiddenOptions(form);

    const picker = $("[data-drink-picker]", form);
    if (picker) {
      $$(".choice-button", picker).forEach((button) => button.classList.remove("active"));
    }

    updateCustomDrinkField(form);
    updateConfirmButtonState(form);
  }

  function clearHiddenOptions(form) {
    $$("[data-hidden-option]", form).forEach((input) => input.remove());
  }

  function openItemSheet(form, item) {
    state.activeSheet = { form, item };
    renderItemSheet(form, item);
    const layer = $("#itemSheetLayer");
    layer.hidden = false;
    requestAnimationFrame(() => layer.classList.add("open"));
    if (window.lucide) window.lucide.createIcons();
  }

  function closeItemSheet() {
    const layer = $("#itemSheetLayer");
    layer.classList.remove("open");
    state.activeSheet = null;
    setTimeout(() => {
      if (!layer.classList.contains("open")) layer.hidden = true;
    }, 220);
  }

  function renderItemSheet(form, item) {
    $("#itemSheetTitle").textContent = item.name;
    const optionGroups = item.optionGroups.filter((group) => group.choices.length);

    $("#itemSheetOptions").innerHTML = optionGroups.length
      ? optionGroups.map((group) => sheetOptionGroupBlock(group)).join("")
      : "";

    setSheetQuantity(Number(form.elements.quantity?.value || 1), { skipSync: true });
    syncSheetToForm();
    updateSheetConfirmState();
  }

  function sheetOptionGroupBlock(group) {
    return `
      <fieldset class="sheet-option-group" data-option-group-id="${escapeHtml(group.id)}" data-required="${group.required ? "true" : "false"}">
        <legend>
          <span>${escapeHtml(group.label)}</span>
          ${group.required ? `<span class="required-badge">必須</span>` : ""}
        </legend>
        <div class="option-grid sheet-option-grid">
          ${group.choices.map((choice) => `
            <label class="option-pill">
              <input type="radio" name="sheet-option-${escapeHtml(group.id)}" value="${escapeHtml(choice)}" data-option-group-label="${escapeHtml(group.label)}">
              <span>${escapeHtml(choice)}</span>
            </label>
          `).join("")}
        </div>
      </fieldset>
    `;
  }

  function updateSheetConfirmState() {
    const button = $("#itemSheetConfirm");
    const requiredGroups = $$("#itemSheetOptions [data-required='true']");
    const missingGroups = requiredGroups.filter((group) => !$("input:checked", group));
    requiredGroups.forEach((group) => group.classList.toggle("missing-required", missingGroups.includes(group)));
    button.disabled = missingGroups.length > 0;
    return missingGroups.length === 0;
  }

  function sheetQuantity() {
    return Number($("#itemSheetQuantity").textContent || 1);
  }

  function setSheetQuantity(value, options = {}) {
    const quantity = Math.max(1, Math.min(20, Number(value || 1)));
    $("#itemSheetQuantity").textContent = String(quantity);
    $("#quantityMinus").disabled = quantity <= 1;
    $("#quantityPlus").disabled = quantity >= 20;
    if (!options.skipSync) syncSheetToForm();
  }

  function syncSheetToForm() {
    const form = state.activeSheet?.form;
    if (!form) return;

    form.elements.quantity.value = String(sheetQuantity());
    form.elements.customDrink.value = "";

    clearHiddenOptions(form);
    $$("#itemSheetOptions input:checked").forEach((input) => {
      const groupLabel = input.dataset.optionGroupLabel || "オプション";
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "drinkOptions";
      hidden.value = `${groupLabel}: ${input.value}`;
      hidden.dataset.hiddenOption = "true";
      form.appendChild(hidden);
    });
  }

  function renderMenuPickers() {
    $$("[data-drink-picker]").forEach((picker) => renderMenuPicker(picker));
  }

  function renderMenuPicker(picker) {
    const form = picker.closest(".order-form");
    const fallbackCategory = firstCategoryId();
    const requestedCategory = picker.dataset.activeCategory || fallbackCategory;
    const activeCategory = state.menu.some((category) => category.id === requestedCategory) ? requestedCategory : fallbackCategory;
    let currentCategoryId = form.elements.drinkCategoryId?.value || "";
    let currentItemId = form.elements.drinkItemId?.value || "";
    const currentItem = findMenuItem(currentCategoryId, currentItemId);

    if (currentItemId && !currentItem) {
      clearDrinkSelection(form);
      currentCategoryId = "";
      currentItemId = "";
    }

    picker.dataset.activeCategory = activeCategory;
    $("[data-menu-categories]", picker).innerHTML = state.menu.map(
      (category) => `
        <button class="menu-category-button ${category.id === activeCategory ? "active" : ""}" type="button" data-menu-category="${category.id}">
          ${escapeHtml(category.label)}
        </button>
      `
    ).join("");

    const useCustomOrder = form.dataset.source === "reception" && state.receptionMenuMode === "custom";
    const stats = useCustomOrder ? menuOrderStats(state.menu) : null;
    $("[data-drink-buttons]", picker).innerHTML = state.menu
      .map((category) =>
        menuCategorySectionBlock(
          category,
          currentCategoryId,
          currentItemId,
          form.dataset.source,
          useCustomOrder ? rankedMenuSubcategoryGroups(category, stats) : menuSubcategoryGroups(category)
        )
      )
      .join("") || `<div class="menu-empty">商品未設定</div>`;

    if (currentItem && state.activeSheet?.form === form) renderItemSheet(form, currentItem);
    updateConfirmButtonState(form);
    updateCustomDrinkField(form);
  }

  function menuCategorySectionBlock(category, currentCategoryId, currentItemId, source, groups = menuSubcategoryGroups(category)) {
    const showSubcategories = shouldShowSubcategoryUi(groups);
    const subcategoryNav = showSubcategories
      ? `
        <div class="menu-subcategory-row" aria-label="${escapeHtml(category.label)}のサブカテゴリ">
          ${groups.map((group, index) => `
            <button class="menu-subcategory-chip ${index === 0 ? "active" : ""}" type="button" data-menu-subcategory="${escapeHtml(subcategoryKey(category.id, group.id))}">
              ${escapeHtml(group.label)}
            </button>
          `).join("")}
        </div>
      `
      : "";
    const groupBlocks = groups
      .map((group) => {
        const itemButtons = group.items.map((item) => {
        const selectedCount = cartQuantityForMenuItem(source, category.id, item);
        const classes = [
          "choice-button",
          category.id === currentCategoryId && item.id === currentItemId ? "active" : "",
          selectedCount ? "in-cart" : "",
        ].filter(Boolean).join(" ");

        return `
          <button class="${classes}" type="button" data-menu-category-id="${escapeHtml(category.id)}" data-menu-item-id="${escapeHtml(item.id)}" data-choice-value="${escapeHtml(item.name)}">
            <span class="menu-item-name">${escapeHtml(item.name)}</span>
            <span class="menu-item-meta">
              <span class="menu-item-price">${escapeHtml(formatPrice(item.price))}</span>
              ${selectedCount ? `<span class="menu-item-count">${escapeHtml(String(selectedCount))}杯</span>` : ""}
            </span>
          </button>
        `;
        }).join("");

        return `
          <section class="menu-subcategory-section" data-menu-subsection="${escapeHtml(subcategoryKey(category.id, group.id))}">
            ${showSubcategories ? `<h4 class="menu-subcategory-heading">${escapeHtml(group.label)}</h4>` : ""}
            ${itemButtons}
          </section>
        `;
      })
      .join("");

    return `
      <section class="menu-category-section" data-menu-section="${escapeHtml(category.id)}">
        <h3 class="menu-category-heading">${escapeHtml(category.label)}</h3>
        ${subcategoryNav}
        ${groupBlocks || `<div class="menu-empty compact">商品未設定</div>`}
      </section>
    `;
  }

  function menuSubcategoryGroups(category) {
    const items = category.items || [];
    const subcategories = category.subcategories?.length
      ? category.subcategories
      : [{ id: DEFAULT_SUBCATEGORY_ID, label: DEFAULT_SUBCATEGORY_LABEL }];
    return subcategories
      .map((subcategory) => ({
        ...subcategory,
        items: items.filter((item) => item.subcategory_id === subcategory.id),
      }))
      .filter((group) => group.items.length);
  }

  function rankedMenuSubcategoryGroups(category, stats) {
    return menuSubcategoryGroups(category)
      .map((group, groupIndex) => ({
        ...group,
        groupIndex,
        count: stats.subcategoryCounts.get(subcategoryKey(category.id, group.id)) || 0,
        items: group.items
          .map((item, itemIndex) => ({ item, itemIndex, count: stats.itemCount(item) }))
          .sort((a, b) => b.count - a.count || a.itemIndex - b.itemIndex)
          .map((entry) => entry.item),
      }))
      .sort((a, b) => b.count - a.count || a.groupIndex - b.groupIndex)
      .map(({ groupIndex, count, ...group }) => group);
  }

  function shouldShowSubcategoryUi(groups) {
    return groups.length > 1 || groups.some((group) => group.id !== DEFAULT_SUBCATEGORY_ID || group.label !== DEFAULT_SUBCATEGORY_LABEL);
  }

  function subcategoryKey(categoryId, subcategoryId) {
    return `${categoryId}::${subcategoryId}`;
  }

  function updateMenuCategoryActive(picker, categoryId) {
    $$("[data-menu-category]", picker).forEach((button) => {
      button.classList.toggle("active", button.dataset.menuCategory === categoryId);
    });
  }

  function scrollToMenuSection(picker, categoryId) {
    const section = $$("[data-menu-section]", picker).find((item) => item.dataset.menuSection === categoryId);
    scrollMenuContentTo(picker, section);
  }

  function updateMenuSubcategoryActive(picker, subcategoryId) {
    $$("[data-menu-subcategory]", picker).forEach((button) => {
      button.classList.toggle("active", button.dataset.menuSubcategory === subcategoryId);
    });
  }

  function scrollToMenuSubcategory(picker, subcategoryId) {
    const section = $$("[data-menu-subsection]", picker).find((item) => item.dataset.menuSubsection === subcategoryId);
    scrollMenuContentTo(picker, section);
  }

  function scrollMenuContentTo(picker, section) {
    const scroller = $("[data-drink-buttons]", picker);
    if (!scroller || !section) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const top = Math.min(maxTop, Math.max(0, sectionRect.top - scrollerRect.top + scroller.scrollTop));
    animateMenuScroll(scroller, top, 160);
  }

  function animateMenuScroll(scroller, targetTop, duration = 160) {
    if (scroller._menuScrollFrame) cancelAnimationFrame(scroller._menuScrollFrame);
    const startTop = scroller.scrollTop;
    const distance = targetTop - startTop;
    if (Math.abs(distance) < 2) {
      scroller.scrollTop = targetTop;
      return;
    }
    const startTime = performance.now();
    const easeOut = (progress) => 1 - Math.pow(1 - progress, 3);

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      scroller.scrollTop = startTop + distance * easeOut(progress);
      if (progress < 1) {
        scroller._menuScrollFrame = requestAnimationFrame(tick);
      }
    };

    scroller._menuScrollFrame = requestAnimationFrame(tick);
  }

  function firstCategoryId() {
    return state.menu.find((category) => category.items.length)?.id || state.menu[0]?.id || DEFAULT_MENU[0].id;
  }

  function findMenuItem(categoryId, itemId) {
    const category = state.menu.find((item) => item.id === categoryId);
    return category?.items.find((item) => item.id === itemId) || null;
  }

  async function configureSupabaseFromStorage() {
    const config = readConfig();
    if (!config.url || !config.anonKey) {
      setSyncMode("local", "デモ同期");
      return;
    }

    if (!window.supabase) {
      setSyncMode("local", "Supabase読込不可");
      toast("Supabaseライブラリを読み込めません");
      return;
    }

    try {
      state.supabase = window.supabase.createClient(config.url, config.anonKey);
      state.realtimeChannel = state.supabase
        .channel("drink_relay_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "drink_orders" },
          (payload) => {
            handleRealtimePayload(payload);
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "drink_app_settings" },
          (payload) => {
            handleSharedSettingsPayload(payload);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setSyncMode("supabase", "共有同期");
          }
          if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
            setSyncMode("supabase", "受信接続エラー");
          }
        });
      setSyncMode("supabase", "共有接続中");
    } catch (error) {
      console.error(error);
      setSyncMode("local", "接続失敗");
      toast("共有同期の接続に失敗しました");
    }
  }

  function setSyncMode(mode, label) {
    state.syncMode = mode;
    const badge = $("#syncBadge");
    if (!badge) return;
    badge.classList.toggle("is-shared", mode === "supabase");
    badge.classList.toggle("is-local", mode !== "supabase");
    if (mode === "supabase") {
      badge.textContent = label || "共有同期";
    } else {
      badge.textContent = label || "デモ同期";
    }
  }

  async function loadSharedSettings() {
    if (state.syncMode !== "supabase" || !state.supabase) {
      return;
    }

    const row = await fetchSharedSettings();
    if (row) {
      applySharedSettings(row);
      state.sharedSettingsLoaded = true;
      return;
    }

    await saveSharedSettings(state.menu, { silent: true });
    state.sharedSettingsLoaded = true;
  }

  async function fetchSharedSettings() {
    if (state.syncMode !== "supabase" || !state.supabase) return null;
    const { data, error } = await state.supabase
      .from("drink_app_settings")
      .select("*")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();

    if (error) {
      console.error(error);
      toast(supabaseErrorMessage("共有設定テーブルを読み込めません", error), { long: true });
      return null;
    }

    return data || null;
  }

  async function saveSharedSettings(menu = state.menu, options = {}) {
    if (state.syncMode !== "supabase" || !state.supabase) return false;
    const { error } = await state.supabase
      .from("drink_app_settings")
      .upsert(
        {
          id: SETTINGS_ROW_ID,
          updated_at: new Date().toISOString(),
          menu,
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error(error);
      if (!options.silent) toast(supabaseErrorMessage("共有設定の保存に失敗しました", error), { long: true });
      return false;
    }

    state.sharedSettingsLoaded = true;
    return true;
  }

  function handleSharedSettingsPayload(payload) {
    if (payload.eventType === "DELETE" || !payload.new || payload.new.id !== SETTINGS_ROW_ID) return;
    if (configHasUnsavedChanges()) {
      toast("共有設定が更新されました。保存中の編集があるため反映していません");
      return;
    }
    applySharedSettings(payload.new, { fromRealtime: true });
  }

  function applySharedSettings(row, options = {}) {
    if (sharedSettingsHasMenu(row)) {
      state.menu = normalizeMenu(row.menu, { allowEmpty: true });
      localStorage.setItem(MENU_KEY, JSON.stringify(state.menu));
      renderMenuPickers();
    }

    if ($("#configDialog")?.open) {
      renderMenuEditor();
      state.configSnapshot = configDraftSnapshot();
    }

    if (options.fromRealtime) {
      toast("共有メニューを更新しました");
    }
  }

  function sharedSettingsHasMenu(row) {
    return Array.isArray(row?.menu) && row.menu.length > 0;
  }

  async function loadOrders() {
    if (state.syncMode === "supabase" && state.supabase) {
      const { data, error } = await state.supabase
        .from("drink_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error(error);
        toast(supabaseErrorMessage("共有データの読み込みに失敗しました", error), { long: true });
        setSyncMode("local", "共有読込失敗");
        loadLocalOrders();
        return;
      }

      state.orders = (data || []).map(normalizeOrder);
      sortOrders();
      return;
    }

    loadLocalOrders();
  }

  function loadLocalOrders() {
    try {
      state.orders = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]").map(normalizeOrder);
      sortOrders();
    } catch {
      state.orders = [];
    }
  }

  function saveLocalOrders() {
    localStorage.setItem(ORDER_KEY, JSON.stringify(state.orders.slice(0, MAX_HISTORY)));
    state.broadcast?.postMessage({ type: "orders-changed" });
  }

  async function createOrder(input) {
    const now = new Date().toISOString();
    const order = normalizeOrder({
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...input,
    });

    if (state.syncMode === "supabase" && state.supabase) {
      const { data, error } = await state.supabase.from("drink_orders").insert(toDatabaseRow(order)).select().single();
      if (error) {
        console.error(error);
        toast(supabaseErrorMessage("共有同期に失敗したためデモ同期へ保存しました", error), { long: true });
        setSyncMode("local", "送信失敗");
      } else {
        upsertOrder(normalizeOrder(data));
        state.knownIds.add(order.id);
        render();
        return;
      }
    }

    upsertOrder(order);
    state.knownIds.add(order.id);
    saveLocalOrders();
    render();
  }

  async function updateOrder(id, patch) {
    const order = state.orders.find((item) => item.id === id);
    if (!order) return;

    const next = normalizeOrder({
      ...order,
      ...patch,
      updated_at: new Date().toISOString(),
      events: [...(order.events || []), eventEntry(patch.status || "updated")],
    });

    if (patch.status === "made" && !next.made_at) next.made_at = new Date().toISOString();
    if (patch.status === "served" && !next.served_at) next.served_at = new Date().toISOString();
    if (patch.payment_status === "paid" && !next.paid_at) next.paid_at = new Date().toISOString();

    upsertOrder(next);
    if (state.syncMode === "local") saveLocalOrders();
    render();

    if (state.syncMode === "supabase" && state.supabase) {
      const { error } = await state.supabase.from("drink_orders").update(toDatabaseRow(next)).eq("id", id);
      if (error) {
        console.error(error);
        upsertOrder(order);
        render();
        toast("更新に失敗しました");
        return;
      }
    }
  }

  function handleRealtimePayload(payload) {
    if (payload.eventType === "DELETE") {
      state.orders = state.orders.filter((order) => order.id !== payload.old.id);
      render();
      return;
    }

    const order = normalizeOrder(payload.new);
    const isNew = !state.knownIds.has(order.id);
    upsertOrder(order);

    if (state.booted && isNew) {
      state.knownIds.add(order.id);
      notifyNewOrder(order);
    }

    render();
  }

  function detectNewOrders() {
    state.orders.forEach((order) => {
      if (state.booted && !state.knownIds.has(order.id)) {
        state.knownIds.add(order.id);
        notifyNewOrder(order);
      }
    });
  }

  function notifyNewOrder(order) {
    if (state.view === "bar") {
      if (state.soundEnabled) playChime();
    }
  }

  function handleOrderAction(event) {
    const button = event.target.closest("[data-order-action]");
    if (!button) return;
    const id = button.closest("[data-order-id]")?.dataset.orderId;
    const action = button.dataset.orderAction;
    if (!id) return;
    const order = state.orders.find((item) => item.id === id);
    if (!order) return;

    if (action === "making") updateOrder(id, { status: "making" });
    if (action === "made") updateOrder(id, { status: "made" });
    if (action === "served") {
      if (order.payment_status === "uncollected") {
        toast("未徴収です。先に会計済みにしてください");
        return;
      }
      updateOrder(id, { status: "served" });
    }
    if (action === "paid") updateOrder(id, { payment_status: "paid" });
    if (action === "cancel") updateOrder(id, { status: "canceled" });
  }

  function render() {
    renderBar();
    if (window.lucide) window.lucide.createIcons();
  }

  function renderBar() {
    const openOrders = state.orders.filter((order) => !["served", "canceled"].includes(order.status));
    const visibleOrders = state.filter === "open" ? openOrders : state.orders;
    const uncollectedCount = openOrders.filter((order) => order.payment_status === "uncollected").length;
    const oldest = openOrders.length
      ? openOrders.reduce((oldestOrder, order) =>
          new Date(order.created_at) < new Date(oldestOrder.created_at) ? order : oldestOrder
        )
      : null;

    $("#openCount").textContent = String(openOrders.length);
    $("#oldestElapsed").textContent = oldest ? elapsedLabel(oldest.created_at, { short: true }) : "-";
    $("#uncollectedCount").textContent = String(uncollectedCount);

    const container = $("#barOrders");
    if (!visibleOrders.length) {
      container.innerHTML = `<div class="empty-state">表示するオーダーはありません</div>`;
      return;
    }

    container.innerHTML = barOrderColumns(visibleOrders)
      .map((orders) => `<div class="order-column">${orders.map((order) => orderCard(order)).join("")}</div>`)
      .join("");
  }

  function barOrderColumns(orders) {
    const columnCount = 3;
    const perColumn = Math.max(3, Math.ceil(orders.length / columnCount));
    return Array.from({ length: columnCount }, (_, index) => {
      const start = index * perColumn;
      return orders.slice(start, start + perColumn);
    });
  }

  function menuOrderStats(categories) {
    const itemCounts = new Map();
    state.orders.forEach((order) => {
      if (order.status === "canceled") return;
      const name = String(order.drink_name || "").trim();
      if (!name) return;
      itemCounts.set(name, (itemCounts.get(name) || 0) + Number(order.quantity || 1));
    });

    const categoryCounts = new Map();
    const subcategoryCounts = new Map();
    const itemCount = (item) => itemCounts.get(item.name) || 0;

    categories.forEach((category) => {
      let categoryTotal = 0;
      menuSubcategoryGroups(category).forEach((group) => {
        const groupTotal = group.items.reduce((sum, item) => sum + itemCount(item), 0);
        subcategoryCounts.set(subcategoryKey(category.id, group.id), groupTotal);
        categoryTotal += groupTotal;
      });
      categoryCounts.set(category.id, categoryTotal);
    });

    return { categoryCounts, subcategoryCounts, itemCount };
  }

  function orderCard(order, options = {}) {
    const compact = Boolean(options.compact);
    const location = locationLabel(order);
    const locationBadges = barLocationBadges(order);
    const shouldShowMetaLocation = !locationBadges && order.target !== "bar";
    const metaLocation = shouldShowMetaLocation ? `<span>${escapeHtml(location)}</span>` : "";
    const elapsedMinutes = minutesSince(order.created_at);
    const showElapsed = elapsedMinutes >= 5 && !["served", "canceled"].includes(order.status);
    const elapsedClass = elapsedMinutes >= 10 ? " late" : "";
    const elapsed = showElapsed ? `<span class="elapsed${elapsedClass}">${escapeHtml(elapsedLabel(order.created_at))}</span>` : "";
    const statusClass = `status-${order.status}`;
    const paymentChip = order.payment_status === "uncollected"
      ? `<span class="chip payment-method">${escapeHtml(paymentMethodLabels[order.payment_method] || order.payment_method)}</span>`
      : "";
    const chipRow = paymentChip ? `<div class="chip-row">${paymentChip}</div>` : "";

    return `
      <article class="order-card ${statusClass}" data-order-id="${escapeHtml(order.id)}">
        <div class="order-main">
          <div class="order-title-row">
            <span class="order-target-label">${escapeHtml(barTargetLabel(order))}</span>
            ${locationBadges}
            <span class="order-title">${escapeHtml(order.drink_name)}</span>
            <span class="qty-pill">x${escapeHtml(String(order.quantity))}</span>
            ${elapsed}
          </div>
          ${chipRow}
          <div class="order-meta">
            ${metaLocation}
            <span>${escapeHtml(formatTime(order.created_at))}</span>
          </div>
          ${order.notes ? `<p class="order-note">${escapeHtml(order.notes)}</p>` : ""}
        </div>
        <div class="order-side">
          ${compact ? compactActions(order) : fullActions(order)}
        </div>
      </article>
    `;
  }

  function compactActions(order) {
    return "";
  }

  function fullActions(order) {
    if (order.status === "served" || order.status === "canceled") {
      return "";
    }

    return `
      <div class="status-actions">
        ${order.status !== "made" ? actionButton("made", "作成済み", "", "button-made") : ""}
        ${order.payment_status === "uncollected" ? actionButton("paid", "会計済み", "", "button-pay") : ""}
        ${actionButton("served", "提供済み", "", "button-served")}
      </div>
    `;
  }

  function actionButton(action, label, icon, className) {
    return `
      <button class="button ${className}" type="button" data-order-action="${action}">
        ${icon ? `<i data-lucide="${icon}" aria-hidden="true"></i>` : ""}
        <span>${label}</span>
      </button>
    `;
  }

  function barTargetLabel(order) {
    if (order.target === "tournament") return "トナメ";
    if (order.target === "ring") return "リング";
    return targetLabels[order.target] || order.target;
  }

  function barLocationBadges(order) {
    if (!order.table_no && !order.seat_no) return "";
    const badges = [];
    if (order.table_no) badges.push(`<span class="order-location-label">${escapeHtml(order.table_no)}卓</span>`);
    if (order.seat_no) badges.push(`<span class="order-location-label">${escapeHtml(order.seat_no)}番席</span>`);
    return badges.join("");
  }

  function locationLabel(order) {
    if (order.target === "bar") return "バーカウンター";
    const table = order.table_no ? `T${order.table_no}` : "テーブル未指定";
    const seat = order.seat_no ? `席${order.seat_no}` : "席未指定";
    return `${table} / ${seat}`;
  }

  function elapsedLabel(dateString, options = {}) {
    const minutes = minutesSince(dateString);
    if (minutes < 1) return options.short ? "1分未満" : "経過 1分未満";
    if (minutes < 60) return options.short ? `${minutes}分` : `経過 ${minutes}分`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return options.short ? `${hours}時間${rest}分` : `経過 ${hours}時間${rest}分`;
  }

  function minutesSince(dateString) {
    return Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 60000));
  }

  function formatTime(dateString) {
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  }

  function upsertOrder(order) {
    const index = state.orders.findIndex((item) => item.id === order.id);
    if (index >= 0) state.orders[index] = order;
    else state.orders.unshift(order);
    sortOrders();
  }

  function sortOrders() {
    state.orders.sort((a, b) => {
      const aDone = ["served", "canceled"].includes(a.status);
      const bDone = ["served", "canceled"].includes(b.status);
      if (aDone !== bDone) return aDone ? 1 : -1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }

  function normalizeOrder(order) {
    return {
      id: order.id,
      created_at: order.created_at,
      updated_at: order.updated_at || order.created_at,
      source: order.source || "reception",
      drink_name: order.drink_name || "",
      quantity: Number(order.quantity || 1),
      target: order.target || "ring",
      table_no: order.table_no || "",
      seat_no: order.seat_no || "",
      payment_status: order.payment_status || "uncollected",
      payment_method: order.payment_method || "cash",
      notes: order.notes || "",
      status: order.status || "ordered",
      made_at: order.made_at || null,
      served_at: order.served_at || null,
      paid_at: order.paid_at || null,
      events: Array.isArray(order.events) ? order.events : [],
    };
  }

  function toDatabaseRow(order) {
    return {
      id: order.id,
      created_at: order.created_at,
      updated_at: order.updated_at,
      source: order.source,
      drink_name: order.drink_name,
      quantity: order.quantity,
      target: order.target,
      table_no: order.table_no,
      seat_no: order.seat_no,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      notes: order.notes,
      status: order.status,
      made_at: order.made_at,
      served_at: order.served_at,
      paid_at: order.paid_at,
      events: order.events,
    };
  }

  function eventEntry(type) {
    return { type, at: new Date().toISOString() };
  }

  function openConfig() {
    const config = readConfig();
    $("#supabaseUrl").value = config.url || "";
    $("#supabaseAnonKey").value = config.anonKey || "";
    renderMenuEditor();
    updateSoundButton();
    hideConfigUnsavedPrompt();
    state.configSnapshot = configDraftSnapshot();
    $("#configDialog").showModal();
  }

  async function saveConfig(event) {
    event?.preventDefault();
    const url = $("#supabaseUrl").value.trim();
    const anonKey = $("#supabaseAnonKey").value.trim();
    const nextMenu = readMenuSettingsFromForm();
    state.menu = nextMenu;
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, anonKey }));
    localStorage.setItem(MENU_KEY, JSON.stringify(nextMenu));
    state.configSnapshot = configDraftSnapshot();
    renderMenuPickers();
    hideConfigUnsavedPrompt();
    $("#configDialog").close();
    teardownSupabase();
    await configureSupabaseFromStorage();
    if (state.syncMode === "supabase" && state.supabase) {
      const existingSettings = await fetchSharedSettings();
      if (!state.sharedSettingsLoaded && sharedSettingsHasMenu(existingSettings)) {
        applySharedSettings(existingSettings);
      } else {
        await saveSharedSettings(nextMenu);
      }
    }
    await loadOrders();
    state.orders.forEach((order) => state.knownIds.add(order.id));
    render();
    toast("設定を保存しました");
  }

  function requestCloseConfig() {
    if (configHasUnsavedChanges()) {
      showConfigUnsavedPrompt();
      return;
    }
    hideConfigUnsavedPrompt();
    $("#configDialog").close();
  }

  function configDraftSnapshot() {
    return JSON.stringify({
      config: {
        url: $("#supabaseUrl").value.trim(),
        anonKey: $("#supabaseAnonKey").value.trim(),
      },
      menu: readMenuSettingsFromForm(),
    });
  }

  function configHasUnsavedChanges() {
    return $("#configDialog").open && configDraftSnapshot() !== state.configSnapshot;
  }

  function showConfigUnsavedPrompt() {
    $("#configUnsavedPrompt").hidden = false;
    if (window.lucide) window.lucide.createIcons();
  }

  function hideConfigUnsavedPrompt() {
    $("#configUnsavedPrompt").hidden = true;
  }

  async function clearConfig() {
    localStorage.removeItem(CONFIG_KEY);
    $("#supabaseUrl").value = DEFAULT_SUPABASE_URL;
    $("#supabaseAnonKey").value = DEFAULT_SUPABASE_ANON_KEY;
    state.sharedSettingsLoaded = false;
    $("#configDialog").close();
    teardownSupabase();
    await configureSupabaseFromStorage();
    await loadSharedSettings();
    await loadOrders();
    render();
    toast("共有同期に戻しました");
  }

  function readConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
      return {
        url: saved?.url || DEFAULT_SUPABASE_URL,
        anonKey: saved?.anonKey || DEFAULT_SUPABASE_ANON_KEY,
      };
    } catch {
      return {
        url: DEFAULT_SUPABASE_URL,
        anonKey: DEFAULT_SUPABASE_ANON_KEY,
      };
    }
  }

  function readMenuSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(MENU_KEY) || "null");
      if (saved) {
        return normalizeMenu(saved, { allowEmpty: true });
      }

      const legacyDrinks = JSON.parse(localStorage.getItem(LEGACY_DRINKS_KEY) || "null");
      if (Array.isArray(legacyDrinks)) {
        return normalizeMenu([
          {
            id: "soft",
            label: "ソフドリ",
            subcategories: [{ id: DEFAULT_SUBCATEGORY_ID, label: DEFAULT_SUBCATEGORY_LABEL }],
            items: parseMenuItems(legacyDrinks),
          },
          ...DEFAULT_MENU.slice(1),
        ]);
      }
    } catch {
    }

    return normalizeMenu(DEFAULT_MENU);
  }

  function readMenuSettingsFromForm() {
    const nextMenu = [];
    $$("#menuEditor [data-menu-editor-category]").forEach((block, index) => {
      const label = $("[data-menu-label]", block).value.trim();
      if (!label) return;
      const subcategories = subcategoriesFromEditorBlock(block);
      const items = $$("[data-menu-editor-item]", block)
        .map((row, itemIndex) => {
          const name = $("[data-menu-item-name]", row).value.trim();
          if (!name) return null;
          const optionGroups = $$("[data-menu-editor-option-group]", row)
            .map((group, groupIndex) => {
              const label = $("[data-menu-option-group-label]", group).value.trim();
              if (!label) return null;
              const choices = $$("[data-menu-option-choice]", group)
                .map((choiceRow) => $("[data-menu-option-choice-input]", choiceRow).value.trim())
                .filter(Boolean);
              return {
                id: $("[data-menu-option-group-id]", group).value || makeMenuId(label, groupIndex),
                label,
                required: Boolean($("[data-menu-option-group-required]", group)?.checked),
                choices: uniqueList(choices),
              };
            })
            .filter(Boolean);
          return {
            id: $("[data-menu-item-id]", row).value || makeMenuId(name, itemIndex),
            name,
            price: normalizePrice($("[data-menu-item-price]", row)?.value),
            subcategory_id:
              subcategoryIdFromEditorRow(row.closest("[data-menu-editor-subcategory]")) ||
              $("[data-menu-item-subcategory]", row)?.value ||
              subcategories[0]?.id ||
              DEFAULT_SUBCATEGORY_ID,
            optionGroups,
          };
        })
        .filter(Boolean);
      nextMenu.push({
        id: $("[data-menu-id]", block).value || makeMenuId(label, index),
        label,
        subcategories,
        items,
      });
    });
    return normalizeMenu(nextMenu, { allowEmpty: true });
  }

  function normalizeMenu(menu, options = {}) {
    const source = Array.isArray(menu)
      ? menu
      : DEFAULT_MENU.map((category) => ({
          ...category,
          items: parseMenuItems(menu?.[category.id] || []).map((name) => ({ name, price: 0, optionGroups: [] })),
        }));
    const usedIds = new Set();
    const normalized = source
      .map((category, index) => {
        const label = String(category.label || "").trim();
        if (!label) return null;
        const id = uniqueMenuId(makeMenuId(category.id || label, index), usedIds);
        const fallback = normalizeMenuItems(DEFAULT_MENU[index]?.items || []);
        const parsed = normalizeMenuItems(category.items || []);
        const rawItems = parsed.length || options.allowEmpty ? parsed : [...fallback];
        const subcategories = normalizeSubcategories(category, rawItems);
        return {
          id,
          label,
          subcategories,
          items: rawItems.map((item) => assignItemSubcategory(item, subcategories)),
        };
      })
      .filter(Boolean);

    return normalized.length ? normalized : cloneDefaultMenu();
  }

  function cloneDefaultMenu() {
    return DEFAULT_MENU.map((category) => ({
      ...category,
      subcategories: (category.subcategories || []).map((subcategory) => ({ ...subcategory })),
      items: category.items.map((item) => ({
        ...item,
        optionGroups: cloneOptionGroups(item.optionGroups || []),
      })),
    }));
  }

  function normalizeMenuItems(items) {
    const source = Array.isArray(items) ? items : parseMenuItems(items);
    const usedIds = new Set();
    return source
      .map((item, index) => normalizeMenuItem(item, index, usedIds))
      .filter(Boolean);
  }

  function normalizeMenuItem(item, index, usedIds) {
    if (typeof item === "string") {
      const name = item.trim();
      if (!name) return null;
      return {
        id: uniqueMenuId(makeMenuId(name, index), usedIds),
        name,
        price: 0,
        subcategory_id: "",
        optionGroups: [],
      };
    }

    const name = String(item?.name || item?.label || item?.title || item?.value || "").trim();
    if (!name) return null;
    const subcategoryId = String(item?.subcategory_id || item?.subcategoryId || item?.subCategoryId || "").trim();
    const subcategoryLabel = String(item?.subcategory_label || item?.subcategoryLabel || item?.subcategory || item?.subCategory || "").trim();
    return {
      id: uniqueMenuId(makeMenuId(item?.id || name, index), usedIds),
      name,
      price: normalizePrice(item?.price || item?.amount || item?.yen || 0),
      subcategory_id: subcategoryId,
      subcategory_label: subcategoryLabel,
      optionGroups: normalizeOptionGroups(item),
    };
  }

  function normalizeSubcategories(category, items) {
    const rawSubcategories =
      category?.subcategories || category?.sub_categories || category?.subCategories || category?.groups || [];
    const usedIds = new Set();
    let subcategories = Array.isArray(rawSubcategories)
      ? rawSubcategories
          .map((subcategory, index) => normalizeSubcategory(subcategory, index, usedIds))
          .filter(Boolean)
      : [];

    if (!subcategories.length) {
      const labels = uniqueList(items.map((item) => item.subcategory_label).filter(Boolean));
      subcategories = labels.map((label, index) => normalizeSubcategory({ label }, index, usedIds)).filter(Boolean);
    }

    if (!subcategories.length) {
      subcategories = [{ id: DEFAULT_SUBCATEGORY_ID, label: DEFAULT_SUBCATEGORY_LABEL }];
    }

    return subcategories;
  }

  function normalizeSubcategory(subcategory, index, usedIds) {
    if (typeof subcategory === "string") {
      const label = subcategory.trim();
      if (!label) return null;
      return {
        id: uniqueMenuId(makeMenuId(label, index), usedIds),
        label,
      };
    }

    const label = String(subcategory?.label || subcategory?.name || subcategory?.title || "").trim();
    if (!label) return null;
    return {
      id: uniqueMenuId(makeMenuId(subcategory?.id || label, index), usedIds),
      label,
    };
  }

  function assignItemSubcategory(item, subcategories) {
    const matchedById = subcategories.find((subcategory) => subcategory.id === item.subcategory_id);
    const matchedByLabel = subcategories.find((subcategory) => subcategory.label === item.subcategory_label);
    const subcategory = matchedById || matchedByLabel || subcategories[0];
    const { subcategory_label: _subcategoryLabel, ...nextItem } = item;
    return {
      ...nextItem,
      subcategory_id: subcategory?.id || DEFAULT_SUBCATEGORY_ID,
    };
  }

  function normalizePrice(value) {
    const numeric = Number(String(value ?? 0).replace(/[^\d.-]/g, ""));
    if (!Number.isFinite(numeric) || numeric < 0) return 0;
    return Math.round(numeric);
  }

  function formatPrice(value) {
    return `¥${normalizePrice(value).toLocaleString("ja-JP")}`;
  }

  function priceSuggestionValues() {
    return DEFAULT_PRICE_SUGGESTIONS;
  }

  function priceStepValues(currentPrice) {
    return uniqueList([...priceSuggestionValues(), normalizePrice(currentPrice)])
      .map(normalizePrice)
      .sort((a, b) => a - b);
  }

  function stepPriceSuggestion(input, direction) {
    const current = normalizePrice(input.value);
    const prices = priceStepValues(current);
    if (!prices.length) return;
    const next = direction > 0
      ? prices.find((price) => price > current) ?? prices[prices.length - 1]
      : [...prices].reverse().find((price) => price < current) ?? prices[0];
    input.value = String(next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function normalizeOptionGroups(item) {
    const rawGroups = item?.optionGroups || item?.option_groups || item?.optionCategories || item?.option_categories;
    if (Array.isArray(rawGroups)) {
      const usedIds = new Set();
      return rawGroups
        .map((group, index) => normalizeOptionGroup(group, index, usedIds))
        .filter(Boolean);
    }

    const legacyOptions = parseMenuItems(item?.options || []);
    if (!legacyOptions.length) return [];
    return [
      {
        id: "options",
        label: "オプション",
        required: false,
        choices: legacyOptions,
      },
    ];
  }

  function normalizeOptionGroup(group, index, usedIds) {
    const label = String(group?.label || group?.name || group?.title || "").trim();
    if (!label) return null;
    const choices = parseMenuItems(group?.choices || group?.options || group?.items || []);
    return {
      id: uniqueMenuId(makeMenuId(group?.id || label, index), usedIds),
      label,
      required: Boolean(group?.required || group?.isRequired || group?.requiredChoice),
      choices,
    };
  }

  function cloneOptionGroups(groups) {
    return groups.map((group) => ({
      ...group,
      choices: [...(group.choices || [])],
    }));
  }

  function parseMenuItems(value) {
    const rawItems = Array.isArray(value) ? value : String(value || "").split(/\r?\n/);
    const cleaned = rawItems
      .map((item) => String(item).trim())
      .filter(Boolean);
    return uniqueList(cleaned);
  }

  function uniqueList(items) {
    return items.filter((item, index) => items.indexOf(item) === index);
  }

  function makeMenuId(value, index) {
    const normalized = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized || `category-${index + 1}`;
  }

  function uniqueMenuId(id, usedIds) {
    let nextId = id;
    let suffix = 2;
    while (usedIds.has(nextId)) {
      nextId = `${id}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(nextId);
    return nextId;
  }

  function renderMenuEditor() {
    const activeId = activeMenuEditorCategoryId(state.menu);
    $("#menuEditor").innerHTML = `
      ${menuEditorCategoryTabs(state.menu, activeId)}
      <div class="menu-editor-panels" data-menu-editor-panels>
        ${state.menu.map((category) => menuEditorBlock(category, activeId)).join("")}
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  function activeMenuEditorCategoryId(menu) {
    const ids = menu.map((category) => category.id);
    const activeId = ids.includes(state.configActiveCategoryId) ? state.configActiveCategoryId : ids[0] || "";
    state.configActiveCategoryId = activeId;
    return activeId;
  }

  function menuEditorCategoryTabs(menu, activeId) {
    return `
      <div class="menu-editor-category-tabs" data-menu-editor-category-tabs aria-label="編集するカテゴリ">
        ${menu.map((category) => menuEditorCategoryTabBlock(category.id, category.label, category.items.length, activeId)).join("")}
      </div>
    `;
  }

  function menuEditorCategoryTabBlock(id, label, itemCount, activeId) {
    const isActive = id === activeId;
    return `
      <button class="menu-editor-category-tab ${isActive ? "active" : ""}" type="button" data-config-category-tab="${escapeHtml(id)}" aria-pressed="${isActive}">
        <span>${escapeHtml(label)}</span>
        <small>${escapeHtml(String(itemCount))}</small>
      </button>
    `;
  }

  function menuEditorCategoryIdFromBlock(block, index = 0) {
    return $("[data-menu-id]", block)?.value || `category-${index + 1}`;
  }

  function refreshMenuEditorCategoryTabs(preferredId = state.configActiveCategoryId) {
    const tabs = $("[data-menu-editor-category-tabs]");
    if (!tabs) return;
    const categories = $$("#menuEditor [data-menu-editor-category]");
    if (!categories.length) return;
    const ids = categories.map((block, index) => menuEditorCategoryIdFromBlock(block, index));
    const activeId = ids.includes(preferredId) ? preferredId : ids[0];
    state.configActiveCategoryId = activeId;
    tabs.innerHTML = categories.map((block, index) => {
      const id = menuEditorCategoryIdFromBlock(block, index);
      const label = $("[data-menu-label]", block)?.value.trim() || `カテゴリ${index + 1}`;
      const itemCount = $$("[data-menu-editor-item]", block).length;
      return menuEditorCategoryTabBlock(id, label, itemCount, activeId);
    }).join("");
    selectMenuEditorCategory(activeId);
  }

  function selectMenuEditorCategory(categoryId) {
    state.configActiveCategoryId = categoryId;
    $$("[data-config-category-tab]").forEach((button) => {
      const active = button.dataset.configCategoryTab === categoryId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    $$("[data-menu-editor-category]").forEach((block, index) => {
      const active = menuEditorCategoryIdFromBlock(block, index) === categoryId;
      block.classList.toggle("active", active);
      block.hidden = !active;
    });
  }

  function menuEditorBlock(category, activeId) {
    const isActive = category.id === activeId;
    const subcategories = category.subcategories || [];
    return `
      <section class="menu-editor-row ${isActive ? "active" : ""}" data-menu-editor-category ${isActive ? "" : "hidden"}>
        <input data-menu-id type="hidden" value="${escapeHtml(category.id)}">
        <div class="menu-editor-category-head">
          <label>
            <span>カテゴリ</span>
            <input data-menu-label type="text" value="${escapeHtml(category.label)}">
          </label>
          <button class="icon-button danger-button" type="button" data-remove-menu-category aria-label="カテゴリ削除" title="カテゴリ削除">
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
        </div>
        <div class="menu-editor-subcategories">
          <div class="menu-editor-subcategory-head">
            <span class="menu-editor-subtitle">サブカテゴリと商品</span>
          </div>
          <div class="menu-editor-subcategory-list" data-menu-editor-subcategories>
            ${subcategories.map((subcategory) => menuEditorSubcategoryBlock(subcategory, itemsForEditorSubcategory(category.items, subcategory.id))).join("")}
          </div>
          <button class="button button-quiet menu-add-subcategory" type="button" data-add-menu-subcategory>
            <i data-lucide="plus" aria-hidden="true"></i>
            <span>サブカテゴリ追加</span>
          </button>
        </div>
      </section>
    `;
  }

  function itemsForEditorSubcategory(items = [], subcategoryId) {
    return items.filter((item) => item.subcategory_id === subcategoryId);
  }

  function menuEditorSubcategoryBlock(subcategory, items = []) {
    const itemBlocks = items.length
      ? items.map((item) => menuEditorItemBlock(item, { subcategoryId: subcategory.id })).join("")
      : `<div class="menu-editor-empty">この中にドリンクを追加できます</div>`;
    return `
      <section class="menu-editor-subcategory" data-menu-editor-subcategory>
        <div class="menu-editor-subcategory-bar">
          <input data-menu-subcategory-id type="hidden" value="${escapeHtml(subcategory.id || "")}">
          <input data-menu-subcategory-label type="text" value="${escapeHtml(subcategory.label || "")}" placeholder="例: 水、お茶">
          <button class="icon-button danger-button" type="button" data-remove-menu-subcategory aria-label="サブカテゴリ削除" title="サブカテゴリ削除">
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
        </div>
        <div class="menu-editor-items" data-menu-editor-items>
          ${itemBlocks}
        </div>
        <button class="button button-quiet menu-add-item" type="button" data-add-menu-item>
          <i data-lucide="plus" aria-hidden="true"></i>
          <span>この中にドリンク追加</span>
        </button>
      </section>
    `;
  }

  function subcategoriesFromEditorBlock(categoryBlock) {
    const usedIds = new Set();
    const subcategories = $$("[data-menu-editor-subcategory]", categoryBlock)
      .map((row, index) => {
        const label = $("[data-menu-subcategory-label]", row)?.value.trim() || "";
        if (!label) return null;
        return {
          id: uniqueMenuId(subcategoryIdFromEditorRow(row, index) || makeMenuId(label, index), usedIds),
          label,
        };
      })
      .filter(Boolean);

    return subcategories.length
      ? subcategories
      : [{ id: DEFAULT_SUBCATEGORY_ID, label: DEFAULT_SUBCATEGORY_LABEL }];
  }

  function subcategoryIdFromEditorRow(row, index = 0) {
    if (!row) return "";
    return $("[data-menu-subcategory-id]", row)?.value || makeMenuId($("[data-menu-subcategory-label]", row)?.value || DEFAULT_SUBCATEGORY_LABEL, index);
  }

  function refreshItemSubcategoryOptions(categoryBlock) {
    if (!categoryBlock) return;
    $$("[data-menu-editor-subcategory]", categoryBlock).forEach((subcategory, index) => {
      const subcategoryId = subcategoryIdFromEditorRow(subcategory, index) || DEFAULT_SUBCATEGORY_ID;
      $$("[data-menu-item-subcategory]", subcategory).forEach((input) => {
        input.value = subcategoryId;
      });
    });
  }

  function addMenuEditorSubcategory(categoryBlock) {
    if (!categoryBlock) return;
    const index = $$("[data-menu-editor-subcategory]", categoryBlock).length;
    const id = `subcategory-${Date.now()}-${index}`;
    $("[data-menu-editor-subcategories]", categoryBlock).insertAdjacentHTML(
      "beforeend",
      menuEditorSubcategoryBlock({ id, label: `サブカテゴリ${index + 1}` }, [])
    );
    refreshItemSubcategoryOptions(categoryBlock);
  }

  function removeMenuEditorSubcategory(row) {
    const categoryBlock = row?.closest("[data-menu-editor-category]");
    if (!row || !categoryBlock) return;
    row.remove();
    if (!$$("[data-menu-editor-subcategory]", categoryBlock).length) {
      $("[data-menu-editor-subcategories]", categoryBlock).insertAdjacentHTML(
        "beforeend",
        menuEditorSubcategoryBlock({ id: DEFAULT_SUBCATEGORY_ID, label: DEFAULT_SUBCATEGORY_LABEL }, [])
      );
    }
    refreshItemSubcategoryOptions(categoryBlock);
  }

  function menuEditorItemBlock(item, options = {}) {
    const isOpen = Boolean(options.open);
    const price = normalizePrice(item.price);
    const subcategoryId = options.subcategoryId || item.subcategory_id || DEFAULT_SUBCATEGORY_ID;
    return `
      <div class="menu-editor-item ${isOpen ? "open" : ""}" data-menu-editor-item>
        <input data-menu-item-id type="hidden" value="${escapeHtml(item.id || "")}">
        <input data-menu-item-subcategory type="hidden" value="${escapeHtml(subcategoryId)}">
        <div class="menu-editor-item-main">
          <div class="menu-editor-product-fields">
            <label>
              <span>商品名</span>
              <input data-menu-item-name type="text" value="${escapeHtml(item.name || "")}">
            </label>
            <label>
              <span>価格</span>
              <input data-menu-item-price type="number" min="0" step="10" value="${escapeHtml(String(price))}">
            </label>
          </div>
          <div class="menu-editor-item-detail">
            <div class="menu-editor-options-block">
              <span class="menu-editor-subtitle">オプションカテゴリ</span>
              ${menuEditorOptionTemplateButtons()}
              <div class="menu-editor-template-picker" data-option-template-picker hidden></div>
              <div class="menu-editor-option-groups" data-menu-editor-option-groups>
                ${(item.optionGroups || []).map((group) => menuEditorOptionGroupBlock(group)).join("")}
              </div>
              <button class="button button-quiet menu-add-option" type="button" data-add-menu-option-group>
                <i data-lucide="plus" aria-hidden="true"></i>
                <span>オプションカテゴリ追加</span>
              </button>
            </div>
          </div>
        </div>
        <div class="menu-editor-item-actions">
          <button class="button button-quiet menu-edit-item" type="button" data-edit-menu-item aria-expanded="${isOpen}" aria-label="${isOpen ? "閉じる" : "編集"}" title="${isOpen ? "閉じる" : "編集"}">
            <i data-lucide="pencil" aria-hidden="true"></i>
          </button>
          <button class="icon-button danger-button" type="button" data-remove-menu-item aria-label="商品削除" title="商品削除">
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
  }

  function setMenuEditorItemOpen(item, isOpen) {
    if (!item) return;
    item.classList.toggle("open", isOpen);
    const editButton = $("[data-edit-menu-item]", item);
    if (!editButton) return;
    editButton.setAttribute("aria-expanded", String(isOpen));
    editButton.setAttribute("aria-label", isOpen ? "閉じる" : "編集");
    editButton.setAttribute("title", isOpen ? "閉じる" : "編集");
    if (!isOpen) closeOptionTemplatePicker(item);
  }

  function closeOtherMenuEditorItems(activeItem) {
    $$("#menuEditor [data-menu-editor-item].open").forEach((item) => {
      if (item === activeItem) return;
      setMenuEditorItemOpen(item, false);
    });
  }

  function closeOtherOptionTemplatePickers(activeItem) {
    $$("#menuEditor [data-menu-editor-item]").forEach((item) => {
      if (item === activeItem) return;
      closeOptionTemplatePicker(item);
    });
  }

  function showOptionTemplatePicker(item, templateId) {
    if (!item) return;
    const template = OPTION_TEMPLATES.find((option) => option.id === templateId);
    const picker = $("[data-option-template-picker]", item);
    if (!template || !picker) return;

    const singleChoice = template.choices.length === 1;
    closeOtherOptionTemplatePickers(item);
    picker.hidden = false;
    picker.classList.remove("is-closing");
    picker.innerHTML = `
      <section class="menu-editor-template-panel">
        <div class="menu-editor-template-panel-head">
          <strong>${escapeHtml(template.label)}</strong>
          <button class="icon-button" type="button" data-cancel-option-template aria-label="閉じる" title="閉じる">
            <i data-lucide="x" aria-hidden="true"></i>
          </button>
        </div>
        <div class="menu-editor-template-choice-grid">
          ${template.choices.map((choice) => `
            <label class="menu-editor-template-check">
              <input data-option-template-choice type="checkbox" value="${escapeHtml(choice)}" ${singleChoice ? "checked" : ""}>
              <span>${escapeHtml(choice)}</span>
            </label>
          `).join("")}
        </div>
        <div class="menu-editor-template-actions">
          <button class="button button-quiet" type="button" data-template-select-all>全選択</button>
          <button class="button button-quiet" type="button" data-template-clear>解除</button>
          <button class="button button-primary" type="button" data-apply-option-template="${escapeHtml(template.id)}">
            選択した内容を追加
          </button>
        </div>
      </section>
    `;
    requestAnimationFrame(() => picker.classList.add("is-open"));

    if (window.lucide) window.lucide.createIcons();
  }

  function closeOptionTemplatePicker(item) {
    const picker = item ? $("[data-option-template-picker]", item) : null;
    if (!picker || picker.hidden) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const finishClose = () => {
      if (!picker.classList.contains("is-closing") && !reduceMotion) return;
      picker.hidden = true;
      picker.innerHTML = "";
      picker.classList.remove("is-open", "is-closing");
    };
    picker.classList.remove("is-open");
    if (reduceMotion) {
      picker.classList.add("is-closing");
      finishClose();
      return;
    }
    picker.classList.add("is-closing");
    window.setTimeout(finishClose, 170);
  }

  function menuEditorOptionTemplateButtons() {
    return `
      <div class="menu-editor-template-row" aria-label="よく使うオプション">
        <span>よく使う</span>
        <div class="menu-editor-template-buttons">
          ${OPTION_TEMPLATES.map((template) => `
            <button class="menu-editor-template-button" type="button" data-add-option-template="${escapeHtml(template.id)}">
              + ${escapeHtml(template.label)}
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function addOptionTemplateToEditorItem(item, templateId, selectedChoices = []) {
    if (!item) return;
    const template = OPTION_TEMPLATES.find((option) => option.id === templateId);
    if (!template) return;
    const templateChoices = uniqueList(selectedChoices).filter(Boolean);
    if (!templateChoices.length) {
      toast("追加する内容を選択してください");
      return;
    }

    const existingGroup = $$("[data-menu-editor-option-group]", item).find((group) =>
      $("[data-menu-option-group-label]", group)?.value.trim() === template.label
    );

    if (existingGroup) {
      const choicesWrap = $("[data-menu-editor-option-choices]", existingGroup);
      const existingChoices = new Set(
        $$("[data-menu-option-choice-input]", existingGroup).map((input) => input.value.trim()).filter(Boolean)
      );
      let addedCount = 0;
      templateChoices.forEach((choice) => {
        if (existingChoices.has(choice)) return;
        choicesWrap.insertAdjacentHTML("beforeend", menuEditorOptionChoiceBlock(choice));
        addedCount += 1;
      });
      if (template.required) {
        const requiredInput = $("[data-menu-option-group-required]", existingGroup);
        if (requiredInput) requiredInput.checked = true;
      }
      toast(addedCount ? `${template.label}の不足分を追加しました` : `${template.label}は追加済みです`);
    } else {
      const groupsWrap = $("[data-menu-editor-option-groups]", item);
      groupsWrap.insertAdjacentHTML(
        "beforeend",
        menuEditorOptionGroupBlock({
          id: `${template.id}-${Date.now()}`,
          label: template.label,
          required: template.required,
          choices: templateChoices,
        })
      );
      toast(`${template.label}を追加しました`);
    }

    closeOptionTemplatePicker(item);
    if (window.lucide) window.lucide.createIcons();
  }

  function menuEditorOptionGroupBlock(group) {
    return `
      <section class="menu-editor-option-group" data-menu-editor-option-group>
        <input data-menu-option-group-id type="hidden" value="${escapeHtml(group.id || "")}">
        <div class="menu-editor-option-group-head">
          <label>
            <span>カテゴリ名</span>
            <input data-menu-option-group-label type="text" value="${escapeHtml(group.label || "")}" placeholder="例: 氷">
          </label>
          <button class="icon-button danger-button" type="button" data-remove-menu-option-group aria-label="オプションカテゴリ削除" title="オプションカテゴリ削除">
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
        </div>
        <label class="menu-editor-check">
          <input data-menu-option-group-required type="checkbox" ${group.required ? "checked" : ""}>
          <span>選択必須</span>
        </label>
        <div class="menu-editor-option-choices" data-menu-editor-option-choices>
          ${(group.choices || []).map((choice) => menuEditorOptionChoiceBlock(choice)).join("")}
        </div>
        <button class="button button-quiet menu-add-choice" type="button" data-add-menu-option-choice>
          <i data-lucide="plus" aria-hidden="true"></i>
          <span>選択肢追加</span>
        </button>
      </section>
    `;
  }

  function menuEditorOptionChoiceBlock(choice) {
    return `
      <div class="menu-editor-option-choice" data-menu-option-choice>
        <input data-menu-option-choice-input type="text" value="${escapeHtml(choice)}" placeholder="例: 氷なし">
        <button class="icon-button danger-button" type="button" data-remove-menu-option-choice aria-label="選択肢削除" title="選択肢削除">
          <i data-lucide="trash-2" aria-hidden="true"></i>
        </button>
      </div>
    `;
  }

  function addMenuEditorCategory() {
    const index = $$("#menuEditor [data-menu-editor-category]").length;
    const id = `custom-${Date.now()}-${index}`;
    const subcategories = [{ id: DEFAULT_SUBCATEGORY_ID, label: DEFAULT_SUBCATEGORY_LABEL }];
    const panels = $("[data-menu-editor-panels]") || $("#menuEditor");
    panels.insertAdjacentHTML(
      "beforeend",
      menuEditorBlock({ id, label: `カテゴリ${index + 1}`, subcategories, items: [] }, id)
    );
    refreshMenuEditorCategoryTabs(id);
    if (window.lucide) window.lucide.createIcons();
  }

  function readSoundSetting() {
    const saved = localStorage.getItem(SOUND_KEY);
    return saved === null ? true : saved === "true";
  }

  function readSoundChoice() {
    return normalizeSoundChoice(localStorage.getItem(SOUND_CHOICE_KEY) || SOUND_OPTIONS[0].id);
  }

  function readReceptionMenuMode() {
    return localStorage.getItem(RECEPTION_MENU_MODE_KEY) === "custom" ? "custom" : "normal";
  }

  function normalizeSoundChoice(value) {
    return SOUND_OPTIONS.some((option) => option.id === value) ? value : SOUND_OPTIONS[0].id;
  }

  function selectedSoundOption() {
    return SOUND_OPTIONS.find((option) => option.id === state.soundChoice) || SOUND_OPTIONS[0];
  }

  function saveSoundSetting() {
    localStorage.setItem(SOUND_KEY, String(state.soundEnabled));
  }

  function saveSoundChoice() {
    localStorage.setItem(SOUND_CHOICE_KEY, state.soundChoice);
  }

  function updateSoundButton() {
    const button = $("#soundToggle");
    const status = $("#soundStatus");
    const choice = $("#soundChoice");
    if (!button || !status) return;
    button.setAttribute("aria-pressed", String(state.soundEnabled));
    status.textContent = state.soundEnabled ? "オン" : "オフ";
    if (choice) choice.value = state.soundChoice;
  }

  function setupAudioUnlock() {
    const unlock = () => {
      if (state.soundEnabled) unlockAudio();
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
  }

  function teardownSupabase() {
    if (state.realtimeChannel && state.supabase) {
      state.supabase.removeChannel(state.realtimeChannel);
    }
    state.supabase = null;
    state.realtimeChannel = null;
  }

  function supabaseErrorMessage(prefix, error) {
    const detail = [error?.message, error?.details, error?.hint, error?.code]
      .filter(Boolean)
      .join(" / ");
    return detail ? `${prefix}: ${detail}` : prefix;
  }

  async function unlockAudio() {
    if (!state.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      state.audioContext = new AudioContextClass();
    }
    if (state.audioContext.state === "suspended") {
      await state.audioContext.resume();
    }

    primeNotificationAudio();
  }

  async function playChime() {
    if (await playNotificationAudio()) return;
    playFallbackBell();
  }

  function primeNotificationAudio() {
    const option = selectedSoundOption();
    if (!option.url) return;
    if (state.notificationAudio && state.notificationAudioId === option.id) return;
    resetNotificationAudio();
    const audio = new Audio(option.url);
    audio.preload = "auto";
    audio.volume = 1;
    audio.addEventListener("error", () => {
      state.notificationAudioUnavailable = true;
    }, { once: true });
    state.notificationAudio = audio;
    state.notificationAudioId = option.id;
  }

  async function playNotificationAudio() {
    if (!selectedSoundOption().url) return false;
    if (state.notificationAudioUnavailable) return false;
    primeNotificationAudio();
    const audio = state.notificationAudio;
    if (!audio) return false;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }

  function resetNotificationAudio() {
    if (state.notificationAudio) {
      state.notificationAudio.pause();
    }
    state.notificationAudio = null;
    state.notificationAudioUnavailable = false;
    state.notificationAudioId = "";
  }

  function playFallbackBell() {
    if (!state.audioContext) return;
    const now = state.audioContext.currentTime;
    [1568, 1976, 1568, 1976].forEach((frequency, index) => {
      const oscillator = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
      gain.gain.setValueAtTime(0.0001, now + index * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.65, now + index * 0.11 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.11 + 0.18);
      oscillator.connect(gain).connect(state.audioContext.destination);
      oscillator.start(now + index * 0.11);
      oscillator.stop(now + index * 0.11 + 0.22);
    });
  }

  function toast(message, options = {}) {
    const region = $("#toastRegion");
    const node = document.createElement("div");
    node.className = `toast${options.long ? " long" : ""}`;
    node.textContent = message;
    region.appendChild(node);
    setTimeout(() => {
      node.remove();
    }, options.long ? 9000 : 2800);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();

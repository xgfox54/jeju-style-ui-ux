/* jeju-behaviors.js — dependency-free common behaviors v0.6.0 */
(() => {
  "use strict";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const SVG_NS = "http://www.w3.org/2000/svg";

  function spriteBase() {
    const use = document.querySelector(".jeju-icon use");
    const href = use ? use.getAttribute("href") || "" : "";
    return href.split("#")[0];
  }

  function iconElement(name) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "jeju-icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", spriteBase() + "#jeju-icon-" + name);
    svg.appendChild(use);
    return svg;
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);
    return (exponent === 0 ? value : value.toFixed(1)) + " " + units[exponent];
  }

  function initTabs(root = document) {
    qsa("[data-jeju-tabs]", root).forEach((tabs) => {
      const tablist = qs('[role="tablist"]', tabs);
      if (!tablist) return;
      const tabButtons = qsa('[role="tab"]', tablist);
      const panels = qsa('[role="tabpanel"]', tabs);

      const activate = (tab, focus = true) => {
        tabButtons.forEach((button) => {
          const selected = button === tab;
          button.setAttribute("aria-selected", String(selected));
          button.tabIndex = selected ? 0 : -1;
        });
        panels.forEach((panel) => {
          panel.hidden = panel.id !== tab.getAttribute("aria-controls");
        });
        if (focus) tab.focus();
      };

      tabButtons.forEach((tab, index) => {
        tab.addEventListener("click", () => activate(tab, false));
        tab.addEventListener("keydown", (event) => {
          let next = null;
          if (event.key === "ArrowRight") next = tabButtons[(index + 1) % tabButtons.length];
          if (event.key === "ArrowLeft") next = tabButtons[(index - 1 + tabButtons.length) % tabButtons.length];
          if (event.key === "Home") next = tabButtons[0];
          if (event.key === "End") next = tabButtons[tabButtons.length - 1];
          if (next) {
            event.preventDefault();
            activate(next);
          }
        });
      });
    });
  }

  // 여닫기 버튼은 문서에서 한 번만 위임 처리한다. 서버가 목록 행을 다시 그려도(AJAX 등) 새 버튼이 그대로 동작한다.
  let dialogDelegated = false;
  function initDialogs(root = document) {
    if (!dialogDelegated) {
      dialogDelegated = true;
      document.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const opener = target.closest("[data-jeju-dialog-open]");
        if (opener) {
          const dialog = document.getElementById(opener.getAttribute("data-jeju-dialog-open"));
          if (dialog && dialog.showModal && !dialog.open) dialog.showModal();
          return;
        }
        const closer = target.closest("[data-jeju-dialog-close]");
        if (closer) {
          const dialog = closer.closest("dialog");
          if (dialog) dialog.close();
        }
      });
    }
    qsa("dialog.jeju-modal", root).forEach((dialog) => {
      if (dialog.hasAttribute("data-jeju-dialog-ready")) return;
      dialog.setAttribute("data-jeju-dialog-ready", "");
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
  }

  function setDrawerOpen(drawer, toggle, open) {
    drawer.setAttribute("data-open", String(open));
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
  }

  function initDrawer(root = document) {
    qsa("[data-jeju-drawer-toggle]", root).forEach((button) => {
      const drawer = document.getElementById(button.getAttribute("data-jeju-drawer-toggle"));
      if (!drawer) return;
      button.addEventListener("click", () => {
        setDrawerOpen(drawer, button, drawer.getAttribute("data-open") !== "true");
      });
      drawer.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        setDrawerOpen(drawer, button, false);
        button.focus();
      });
    });
    qsa("[data-jeju-drawer-close]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const drawer = button.closest(".jeju-lnb,[data-jeju-drawer]");
        if (drawer) drawer.setAttribute("data-open", "false");
      });
    });
  }

  function initDisclosures(root = document) {
    qsa("[data-jeju-toggle-target]", root).forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.getElementById(button.getAttribute("data-jeju-toggle-target"));
        if (!target) return;
        const willShow = target.hidden;
        target.hidden = !willShow;
        button.setAttribute("aria-expanded", String(willShow));
      });
    });
  }

  function initAccordions(root = document) {
    qsa("[data-jeju-accordion]", root).forEach((accordion) => {
      const triggers = qsa(".jeju-accordion__trigger", accordion);
      const single = accordion.getAttribute("data-jeju-accordion") === "single";
      const panelOf = (trigger) => document.getElementById(trigger.getAttribute("aria-controls"));

      const setOpen = (trigger, open) => {
        const panel = panelOf(trigger);
        if (!panel) return;
        trigger.setAttribute("aria-expanded", String(open));
        panel.hidden = !open;
      };

      triggers.forEach((trigger, index) => {
        setOpen(trigger, trigger.getAttribute("aria-expanded") === "true");
        trigger.addEventListener("click", () => {
          const open = trigger.getAttribute("aria-expanded") !== "true";
          if (open && single) {
            triggers.forEach((other) => {
              if (other !== trigger) setOpen(other, false);
            });
          }
          setOpen(trigger, open);
        });
        trigger.addEventListener("keydown", (event) => {
          let next = null;
          if (event.key === "ArrowDown") next = triggers[(index + 1) % triggers.length];
          if (event.key === "ArrowUp") next = triggers[(index - 1 + triggers.length) % triggers.length];
          if (event.key === "Home") next = triggers[0];
          if (event.key === "End") next = triggers[triggers.length - 1];
          if (!next) return;
          event.preventDefault();
          next.focus();
        });
      });
    });
  }

  function initTooltips(root = document) {
    qsa("[data-jeju-tooltip]", root).forEach((wrap) => {
      const trigger = qs(".jeju-tooltip__trigger", wrap);
      const bubble = qs(".jeju-tooltip__bubble", wrap);
      if (!trigger || !bubble) return;
      const show = () => { bubble.hidden = false; };
      const hide = () => { bubble.hidden = true; };
      hide();
      wrap.addEventListener("mouseenter", show);
      wrap.addEventListener("mouseleave", hide);
      trigger.addEventListener("focus", show);
      trigger.addEventListener("blur", hide);
    });
  }

  function initMenus(root = document) {
    qsa("[data-jeju-menu]", root).forEach((wrap) => {
      const trigger = qs("[data-jeju-menu-trigger]", wrap);
      const menu = qs(".jeju-menu", wrap);
      if (!trigger || !menu) return;
      const items = qsa('[role="menuitem"]', menu);

      const close = (focusTrigger) => {
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        if (focusTrigger) trigger.focus();
      };
      const open = (position) => {
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        const item = position === "last" ? items[items.length - 1] : items[0];
        if (item) item.focus();
      };

      close(false);

      trigger.addEventListener("click", () => {
        if (menu.hidden) open("first"); else close(false);
      });
      trigger.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        open(event.key === "ArrowUp" ? "last" : "first");
      });

      items.forEach((item, index) => {
        item.tabIndex = -1;
        item.addEventListener("click", () => close(true));
        item.addEventListener("keydown", (event) => {
          let next = null;
          if (event.key === "ArrowDown") next = items[(index + 1) % items.length];
          if (event.key === "ArrowUp") next = items[(index - 1 + items.length) % items.length];
          if (event.key === "Home") next = items[0];
          if (event.key === "End") next = items[items.length - 1];
          if (next) {
            event.preventDefault();
            next.focus();
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            close(true);
          }
          if (event.key === "Tab") close(false);
        });
      });

      document.addEventListener("click", (event) => {
        if (!wrap.contains(event.target)) close(false);
      });
    });
  }

  function initSwitches(root = document) {
    qsa("[data-jeju-switch]", root).forEach((wrap) => {
      const input = qs('input[type="checkbox"]', wrap);
      const state = qs(".jeju-switch__state", wrap);
      if (!input || !state) return;
      const on = state.getAttribute("data-on") || "사용";
      const off = state.getAttribute("data-off") || "사용 안 함";
      const sync = () => { state.textContent = input.checked ? on : off; };
      input.addEventListener("change", sync);
      sync();
    });
  }

  function initChips(root = document) {
    qsa("button.jeju-chip[aria-pressed]", root).forEach((chip) => {
      chip.addEventListener("click", () => {
        chip.setAttribute("aria-pressed", String(chip.getAttribute("aria-pressed") !== "true"));
      });
    });
    qsa(".jeju-chip__remove", root).forEach((button) => {
      button.addEventListener("click", () => {
        const chip = button.closest(".jeju-chip");
        const set = chip ? chip.parentElement : null;
        if (chip) chip.remove();
        const next = set ? set.querySelector(".jeju-chip__remove") : null;
        if (next) next.focus();
      });
    });
  }

  function cellValue(row, index) {
    const cell = row.cells[index];
    if (!cell) return "";
    const explicit = cell.getAttribute("data-value");
    return (explicit === null ? cell.textContent || "" : explicit).trim();
  }

  function toNumber(value) {
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function setSortIcon(th, direction) {
    const use = qs(".jeju-table__sort .jeju-icon use", th);
    if (!use) return;
    const base = (use.getAttribute("href") || "").split("#")[0];
    const name = direction === "ascending" ? "chevron-up"
      : direction === "descending" ? "chevron-down" : "sort";
    use.setAttribute("href", base + "#jeju-icon-" + name);
  }

  function initTableSort(root = document) {
    qsa("table[data-jeju-sortable]", root).forEach((table) => {
      const body = qs("tbody", table);
      if (!body) return;
      const headers = qsa("th[data-sort]", table);
      headers.forEach((th) => {
        const button = qs(".jeju-table__sort", th);
        if (!button) return;
        button.addEventListener("click", () => {
          const direction = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";
          headers.forEach((other) => {
            other.setAttribute("aria-sort", "none");
            setSortIcon(other, "none");
          });
          th.setAttribute("aria-sort", direction);
          setSortIcon(th, direction);

          const index = th.cellIndex;
          const type = th.getAttribute("data-sort");
          const factor = direction === "descending" ? -1 : 1;
          const rows = Array.from(body.rows);
          const pinned = rows.filter((row) => row.classList.contains("total"));
          const movable = rows.filter((row) => !row.classList.contains("total"));
          movable.sort((a, b) => {
            const left = cellValue(a, index);
            const right = cellValue(b, index);
            if (type === "number") return (toNumber(left) - toNumber(right)) * factor;
            return left.localeCompare(right, "ko") * factor;
          });
          movable.concat(pinned).forEach((row) => body.appendChild(row));
        });
      });
    });
  }

  function initTableSelection(root = document) {
    qsa("[data-jeju-table-select]", root).forEach((scope) => {
      const all = qs("[data-jeju-select-all]", scope);
      const boxes = qsa("[data-jeju-select-row]", scope);
      const bar = qs("[data-jeju-bulkbar]", scope);
      const counter = qs("[data-jeju-select-count]", scope);

      const sync = () => {
        const selected = boxes.filter((box) => box.checked);
        boxes.forEach((box) => {
          const row = box.closest("tr");
          if (row) row.setAttribute("data-selected", String(box.checked));
        });
        if (all) {
          all.checked = boxes.length > 0 && selected.length === boxes.length;
          all.indeterminate = selected.length > 0 && selected.length < boxes.length;
        }
        if (counter) counter.textContent = String(selected.length);
        if (bar) bar.hidden = selected.length === 0;
      };

      if (all) {
        all.addEventListener("change", () => {
          boxes.forEach((box) => { box.checked = all.checked; });
          sync();
        });
      }
      boxes.forEach((box) => box.addEventListener("change", sync));
      sync();
    });
  }

  function initUploads(root = document) {
    qsa("[data-jeju-upload]", root).forEach((upload) => {
      const input = qs(".jeju-upload__input", upload);
      const list = qs(".jeju-upload__list", upload);
      const drop = qs(".jeju-upload__drop", upload);
      const empty = qs("[data-jeju-upload-empty]", upload);
      if (!input || !list) return;

      const replaceFiles = (files) => {
        const transfer = new DataTransfer();
        files.forEach((file) => transfer.items.add(file));
        input.files = transfer.files;
      };

      const render = () => {
        const files = Array.from(input.files || []);
        list.textContent = "";
        files.forEach((file, index) => {
          const item = document.createElement("li");
          item.className = "jeju-upload__item";
          const name = document.createElement("span");
          name.className = "jeju-upload__name";
          name.textContent = file.name;
          const size = document.createElement("span");
          size.className = "jeju-upload__size";
          size.textContent = formatBytes(file.size);
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "jeju-btn jeju-btn--ghost jeju-btn--sm";
          remove.textContent = "삭제";
          remove.setAttribute("aria-label", file.name + " 첨부 삭제");
          remove.addEventListener("click", () => {
            replaceFiles(files.filter((_, position) => position !== index));
            render();
            input.focus();
          });
          item.append(iconElement("file"), name, size, remove);
          list.appendChild(item);
        });
        if (empty) empty.hidden = files.length > 0;
      };

      input.addEventListener("change", render);

      if (drop) {
        ["dragenter", "dragover"].forEach((type) => {
          drop.addEventListener(type, (event) => {
            event.preventDefault();
            drop.setAttribute("data-dragover", "true");
          });
        });
        ["dragleave", "drop"].forEach((type) => {
          drop.addEventListener(type, (event) => {
            event.preventDefault();
            drop.setAttribute("data-dragover", "false");
          });
        });
        drop.addEventListener("drop", (event) => {
          const dropped = event.dataTransfer ? Array.from(event.dataTransfer.files) : [];
          if (!dropped.length) return;
          replaceFiles(Array.from(input.files || []).concat(dropped));
          render();
        });
      }

      render();
    });
  }

  function initWizards(root = document) {
    const stateLabel = { done: "완료", current: "현재 단계", todo: "예정" };
    qsa("[data-jeju-wizard]", root).forEach((wizard) => {
      const steps = qsa("[data-jeju-step]", wizard);
      const panels = qsa("[data-jeju-wizard-panel]", wizard);
      const previous = qs("[data-jeju-wizard-prev]", wizard);
      const next = qs("[data-jeju-wizard-next]", wizard);
      const nextLabel = qs("[data-jeju-wizard-next-label]", wizard);
      const status = qs("[data-jeju-wizard-status]", wizard);
      const progress = qs("[data-jeju-wizard-progress]", wizard);
      const progressBar = qs("[data-jeju-wizard-progress-bar]", wizard);
      if (!steps.length || !panels.length) return;

      let index = steps.findIndex((step) => step.getAttribute("data-state") === "current");
      if (index < 0) index = 0;

      const apply = () => {
        steps.forEach((step, position) => {
          const state = position < index ? "done" : position === index ? "current" : "todo";
          step.setAttribute("data-state", state);
          if (state === "current") step.setAttribute("aria-current", "step");
          else step.removeAttribute("aria-current");
          const text = qs(".jeju-steps__state", step);
          if (text) text.textContent = stateLabel[state];
        });
        panels.forEach((panel, position) => { panel.hidden = position !== index; });
        if (previous) previous.disabled = index === 0;
        if (next) next.disabled = index === panels.length - 1;
        if (nextLabel) nextLabel.textContent = index === panels.length - 2 ? "마지막 단계로" : "다음 단계";
        if (status) status.textContent = "전체 " + steps.length + "단계 중 " + (index + 1) + "단계";
        const percent = Math.round(((index + 1) / steps.length) * 100);
        if (progress) progress.setAttribute("aria-valuenow", String(percent));
        if (progressBar) progressBar.style.width = percent + "%";
      };

      if (previous) {
        previous.addEventListener("click", () => {
          if (index === 0) return;
          index -= 1;
          apply();
        });
      }
      if (next) {
        next.addEventListener("click", () => {
          if (index >= panels.length - 1) return;
          index += 1;
          apply();
        });
      }
      apply();
    });
  }

  function toast(message, options = {}) {
    let region = qs(".jeju-toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "jeju-toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "false");
      document.body.appendChild(region);
    }
    const item = document.createElement("div");
    item.className = "jeju-toast";
    item.setAttribute("role", options.role || "status");
    item.textContent = String(message);
    region.appendChild(item);
    window.setTimeout(() => item.remove(), options.duration || 3500);
  }

  // 대민 서비스 검색: 검색어와 분류 칩(한 번에 하나)으로 목록을 거르고, 결과 수를 문구로 알린다.
  function initServiceSearch(root = document) {
    qsa("[data-jeju-service-search]", root).forEach((scope) => {
      const form = qs("form", scope);
      const input = qs("[data-jeju-service-query]", scope);
      const chips = qsa("[data-jeju-service-category]", scope);
      const items = qsa("[data-jeju-service-item]", scope);
      const count = qs("[data-jeju-service-count]", scope);
      const empty = qs("[data-jeju-service-empty]", scope);
      const reset = qs("[data-jeju-service-reset]", scope);
      const pressed = chips.find((chip) => chip.getAttribute("aria-pressed") === "true");
      let category = pressed ? pressed.getAttribute("data-jeju-service-category") : "all";
      const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, "");

      const apply = () => {
        const query = normalize(input ? input.value : "");
        let shown = 0;
        items.forEach((item) => {
          const inCategory = category === "all" || item.getAttribute("data-category") === category;
          const haystack = normalize(item.textContent + " " + (item.getAttribute("data-keywords") || ""));
          const match = inCategory && (!query || haystack.includes(query));
          item.hidden = !match;
          if (match) shown += 1;
        });
        if (count) count.textContent = shown ? "서비스 " + shown + "개가 있습니다." : "조건에 맞는 서비스가 없습니다.";
        if (empty) empty.hidden = shown > 0;
      };

      chips.forEach((chip) => {
        chip.addEventListener("click", () => {
          category = chip.getAttribute("data-jeju-service-category") || "all";
          chips.forEach((other) => other.setAttribute("aria-pressed", String(other === chip)));
          apply();
        });
      });
      if (form) {
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          apply();
        });
      }
      if (input) input.addEventListener("input", apply);
      if (reset) {
        reset.addEventListener("click", () => {
          if (input) input.value = "";
          category = "all";
          chips.forEach((chip) => chip.setAttribute("aria-pressed", String(chip.getAttribute("data-jeju-service-category") === "all")));
          apply();
          if (input) input.focus();
        });
      }
      apply();
    });
  }

  // 신청 자격 확인: 질문마다 예/아니요를 고르면 결과(안내·가능·상담 필요)를 문구와 알림 색으로 함께 보여 준다.
  // 결과는 자가 확인이며 최종 판단이 아니라는 안내를 화면에 둔다.
  function initChecklists(root = document) {
    qsa("[data-jeju-checklist]", root).forEach((list) => {
      const items = qsa("[data-jeju-check-item]", list);
      const result = qs("[data-jeju-checklist-result]", list);
      if (!items.length || !result) return;
      const title = qs("[data-jeju-checklist-title]", result);
      const body = qs("[data-jeju-checklist-body]", result);

      const update = () => {
        let answered = 0;
        const unmet = [];
        items.forEach((item) => {
          const checked = qs("input:checked", item);
          if (!checked) return;
          answered += 1;
          if (checked.value !== (item.getAttribute("data-qualify") || "yes")) {
            unmet.push(item.getAttribute("data-label") || "");
          }
        });
        let state;
        let heading;
        let text;
        if (answered < items.length) {
          state = "info";
          heading = "질문 " + items.length + "개 중 " + answered + "개에 답했습니다.";
          text = "모든 질문에 답하면 신청할 수 있는지 알려 드립니다.";
        } else if (!unmet.length) {
          state = "success";
          heading = list.getAttribute("data-eligible-title") || "신청할 수 있을 가능성이 높습니다.";
          text = list.getAttribute("data-eligible-text") || "신청 절차로 이동해 필요한 서류를 준비하세요. 최종 결과는 심사 후 안내합니다.";
        } else {
          state = "warning";
          heading = list.getAttribute("data-check-title") || "상담이 필요합니다.";
          text = "조건과 맞지 않는 항목: " + unmet.join(", ") + ". " + (list.getAttribute("data-check-text") || "가까운 읍·면·동 주민센터에서 다른 지원을 함께 확인할 수 있습니다.");
        }
        ["info", "success", "warning"].forEach((name) => result.classList.toggle("jeju-alert--" + name, name === state));
        result.setAttribute("data-state", state);
        if (title) title.textContent = heading;
        if (body) body.textContent = text;
      };

      list.addEventListener("change", update);
      update();
    });
  }

  function confirm(options = {}) {
    return new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className = "jeju-modal jeju-modal--sm";
      dialog.setAttribute("aria-label", options.title || "확인");

      const head = document.createElement("div");
      head.className = "jeju-modal__head";
      const heading = document.createElement("h2");
      heading.textContent = options.title || "확인";
      head.appendChild(heading);

      const body = document.createElement("div");
      body.className = "jeju-modal__body";
      body.textContent = options.message || "";

      const foot = document.createElement("div");
      foot.className = "jeju-modal__foot";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "jeju-btn jeju-btn--outline";
      cancel.textContent = options.cancelText || "취소";
      const accept = document.createElement("button");
      accept.type = "button";
      accept.className = "jeju-btn " + (options.tone === "danger" ? "jeju-btn--danger" : "jeju-btn--primary");
      accept.textContent = options.confirmText || "확인";
      foot.append(cancel, accept);

      dialog.append(head, body, foot);
      document.body.appendChild(dialog);

      let answer = false;
      cancel.addEventListener("click", () => dialog.close());
      accept.addEventListener("click", () => {
        answer = true;
        dialog.close();
      });
      dialog.addEventListener("close", () => {
        dialog.remove();
        resolve(answer);
      });
      dialog.showModal();
      accept.focus();
    });
  }

  // 비동기 영역 상태: loading · error · empty · ready 중 하나만 보이게 하고,
  // 불러오는 동안 aria-busy를 켜며, 숨김 live 영역([data-jeju-async-live])에 바뀐 상태를 문구로 알린다.
  // 포커스가 있던 요소(다시 시도 버튼 등)가 숨겨지면 포커스가 문서 처음으로 튕기므로 영역 자체로 옮긴다.
  function setAsyncState(region, state) {
    if (!region) return;
    const active = document.activeElement;
    const focusInside = !!active && active !== region && region.contains(active);
    region.setAttribute("data-state", state);
    region.setAttribute("aria-busy", String(state === "loading"));
    let shown = null;
    qsa("[data-jeju-async-view]", region).forEach((view) => {
      const match = view.getAttribute("data-jeju-async-view") === state;
      view.hidden = !match;
      if (match) shown = view;
    });
    const live = qs("[data-jeju-async-live]", region);
    if (live) {
      const message = shown ? shown.getAttribute("data-announce") || "" : "";
      live.textContent = message;
    }
    if (focusInside && active.closest("[hidden]")) {
      if (!region.hasAttribute("tabindex")) region.setAttribute("tabindex", "-1");
      region.focus({ preventScroll: true });
    }
    region.dispatchEvent(new CustomEvent("jeju:async-state", { bubbles: true, detail: { state } }));
  }

  function initAsync(root = document) {
    qsa("[data-jeju-async]", root).forEach((region) => {
      setAsyncState(region, region.getAttribute("data-state") || "ready");
      qsa("[data-jeju-async-retry]", region).forEach((button) => {
        button.addEventListener("click", () => {
          region.dispatchEvent(new CustomEvent("jeju:retry", { bubbles: true }));
        });
      });
    });
  }

  // 서버에서 불러오기: task를 부르는 동안 loading, 끝나면 ready(false를 돌려주면 empty), 실패하면 error로 바꾼다.
  // 마지막 요청만 화면에 반영하고 이전 요청은 AbortSignal로 취소한다. 다시 시도(jeju:retry)는 마지막 task를 다시 부른다.
  const asyncTasks = new WeakMap();
  const retryBound = new WeakSet();
  function load(region, task) {
    if (!region || typeof task !== "function") return Promise.resolve(undefined);
    const previous = asyncTasks.get(region);
    if (previous && previous.controller) previous.controller.abort();
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const entry = { task, controller };
    asyncTasks.set(region, entry);
    if (!retryBound.has(region)) {
      retryBound.add(region);
      region.addEventListener("jeju:retry", () => {
        const current = asyncTasks.get(region);
        if (current) load(region, current.task);
      });
    }
    setAsyncState(region, "loading");
    return Promise.resolve()
      .then(() => task(controller ? controller.signal : undefined))
      .then((result) => {
        if (asyncTasks.get(region) !== entry) return undefined;
        setAsyncState(region, result === false ? "empty" : "ready");
        return result;
      }, (error) => {
        if (asyncTasks.get(region) !== entry || (error && error.name === "AbortError")) return undefined;
        setAsyncState(region, "error");
        region.dispatchEvent(new CustomEvent("jeju:async-error", { bubbles: true, detail: { error } }));
        return undefined;
      });
  }

  // 인쇄: [data-jeju-print]를 누르면 인쇄 창을 열고, 인쇄 직전에 [data-jeju-print-date]에 출력 일시를 채운다.
  function initPrint(root = document) {
    qsa("[data-jeju-print]", root).forEach((button) => {
      if (button.hasAttribute("data-jeju-print-ready")) return;
      button.setAttribute("data-jeju-print-ready", "");
      button.addEventListener("click", () => window.print());
    });
  }

  function stampPrintDate() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const text = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes());
    qsa("[data-jeju-print-date]").forEach((el) => { el.textContent = text; });
  }
  window.addEventListener("beforeprint", stampPrintDate);

  function initAll(root = document) {
    initTabs(root);
    initDialogs(root);
    initDrawer(root);
    initDisclosures(root);
    initAccordions(root);
    initTooltips(root);
    initMenus(root);
    initSwitches(root);
    initChips(root);
    initServiceSearch(root);
    initChecklists(root);
    initTableSort(root);
    initTableSelection(root);
    initUploads(root);
    initWizards(root);
    initAsync(root);
    initPrint(root);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    qsa(".jeju-tooltip__bubble").forEach((bubble) => { bubble.hidden = true; });
  });

  document.addEventListener("DOMContentLoaded", () => initAll());

  window.JejuDesign = Object.freeze({
    initAll,
    initTabs,
    initDialogs,
    initDrawer,
    initDisclosures,
    initAccordions,
    initTooltips,
    initMenus,
    initSwitches,
    initChips,
    initServiceSearch,
    initChecklists,
    initTableSort,
    initTableSelection,
    initUploads,
    initWizards,
    initAsync,
    setAsyncState,
    load,
    initPrint,
    confirm,
    toast
  });
})();

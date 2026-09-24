// 서버 조회형 목록 예제 전용. 실제 서비스에서는 서버(JSP 등)가 이 파일이 그리는 마크업을 그대로 그린다.
// 주소의 조건(?district=&status=&q=&sort=&dir=&size=&page=)을 읽어 서버가 보냈을 목록 · 정렬 링크 · 페이지 링크를 만든다.
// 상세 패널은 JejuDesign.load(영역, 작업)으로 불러오는 중 · 오류 · 완료를 바꾼다.
(() => {
  "use strict";

  const DISTRICTS = ["동부", "서부", "남부", "북부"];
  const SERVICES = ["식사지원", "안부확인", "방문건강", "주거지원", "이동지원", "가사지원"];
  const STATUSES = [["접수", "neutral"], ["연계 중", "info"], ["완료", "success"], ["검토 필요", "warning"], ["자료 보완", "danger"]];
  const NAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오"];
  const TEAMS = ["돌봄관리팀", "복지지원팀", "건강관리팀"];
  const ORGS = ["제주시 동부종합사회복지관", "서귀포시 노인복지센터", "제주 방문간호센터", "한라 주거복지센터"];
  const REASONS = ["혼자 식사를 챙기기 어렵다는 가족 요청", "퇴원 뒤 방문 건강관리 필요", "난방 설비 고장으로 주거 개선 요청", "정기 진료 병원 이동 지원 요청", "안부 확인 주기 조정 요청"];
  const pad = (value, size = 2) => String(value).padStart(size, "0");

  const ROWS = Array.from({ length: 57 }, (_, i) => {
    const [status, tone] = STATUSES[(i * 2 + Math.floor(i / 5)) % STATUSES.length];
    return {
      id: "RQ-2609" + pad(157 - i, 3),
      name: NAMES[i % NAMES.length] + "○○",
      district: DISTRICTS[(i * 3) % DISTRICTS.length],
      service: SERVICES[(i * 5) % SERVICES.length],
      status,
      tone,
      requested: "2026-09-" + pad(23 - Math.floor(i / 3)),
      days: ((i * 7 + 3) % 15) + 1,
      team: TEAMS[i % TEAMS.length],
      org: ORGS[(i * 3 + 1) % ORGS.length],
      reason: REASONS[i % REASONS.length]
    };
  });

  const SORTABLE = { id: "요청번호", district: "지역", requested: "요청일", days: "처리 일수" };
  const DIR_LABEL = { asc: "오름차순", desc: "내림차순" };
  const SIZES = [10, 20, 50];
  const DEFAULTS = { district: "", status: "", q: "", sort: "requested", dir: "desc", size: 10, page: 1 };

  const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function readQuery(search) {
    const params = new URLSearchParams(search);
    const pick = (name, allowed) => (allowed.includes(params.get(name)) ? params.get(name) : "");
    const sort = Object.prototype.hasOwnProperty.call(SORTABLE, params.get("sort")) ? params.get("sort") : DEFAULTS.sort;
    const dir = params.get("dir") === "asc" || params.get("dir") === "desc" ? params.get("dir") : DEFAULTS.dir;
    const size = SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : DEFAULTS.size;
    return {
      district: pick("district", DISTRICTS),
      status: pick("status", STATUSES.map(([label]) => label)),
      q: (params.get("q") || "").trim(),
      sort,
      dir,
      size,
      page: Math.max(1, parseInt(params.get("page"), 10) || 1)
    };
  }

  // 서버가 쓰는 주소 규칙과 같게 만든다. 끝의 #list-title은 새로 그린 뒤 키보드 위치를 목록 제목에서 시작하게 한다.
  function urlFor(query, changes) {
    const next = Object.assign({}, query, changes);
    const params = new URLSearchParams();
    if (next.district) params.set("district", next.district);
    if (next.status) params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    params.set("sort", next.sort);
    params.set("dir", next.dir);
    if (next.size !== DEFAULTS.size) params.set("size", String(next.size));
    if (next.page > 1) params.set("page", String(next.page));
    return "?" + params.toString() + "#list-title";
  }

  function select(query) {
    const keyword = query.q.toLowerCase();
    const matched = ROWS.filter((row) =>
      (!query.district || row.district === query.district) &&
      (!query.status || row.status === query.status) &&
      (!keyword || row.id.toLowerCase().includes(keyword) || row.name.includes(query.q)));
    const factor = query.dir === "asc" ? 1 : -1;
    matched.sort((a, b) => {
      const left = a[query.sort];
      const right = b[query.sort];
      const order = typeof left === "number" ? left - right : String(left).localeCompare(String(right), "ko");
      return (order || a.id.localeCompare(b.id)) * factor;
    });
    const pages = Math.max(1, Math.ceil(matched.length / query.size));
    const page = Math.min(query.page, pages);
    const start = (page - 1) * query.size;
    return { total: matched.length, pages, page, start, rows: matched.slice(start, start + query.size) };
  }

  function pageWindow(page, pages) {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const items = [1];
    if (page > 3) items.push("gap");
    for (let n = Math.max(2, page - 1); n <= Math.min(pages - 1, page + 1); n += 1) items.push(n);
    if (page < pages - 2) items.push("gap");
    items.push(pages);
    return items;
  }

  function spriteBase() {
    const use = document.querySelector(".jeju-icon use");
    return use ? (use.getAttribute("href") || "").split("#")[0] : "";
  }

  function icon(name, sprite) {
    return '<svg class="jeju-icon" aria-hidden="true"><use href="' + sprite + "#jeju-icon-" + name + '"></use></svg>';
  }

  function rowHtml(row) {
    return "<tr>" +
      '<td data-label="요청번호"><button class="jeju-table__link" type="button" data-jeju-dialog-open="request-panel" data-request-id="' + row.id + '" aria-label="' + row.id + ' 상세 보기">' + row.id + "</button></td>" +
      '<td data-label="대상자">' + row.name + "</td>" +
      '<td data-label="지역">' + row.district + "</td>" +
      '<td data-label="서비스">' + row.service + "</td>" +
      '<td data-label="상태"><span class="jeju-badge jeju-badge--' + row.tone + '">' + row.status + "</span></td>" +
      '<td data-label="요청일">' + row.requested + "</td>" +
      '<td class="num" data-label="처리 일수">' + row.days + "일</td>" +
      "</tr>";
  }

  function emptyHtml() {
    return '<tr><td colspan="7"><div class="jeju-empty"><h3>조건에 맞는 요청이 없습니다</h3>' +
      "<p>검색어를 줄이거나 조건을 초기화한 뒤 다시 조회해 주세요.</p>" +
      '<a class="jeju-btn jeju-btn--outline" href="list.html">조건 초기화</a></div></td></tr>';
  }

  function paginationHtml(query, result, sprite) {
    const parts = [];
    const edge = (enabled, page, rel, label, name) => enabled
      ? '<a href="' + esc(urlFor(query, { page })) + '" rel="' + rel + '" aria-label="' + label + '">' + icon(name, sprite) + "</a>"
      : '<a role="link" aria-disabled="true" aria-label="' + label + '">' + icon(name, sprite) + "</a>";
    parts.push(edge(result.page > 1, result.page - 1, "prev", "이전 페이지", "chevron-left"));
    pageWindow(result.page, result.pages).forEach((item) => {
      if (item === "gap") {
        parts.push('<span class="jeju-pagination__gap" aria-hidden="true">…</span>');
        return;
      }
      parts.push('<a href="' + esc(urlFor(query, { page: item })) + '" aria-label="' + item + '페이지"' + (item === result.page ? ' aria-current="page"' : "") + ">" + item + "</a>");
    });
    parts.push(edge(result.page < result.pages, result.page + 1, "next", "다음 페이지", "chevron-right"));
    return parts.join("");
  }

  function conditionText(query) {
    return [
      "지역 " + (query.district || "전체"),
      "상태 " + (query.status || "전체"),
      query.q ? "검색어 “" + query.q + "”" : "검색어 없음",
      SORTABLE[query.sort] + " " + DIR_LABEL[query.dir]
    ].join(" · ");
  }

  function renderList() {
    const table = document.getElementById("request-list");
    if (!table) return;
    const query = readQuery(window.location.search);
    const result = select(query);
    const sprite = spriteBase();

    table.querySelectorAll("th[data-sort-key]").forEach((th) => {
      const key = th.getAttribute("data-sort-key");
      const active = key === query.sort;
      const next = active && query.dir === "asc" ? "desc" : "asc";
      th.setAttribute("aria-sort", active ? (query.dir === "asc" ? "ascending" : "descending") : "none");
      th.innerHTML = '<a class="jeju-table__sort" href="' + esc(urlFor(query, { sort: key, dir: next, page: 1 })) + '">' + SORTABLE[key] +
        '<span class="jeju-visually-hidden">, ' + DIR_LABEL[next] + "으로 정렬</span>" +
        icon(active ? (query.dir === "asc" ? "chevron-up" : "chevron-down") : "sort", sprite) + "</a>";
    });

    table.tBodies[0].innerHTML = result.rows.length ? result.rows.map(rowHtml).join("") : emptyHtml();

    const from = result.total ? result.start + 1 : 0;
    const to = result.start + result.rows.length;
    const summary = document.querySelector("[data-list-summary]");
    if (summary) {
      summary.textContent = result.total
        ? "총 " + result.total + "건 중 " + from + "–" + to + "건 · " + SORTABLE[query.sort] + " " + DIR_LABEL[query.dir]
        : "조건에 맞는 요청 0건";
    }
    const conditions = document.querySelector("[data-list-conditions]");
    if (conditions) conditions.textContent = conditionText(query) + " · " + from + "–" + to + "건(총 " + result.total + "건)";

    const nav = document.querySelector("[data-list-pagination]");
    if (nav) nav.innerHTML = paginationHtml(query, result, sprite);

    document.querySelectorAll("form[data-list-form]").forEach((form) => {
      ["district", "status", "q", "sort", "dir", "size"].forEach((name) => {
        const field = form.elements.namedItem(name);
        if (field && "value" in field) field.value = String(query[name]);
      });
    });

    document.title = "Jeju Design — 서버 조회형 목록 예제" + (result.pages > 1 ? " (" + result.page + "/" + result.pages + "쪽)" : "");
  }

  function detailHtml(row) {
    const item = (label, value) => "<div><dt>" + label + "</dt><dd>" + value + "</dd></div>";
    return item("요청번호", row.id) + item("대상자", row.name) + item("지역", row.district) + item("서비스", row.service) +
      item("상태", '<span class="jeju-badge jeju-badge--' + row.tone + '">' + row.status + "</span>") +
      item("요청일", row.requested) + item("처리 일수", row.days + "일") + item("제공기관", row.org) +
      item("담당", row.team) + item("요청 사유", row.reason);
  }

  // 상세 API 대신 0.6초 뒤 응답하는 가짜 요청. signal로 취소할 수 있다.
  function fetchDetail(id, signal) {
    return new Promise((resolve, reject) => {
      const failSwitch = document.getElementById("demo-detail-fail");
      const fail = !!(failSwitch && failSwitch.checked);
      const timer = window.setTimeout(() => {
        const row = ROWS.find((item) => item.id === id);
        if (fail || !row) reject(new Error("상세 조회 실패"));
        else resolve(row);
      }, 600);
      if (signal) {
        signal.addEventListener("abort", () => {
          window.clearTimeout(timer);
          reject(new DOMException("요청 취소", "AbortError"));
        });
      }
    });
  }

  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-request-id]") : null;
    const region = document.getElementById("request-detail");
    if (!button || !region || !window.JejuDesign) return;
    const id = button.getAttribute("data-request-id");
    const title = document.querySelector("[data-request-title]");
    const list = document.querySelector("[data-request-detail]");
    if (title) title.textContent = id + " 요청 상세";
    window.JejuDesign.load(region, (signal) => fetchDetail(id, signal).then((row) => {
      if (list) list.innerHTML = detailHtml(row);
    }));
  });

  renderList();
})();

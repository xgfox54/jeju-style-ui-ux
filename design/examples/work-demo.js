// 업무 예제 전용: 관리번호를 누르면 그 행의 값으로 상세 보기 사이드 패널을 채운다.
// 실제 서비스에서는 상세 API 응답으로 채우고, 불러오는 동안 로딩 상태를 보여 준다.
document.addEventListener("DOMContentLoaded", () => {
  const panel = document.getElementById("detail-panel");
  if (!panel) return;
  const title = panel.querySelector("[data-detail-title]");
  document.querySelectorAll("[data-jeju-dialog-open='detail-panel']").forEach((button) => {
    button.addEventListener("click", () => {
      const row = button.closest("tr");
      if (!row) return;
      row.querySelectorAll("td[data-label]").forEach((cell) => {
        const field = panel.querySelector('[data-field="' + cell.getAttribute("data-label") + '"]');
        if (field) field.innerHTML = cell.innerHTML;
      });
      const id = panel.querySelector('[data-field="관리번호"]');
      if (id) id.textContent = button.textContent.trim();
      const name = row.querySelector('td[data-label="대상자"]');
      if (title) title.textContent = button.textContent.trim() + " " + (name ? name.textContent.trim() : "");
    });
  });
});



// 로딩·오류 상태 데모: 실제 서비스에서는 fetch 결과에 따라 JejuDesign.setAsyncState를 부른다.
document.addEventListener("DOMContentLoaded", () => {
  const region = document.getElementById("demo-async");
  if (!region) return;
  const load = () => {
    window.JejuDesign.setAsyncState(region, "loading");
    window.setTimeout(() => window.JejuDesign.setAsyncState(region, "ready"), 900);
  };
  document.querySelectorAll("[data-demo-async]").forEach((button) => {
    button.addEventListener("click", () => {
      const state = button.getAttribute("data-demo-async");
      if (state === "loading") load();
      else window.JejuDesign.setAsyncState(region, state);
    });
  });
  region.addEventListener("jeju:retry", load);
});

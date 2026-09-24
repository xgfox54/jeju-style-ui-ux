document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.getElementById("form-delete");
  if (trigger) {
    trigger.addEventListener("click", async () => {
      const accepted = await window.JejuDesign.confirm({
        title: "작성 중인 내용을 버릴까요?",
        message: "저장하지 않은 입력 내용은 복구할 수 없습니다.",
        confirmText: "버리고 나가기",
        tone: "danger"
      });
      window.JejuDesign.toast(accepted ? "작성 내용을 버렸습니다." : "계속 작성합니다.");
    });
  }

  const summary = document.getElementById("form-errors");
  const link = summary ? summary.querySelector("a") : null;
  if (!link) return;
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const field = document.querySelector(link.getAttribute("href"));
    if (field) field.focus();
  });
});

export function showToast(type, message, title = "") {
  const root = document.querySelector("#toast-root");
  const icons = { success: "circle-check", error: "circle-exclamation", info: "circle-info" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid fa-${icons[type] || icons.info}" aria-hidden="true"></i>
    <div class="toastTitle"><strong>${title || (type === "success" ? "Success" : "Notice")}</strong><p>${message}</p></div>
  `;
  root.append(toast);
  setTimeout(() => toast.remove(), 4200);
}

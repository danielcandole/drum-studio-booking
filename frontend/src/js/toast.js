export function showToast(type, message, title = "") {
  const root = document.querySelector("#toast-root");
  const icons = {
    success: "circle-check",
    error: "circle-exclamation",
    info: "circle-info"
  };

  root.querySelectorAll(".toast").forEach(toast => toast.remove());

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <i class="fa-solid fa-${icons[type] || icons.info} toastIcon-${type}" aria-hidden="true"></i>
    <div class="toastTitle">
      <strong class="toastTitle-${type}">${title || (type === "success" ? "Success" : type === "error" ? "Error" : "Notice")}</strong>
      <p>${message}</p>
    </div>
  `;

  root.append(toast);
  setTimeout(() => toast.remove(), 4200);
}
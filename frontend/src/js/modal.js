let modalTemplate = "";

export function setModalTemplate(template) {
  modalTemplate = template;
}

export function confirmModal(
  message,
  onConfirm,
  title = "Please confirm",
  { confirmLabel = "Confirm", cancelLabel = "Cancel" } = {}
) {
  const root = document.querySelector("#modal-root");
  root.innerHTML = modalTemplate;
  root.querySelector("#modal-title").textContent = title;
  root.querySelector("#modal-message").textContent = message;
  const confirm = root.querySelector("#modal-confirm");
  const cancel = root.querySelector("#modal-cancel");
  root.querySelector("#modal-confirm-label").textContent = confirmLabel;
  root.querySelector("#modal-cancel-label").textContent = cancelLabel;
  const previouslyFocused = document.activeElement;

  const close = () => {
    document.removeEventListener("keydown", handleKeydown);
    root.innerHTML = "";

    if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
      previouslyFocused.focus();
    }
  };

  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      close();
    }
  };

  document.addEventListener("keydown", handleKeydown);
  cancel.addEventListener("click", close);
  confirm.addEventListener("click", () => {
    close();
    onConfirm();
  });
  cancel.focus();
}

let modalTemplate = "";

export function setModalTemplate(template) {
  modalTemplate = template;
}

export function confirmModal(message, onConfirm, title = "Please confirm") {
  const root = document.querySelector("#modal-root");
  root.innerHTML = modalTemplate;
  root.querySelector("#modal-title").textContent = title;
  root.querySelector("#modal-message").textContent = message;
  const confirm = root.querySelector("#modal-confirm");
  const cancel = root.querySelector("#modal-cancel");

  const close = () => {
    root.innerHTML = "";
  };

  cancel.addEventListener("click", close);
  confirm.addEventListener("click", () => {
    close();
    onConfirm();
  });
  cancel.focus();
}

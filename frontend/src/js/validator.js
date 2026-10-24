export function validateForm(form) {
  let valid = true;
  form.querySelectorAll("[required]").forEach((field) => {
    const group = field.closest(".form-group");
    const oldError = group?.querySelector(".error-text");
    oldError?.remove();
    field.classList.remove("invalid");

    if (!field.value.trim()) {
      valid = false;
      field.classList.add("invalid");
      field.insertAdjacentHTML("afterend", `<span class="error-text">${field.dataset.error || "This field is required."}</span>`);
    }
  });

  const password = form.querySelector("[name='password']");
  const confirmPassword = form.querySelector("[name='confirmPassword']");
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    valid = false;
    confirmPassword.classList.add("invalid");
    confirmPassword.insertAdjacentHTML("afterend", '<span class="error-text">Passwords do not match.</span>');
  }
  return valid;
}

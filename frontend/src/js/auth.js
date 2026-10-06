import { validateForm } from "./validator.js";
import { showToast } from "./toast.js";
import { request } from "./api.js";

export const authApi = {
  register: (payload) => request("/users/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
};

export function handleAuth(form, navigate) {
  if (!validateForm(form)) {
    showToast("error", "Please check the highlighted fields.", "Form incomplete");
    return;
  }
  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>Please wait...';
  setTimeout(() => {
    showToast("success", "Welcome to BeatBase!", "Signed in");
    navigate("drummer-home");
  }, 700);
}

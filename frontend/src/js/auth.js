import { validateForm } from "./validator.js";
import { showToast } from "./toast.js";
import { request, setToken } from "./api.js";

export const authApi = {
  register: (payload) => request("/api/users/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  session: () => request("/api/auth/session"),
  logout: () => request("/api/auth/logout", { method: "POST" }),
};

export async function handleAuth(form, navigate) {
  if (!validateForm(form)) {
    showToast("error", "Please check the highlighted fields.", "Form incomplete");
    return;
  }

  const button = form.querySelector("button[type='submit']");
  const register = Boolean(form.querySelector("#name"));
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>Please wait...';

  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    if (register) payload.role = document.querySelector("[data-role-choice].active")?.dataset.roleChoice || "drummer";

    const result = register ? await authApi.register(payload) : await authApi.login(payload);
    setToken(result.token);

    showToast(
      "success",
      register ? "Your account has been created." : "Welcome back!",
      register ? "Account created" : "Signed in"
    );

    await navigate(result.user.role === "owner" ? "owner-dashboard" : "drummer-home");
  } catch (error) {
    showToast("error", error.message, register ? "Registration failed" : "Login failed");
    button.disabled = false;
    button.innerHTML = `${register ? "Create account" : "Login"} <i class="fa-solid fa-arrow-right"></i>`;
  }
}

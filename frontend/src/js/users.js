import { showToast } from "./toast.js";
import { request } from "./api.js";

export const usersApi = {
  profile: () => request("/users/profile"),
  update: (payload) => request("/users/profile", { method: "PUT", body: JSON.stringify(payload) }),
  delete: () => request("/users/profile", { method: "DELETE" }),
};

export function saveProfile() {
  showToast("success", "Your profile has been updated.", "Changes saved");
}

export function deleteAccount() {
  showToast("info", "Demo account deletion confirmed.", "Account action");
}

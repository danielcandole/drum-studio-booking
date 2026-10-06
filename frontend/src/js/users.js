import { showToast } from "./toast.js";
import { request, setToken } from "./api.js";

export const usersApi = {
  profile: () => request("/api.php?route=users/profile"),
  update: (payload) => request("/api.php?route=users/profile", { method: "PUT", body: JSON.stringify(payload) }),
  delete: () => request("/api.php?route=users/profile", { method: "DELETE" }),
};

export async function saveProfile(payload, onSuccess) {
  try {
    const result = await usersApi.update(payload);
    showToast("success", "Your profile has been updated.", "Changes saved");
    await onSuccess?.(result.user);
  } catch (error) {
    showToast("error", error.message, "Profile update failed");
  }
}

export async function deleteAccount(onSuccess) {
  try {
    await usersApi.delete();
    setToken(null);
    showToast("success", "Your account has been deleted.", "Account deleted");
    await onSuccess?.();
  } catch (error) {
    showToast("error", error.message, "Account deletion failed");
  }
}

import { showToast } from "./toast.js";
import { request } from "./api.js";

export const usersApi = {
  profile: () => request("users/profile"),
  update: (payload) => request("users/profile", { method: "PUT", body: JSON.stringify(payload) }),
  delete: () => request("users/profile", { method: "DELETE" }),
};

export async function saveProfile(payload, onDone) {
  try {
    const result = await usersApi.update(payload);
    showToast("success", "Your profile has been updated.", "Changes saved");
    onDone?.(result.user);
  } catch (error) {
    showToast("error", error.message, "Profile update failed");
  }
}

export async function deleteAccount(onDone) {
  try {
    await usersApi.delete();
    showToast("info", "Your account has been deleted.", "Account action");
    onDone?.();
  } catch (error) {
    showToast("error", error.message, "Account deletion failed");
  }
}

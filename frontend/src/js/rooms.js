import { showToast } from "./toast.js";
import { request } from "./api.js";

export const roomsApi = {
  create: (payload) => request("/api.php?route=rooms", { method: "POST", body: JSON.stringify(payload) }),
  list: () => request("/api.php?route=rooms"),
  read: (id) => request(`/api.php?route=rooms/${id}`),
  update: (id, payload) => request(`/api.php?route=rooms/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => request(`/api.php?route=rooms/${id}`, { method: "DELETE" }),
};

export async function saveRoom(button, payload, id, onSuccess) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>Please wait...';
  try {
    if (id) await roomsApi.update(id, payload);
    else await roomsApi.create(payload);
    showToast("success", id ? "The studio room was updated." : "Room added successfully!", "Room saved");
    await onSuccess?.();
  } catch (error) {
    showToast("error", error.message, "Room save failed");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

export async function deleteRoom(id, onSuccess) {
  try {
    await roomsApi.delete(id);
    showToast("success", "The studio room was deleted.", "Room deleted");
    await onSuccess?.();
  } catch (error) {
    showToast("error", error.message, "Room deletion failed");
  }
}

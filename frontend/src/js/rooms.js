import { showToast } from "./toast.js";
import { request } from "./api.js";

export const roomsApi = {
  create: (payload) => request("rooms", { method: "POST", body: JSON.stringify(payload) }),
  list: () => request("rooms"),
  all: () => request("rooms/all"),
  update: (id, payload) => request(`rooms/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id) => request(`rooms/${id}`, { method: "DELETE" }),
};

export async function saveRoom(button, payload, editingId = null, onDone) {
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span>Please wait...';
  try {
    if (editingId) await roomsApi.update(editingId, payload);
    else await roomsApi.create(payload);
    showToast("success", editingId ? "Room updated successfully!" : "Room added successfully!", "Room saved");
    onDone?.();
  } catch (error) {
    showToast("error", error.message, "Room save failed");
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
}

export async function deleteRoom(id, onDone) {
  try {
    await roomsApi.delete(id);
    showToast("success", "The studio room was deleted.", "Room deleted");
    onDone?.();
  } catch (error) {
    showToast("error", error.message, "Room deletion failed");
  }
}

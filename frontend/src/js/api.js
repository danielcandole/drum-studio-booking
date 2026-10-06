const TOKEN_KEY = "beatbase_auth_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function request(url, options = {}) {
  const config = {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  };
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error("The server returned an invalid JSON response.");
    }
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  } catch (error) {
    throw new Error(error.message || "Unable to connect. Please try again.");
  }
}

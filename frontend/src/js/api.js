export async function request(url, options = {}) {
  const config = {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Something went wrong.");
    return data;
  } catch (error) {
    throw new Error(error.message || "Unable to connect. Please try again.");
  }
}

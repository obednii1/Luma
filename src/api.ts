/** Posts a form to the /api/contact serverless function. Throws with a readable message on failure. */
export async function submitForm(payload: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error. Please check your connection and try again.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? "Something went wrong. Please try again.",
    );
  }
}

/** Generic JSON POST. Returns the parsed response, or throws with a readable message. */
export async function postJson<T>(url: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error. Please check your connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

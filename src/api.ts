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

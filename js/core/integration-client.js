const DEFAULT_TIMEOUT = 9000;

function isAbsoluteURL(value = "") {
  return /^https?:\/\//i.test(String(value || "").trim());
}

export function resolveEndpoint(endpoint = "", baseDepth = 0) {
  const trimmed = String(endpoint || "").trim();
  if (!trimmed) return "";

  if (isAbsoluteURL(trimmed)) return trimmed;

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  const relativePrefix = "../".repeat(Math.max(0, Number(baseDepth) || 0));
  return `${relativePrefix}${trimmed}`;
}

export async function fetchJSONWithTimeout(url, { timeoutMs = DEFAULT_TIMEOUT, cache = "no-store" } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Remote fetch failed (${response.status}) for ${url}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function postJSONWithTimeout(url, payload, { timeoutMs = DEFAULT_TIMEOUT, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    let body = null;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        body = await response.json();
      } catch {
        body = null;
      }
    } else {
      try {
        body = await response.text();
      } catch {
        body = null;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      body
    };
  } finally {
    clearTimeout(timer);
  }
}

const BLOCKED_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "base",
  "form",
]);

function isDangerousUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("javascript:") || normalized.startsWith("data:text/html");
}

export function sanitizeHtml(input: string): string {
  if (!input) {
    return "";
  }

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return input;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");

  for (const tagName of BLOCKED_TAGS) {
    doc.querySelectorAll(tagName).forEach((node) => node.remove());
  }

  doc.querySelectorAll<HTMLElement>("*").forEach((element) => {
    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (name.startsWith("on")) {
        element.removeAttribute(attr.name);
        return;
      }

      if ((name === "href" || name === "src") && isDangerousUrl(value)) {
        element.removeAttribute(attr.name);
        return;
      }

      if (name === "srcdoc") {
        element.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

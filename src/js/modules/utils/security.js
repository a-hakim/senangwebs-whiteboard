const ALLOWED_TAGS = new Set([
  "a", "b", "blockquote", "br", "code", "del", "em", "h1", "h2", "h3",
  "h4", "h5", "h6", "hr", "i", "li", "ol", "p", "pre", "s", "span",
  "strong", "table", "tbody", "td", "th", "thead", "tr", "u", "ul",
]);
const GLOBAL_ATTRIBUTES = new Set(["class"]);
const TAG_ATTRIBUTES = {
  a: new Set(["href", "title"]),
  code: new Set(["class"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
};

export function sanitizeUrl(
  value,
  {
    allowDataImages = false,
    allowedProtocols = ["http:", "https:", "mailto:", "tel:"],
  } = {}
) {
  if (typeof value !== "string" || !value.trim()) return "";
  const candidate = value.trim();

  if (candidate.startsWith("#") || candidate.startsWith("/")) return candidate;
  if (
    allowDataImages &&
    /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(candidate)
  ) {
    return candidate;
  }

  try {
    const url = new URL(candidate, window.location.href);
    return allowedProtocols.includes(url.protocol) ? candidate : "";
  } catch {
    return "";
  }
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html;

  const elements = Array.from(template.content.querySelectorAll("*"));
  for (const element of elements) {
    const tagName = element.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      element.replaceWith(...element.childNodes);
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const allowed =
        GLOBAL_ATTRIBUTES.has(name) || TAG_ATTRIBUTES[tagName]?.has(name);
      if (!allowed || name.startsWith("on") || name === "style") {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === "a") {
      const href = sanitizeUrl(element.getAttribute("href") || "");
      if (href) {
        element.setAttribute("href", href);
        element.setAttribute("rel", "noopener noreferrer");
        element.setAttribute("target", "_blank");
      } else {
        element.removeAttribute("href");
      }
    }
  }

  return template.innerHTML;
}

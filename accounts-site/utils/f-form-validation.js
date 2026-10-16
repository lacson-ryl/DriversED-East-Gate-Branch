export function validatePersonName(value) {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");
  return {
    value: normalized,
    valid: normalized.length >= 2 && /^[\p{L}]+(?: [\p{L}]+)*$/u.test(normalized),
    message: "Use letters and spaces only for the name.",
  };
}

export function validateEmail(value) {
  const normalized = String(value ?? "").trim();
  return {
    value: normalized,
    valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized),
    message: "Enter a valid email address.",
  };
}

export function validateRequired(value, message) {
  const normalized = String(value ?? "").trim();
  return { value: normalized, valid: Boolean(normalized), message };
}

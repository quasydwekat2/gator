export function parseDate(dateString?: string): Date | null {
  if (!dateString) {
    return null;
  }

  const trimmed = dateString.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const numericTimestamp = Number(trimmed);

  if (Number.isFinite(numericTimestamp)) {
    const millis = trimmed.length <= 10 ? numericTimestamp * 1000 : numericTimestamp;
    const parsedNumeric = new Date(millis);

    if (!Number.isNaN(parsedNumeric.getTime())) {
      return parsedNumeric;
    }
  }

  const candidates = [
    trimmed,
    trimmed.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"),
    trimmed.replace(/\s+/g, " "),
  ];

  for (const candidate of candidates) {
    const parsed = new Date(candidate);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

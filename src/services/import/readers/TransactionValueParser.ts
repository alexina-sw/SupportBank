export const asText = (value: unknown): string =>
    typeof value === "string"
        ? value.trim()
        : "";

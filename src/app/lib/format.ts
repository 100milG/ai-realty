export function formatPrice(price: number | null | undefined, currency = "INR"): string {
  if (price == null) return "Price on request";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatPriceCompact(price: number | null | undefined, currency = "INR"): string {
  if (price == null) return "Price on request";
  if (price >= 1_00_00_000) {
    const cr = price / 1_00_00_000;
    const symbol = "₹";
    return `${symbol}${cr.toFixed(cr % 1 === 0 ? 0 : 1)} Cr`;
  }
  if (price >= 1_00_000) {
    const lakhs = price / 1_00_000;
    const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : "";
    return `${symbol}${lakhs.toFixed(lakhs % 1 === 0 ? 0 : 1)} L`;
  }
  return formatPrice(price, currency);
}

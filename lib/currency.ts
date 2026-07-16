export function formatMoney(value: number, currency = "MAD") {
  const amount = Number.isFinite(value) ? value : 0;
  const code = currency.trim().toUpperCase() || "MAD";
  return `${code} ${amount.toFixed(2)}`;
}

/**
 * Selling line price after discount (amount subtracted or percent off).
 */
function effectiveSellingUnit(product) {
  if (!product) return 0;
  const price = Number(product.price || 0);
  const disc = Number(product.discount || 0);
  if (product.discountType === "percent") {
    return Math.max(0, price - (price * disc) / 100);
  }
  return Math.max(0, price - disc);
}

module.exports = { effectiveSellingUnit };

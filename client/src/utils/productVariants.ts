import { ProductVariantFormValue } from '../components/product/VariantEditor';

export const validateProductVariants = (variants: ProductVariantFormValue[]) => {
  const combinations = new Set<string>();
  for (const [index, variant] of variants.entries()) {
    if (!variant.size.trim() || !variant.color.trim()) {
      return `Variant ${index + 1} needs a size and colour.`;
    }
    if (
      variant.stock.trim() === '' ||
      !Number.isInteger(Number(variant.stock)) ||
      Number(variant.stock) < 0
    ) {
      return `Variant ${index + 1} stock must be a non-negative whole number.`;
    }
    if (
      variant.lowStockThreshold.trim() === '' ||
      !Number.isInteger(Number(variant.lowStockThreshold)) ||
      Number(variant.lowStockThreshold) < 0
    ) {
      return `Variant ${index + 1} low-stock threshold must be a non-negative whole number.`;
    }
    const combination = `${variant.size.trim().toLowerCase()}|${variant.color.trim().toLowerCase()}`;
    if (combinations.has(combination)) {
      return 'Each size and colour combination must be unique.';
    }
    combinations.add(combination);
  }
  return '';
};

export const serializeProductVariants = (variants: ProductVariantFormValue[]) =>
  variants.map(({ _id, ...variant }) => ({
    ...(_id ? { _id } : {}),
    size: variant.size.trim(),
    color: variant.color.trim(),
    stock: Number(variant.stock),
    lowStockThreshold: Number(variant.lowStockThreshold),
    ...(variant.sku.trim() ? { sku: variant.sku.trim() } : {}),
  }));

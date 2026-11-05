/* eslint-disable no-console */
import mongoose, { Types } from 'mongoose';
import config from '../config';
import Product from '../modules/product/product.model';

type StoredVariant = Record<string, unknown> & { _id?: Types.ObjectId };

const nonNegativeStock = (value: unknown) => {
  const stock = Number(value);
  return Number.isInteger(stock) && stock >= 0 ? stock : 0;
};

async function migrateProductVariants() {
  await mongoose.connect(config.database_url as string);
  let migrated = 0;
  const cursor = Product.collection.find({});

  try {
    while (await cursor.hasNext()) {
      const product = await cursor.next();
      if (!product) continue;

      const storedVariants = Array.isArray(product.variants)
        ? (product.variants as StoredVariant[])
        : [];
      const variants: StoredVariant[] = storedVariants.length
        ? storedVariants.map((variant) => ({
            ...variant,
            _id: variant._id || new Types.ObjectId(),
            size: typeof variant.size === 'string' && variant.size.trim() ? variant.size : 'One Size',
            color: typeof variant.color === 'string' && variant.color.trim() ? variant.color : 'Unspecified',
            stock: nonNegativeStock(variant.stock),
            lowStockThreshold: nonNegativeStock(variant.lowStockThreshold ?? 5),
          }))
        : [
            {
              _id: new Types.ObjectId(),
              size:
                typeof product.size === 'string' && product.size.trim()
                  ? product.size
                  : 'One Size',
              color:
                typeof product.color === 'string' && product.color.trim()
                  ? product.color
                  : 'Unspecified',
              stock: nonNegativeStock(product.stock),
              lowStockThreshold: 5,
            },
          ];
      const totalStock = variants.reduce((total, variant) => total + nonNegativeStock(variant.stock), 0);

      await Product.collection.updateOne(
        { _id: product._id },
        { $set: { variants, stock: totalStock } },
      );
      migrated += 1;
    }

    console.info(`Variant migration completed. Updated ${migrated} product record(s).`);
  } finally {
    await cursor.close();
    await mongoose.disconnect();
  }
}

migrateProductVariants().catch((error: unknown) => {
  console.error('Variant migration failed:', error);
  process.exitCode = 1;
});

/* eslint-disable no-console */
import mongoose, { Types } from 'mongoose';
import config from '../config';
import Brand from '../modules/brand/brand.model';
import Category from '../modules/category/category.model';
import Product from '../modules/product/product.model';
import StockMovement from '../modules/product/stockMovement.model';
import Seller from '../modules/seller/seller.model';
import User from '../modules/user/user.model';

const demoProducts = [
  {
    name: "Men's Oversized T-shirt",
    category: "Men's Clothing",
    brand: 'Nike',
    price: 799,
    description: 'Relaxed-fit cotton jersey T-shirt with a dropped shoulder and a breathable everyday weight.',
    image: '/demo-products/oversized-tshirt.svg',
    variants: [
      { size: 'S', color: 'Black', stock: 12, sku: 'SS-MOT-BLK-S' },
      { size: 'M', color: 'Black', stock: 18, sku: 'SS-MOT-BLK-M' },
      { size: 'L', color: 'White', stock: 8, sku: 'SS-MOT-WHT-L' },
      { size: 'XL', color: 'White', stock: 5, sku: 'SS-MOT-WHT-XL' },
    ],
  },
  {
    name: "Men's Slim Fit Jeans",
    category: "Men's Clothing",
    brand: "Levi's",
    price: 1499,
    description: 'Mid-rise stretch denim with a streamlined slim fit, classic five-pocket styling, and durable stitching.',
    image: '/demo-products/denim-jeans.svg',
    variants: [
      { size: '30', color: 'Indigo', stock: 9, sku: 'SS-MSF-IND-30' },
      { size: '32', color: 'Indigo', stock: 14, sku: 'SS-MSF-IND-32' },
      { size: '34', color: 'Black', stock: 7, sku: 'SS-MSF-BLK-34' },
      { size: '36', color: 'Black', stock: 4, sku: 'SS-MSF-BLK-36' },
    ],
  },
  {
    name: "Women's Floral Summer Dress",
    category: "Women's Clothing",
    brand: 'H&M',
    price: 1299,
    description: 'Lightweight woven summer dress with a soft floral print, a relaxed waist, and an easy day-to-evening silhouette.',
    image: '/demo-products/floral-summer-dress.svg',
    variants: [
      { size: 'XS', color: 'Floral Pink', stock: 8, sku: 'SS-WFD-FPK-XS' },
      { size: 'S', color: 'Floral Pink', stock: 11, sku: 'SS-WFD-FPK-S' },
      { size: 'M', color: 'Floral Blue', stock: 7, sku: 'SS-WFD-FBL-M' },
      { size: 'L', color: 'Floral Blue', stock: 4, sku: 'SS-WFD-FBL-L' },
    ],
  },
  {
    name: "Women's Casual Hoodie",
    category: "Women's Clothing",
    brand: 'Zara',
    price: 1599,
    description: 'Soft brushed-fleece hoodie with a roomy front pocket, ribbed trims, and a comfortable relaxed fit.',
    image: '/demo-products/casual-hoodie.svg',
    variants: [
      { size: 'S', color: 'Grey', stock: 10, sku: 'SS-WCH-GRY-S' },
      { size: 'M', color: 'Grey', stock: 13, sku: 'SS-WCH-GRY-M' },
      { size: 'L', color: 'Black', stock: 7, sku: 'SS-WCH-BLK-L' },
      { size: 'XL', color: 'Black', stock: 5, sku: 'SS-WCH-BLK-XL' },
    ],
  },
  {
    name: "Women's Running Sneakers",
    category: 'Footwear',
    brand: 'Adidas',
    price: 2499,
    description: 'Breathable mesh running sneakers with a cushioned midsole and flexible everyday traction.',
    image: '/demo-products/running-sneakers.svg',
    variants: [
      { size: '5', color: 'White', stock: 10, sku: 'SS-WRS-WHT-05' },
      { size: '6', color: 'White', stock: 12, sku: 'SS-WRS-WHT-06' },
      { size: '7', color: 'White', stock: 8, sku: 'SS-WRS-WHT-07' },
      { size: '8', color: 'White', stock: 4, sku: 'SS-WRS-WHT-08' },
    ],
  },
  {
    name: "Men's Sports Shoes",
    category: 'Footwear',
    brand: 'Puma',
    price: 2199,
    description: 'Versatile lace-up sports shoes with a supportive upper, padded collar, and grippy rubber outsole.',
    image: '/demo-products/mens-sports-shoes.svg',
    variants: [
      { size: '7', color: 'Black', stock: 9, sku: 'SS-MSS-BLK-07' },
      { size: '8', color: 'Black', stock: 12, sku: 'SS-MSS-BLK-08' },
      { size: '9', color: 'White', stock: 8, sku: 'SS-MSS-WHT-09' },
      { size: '10', color: 'White', stock: 5, sku: 'SS-MSS-WHT-10' },
    ],
  },
  {
    name: "Women's Classic Handbag",
    category: 'Bags & Backpacks',
    brand: 'Zara',
    price: 1899,
    description: 'Structured carry-all handbag with a secure top closure, lined compartments, and detachable shoulder strap.',
    image: '/demo-products/classic-handbag.svg',
    variants: [
      { size: 'One Size', color: 'Tan', stock: 10, sku: 'SS-WCH-TAN-OS' },
      { size: 'One Size', color: 'Black', stock: 7, sku: 'SS-WCH-BLK-OS' },
      { size: 'One Size', color: 'Burgundy', stock: 4, sku: 'SS-WCH-BRG-OS' },
      { size: 'One Size', color: 'Cream', stock: 8, sku: 'SS-WCH-CRM-OS' },
    ],
  },
  {
    name: 'Urban Travel Backpack',
    category: 'Bags & Backpacks',
    brand: 'Skybags',
    price: 1499,
    description: 'Lightweight travel backpack with a padded laptop section, organizer pockets, and adjustable shoulder straps.',
    image: '/demo-products/urban-travel-backpack.svg',
    variants: [
      { size: 'One Size', color: 'Black', stock: 12, sku: 'SS-UTB-BLK-OS' },
      { size: 'One Size', color: 'Navy', stock: 8, sku: 'SS-UTB-NVY-OS' },
      { size: 'One Size', color: 'Olive', stock: 5, sku: 'SS-UTB-OLV-OS' },
      { size: 'One Size', color: 'Grey', stock: 3, sku: 'SS-UTB-GRY-OS' },
    ],
  },
  {
    name: 'Classic Analog Watch',
    category: 'Watches',
    brand: 'Fastrack',
    price: 1799,
    description: 'Everyday analog wristwatch with a clear dial, reliable quartz movement, and comfortable adjustable strap.',
    image: '/demo-products/classic-analog-watch.svg',
    variants: [
      { size: 'One Size', color: 'Black', stock: 9, sku: 'SS-CAW-BLK-OS' },
      { size: 'One Size', color: 'Silver', stock: 12, sku: 'SS-CAW-SLV-OS' },
      { size: 'One Size', color: 'Blue', stock: 7, sku: 'SS-CAW-BLU-OS' },
      { size: 'One Size', color: 'Rose Gold', stock: 4, sku: 'SS-CAW-RSG-OS' },
    ],
  },
  {
    name: 'Premium Leather Belt',
    category: 'Fashion Accessories',
    brand: 'Woodland',
    price: 899,
    description: 'Genuine leather belt with a smooth finish, sturdy brushed-metal buckle, and versatile everyday styling.',
    image: '/demo-products/leather-belt.svg',
    variants: [
      { size: '30', color: 'Brown', stock: 8, sku: 'SS-PLB-BRN-30' },
      { size: '32', color: 'Brown', stock: 11, sku: 'SS-PLB-BRN-32' },
      { size: '34', color: 'Black', stock: 7, sku: 'SS-PLB-BLK-34' },
      { size: '36', color: 'Black', stock: 4, sku: 'SS-PLB-BLK-36' },
    ],
  },
];

const findOrCreateByName = async (
  model: typeof Category | typeof Brand,
  userId: Types.ObjectId,
  name: string,
): Promise<Types.ObjectId> => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const existing = await model.findOne({
    user: userId,
    name: { $regex: `^${escapedName}$`, $options: 'i' },
  });
  if (existing) return existing._id;
  const created = await model.create({ user: userId, name });
  return created._id;
};

async function seedFashionDemo() {
  const userId = process.env.DEMO_USER_ID;
  if (!config.database_url) throw new Error('DATABASE_URL must be configured before seeding demo products.');
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new Error('Set DEMO_USER_ID to an existing account ID before seeding demo products.');
  }

  await mongoose.connect(config.database_url);
  try {
    const user = await User.findById(userId).select('_id');
    if (!user) throw new Error(`No user exists with DEMO_USER_ID=${userId}.`);

    let seller = await Seller.findOne({ user: user._id }).sort({ createdAt: 1 });
    const insertedProducts: Array<{ name: string; variants: number; stock: number }> = [];
    const skippedProducts: string[] = [];
    for (const demo of demoProducts) {
      const escapedName = demo.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existing = await Product.findOne({
        user: user._id,
        name: { $regex: `^${escapedName}$`, $options: 'i' },
      }).select('_id');
      if (existing) {
        skippedProducts.push(demo.name);
        console.info(`Skipped existing product: ${demo.name}`);
        continue;
      }

      if (!seller) {
        seller = await Seller.create({
          user: user._id,
          name: 'StyleStock Demo Supplier',
          email: 'demo-supplier@stylestock.local',
          contactNo: '0000000000',
        });
      }

      const category = await findOrCreateByName(Category, user._id, demo.category);
      const brand = await findOrCreateByName(Brand, user._id, demo.brand);
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        const [product] = await Product.create(
          [{
            user: user._id,
            seller: seller._id,
            category,
            brand,
            name: demo.name,
            price: demo.price,
            description: demo.description,
            images: [demo.image],
            status: 'active',
            variants: demo.variants.map((variant) => ({
              ...variant,
              lowStockThreshold: 5,
            })),
          }],
          { session },
        );
        const initialMovements = product.variants.map((variant) => ({
          user: user._id,
          product: product._id,
          variantId: variant._id,
          variantSize: variant.size,
          variantColor: variant.color,
          variantSku: variant.sku,
          type: 'initial_stock' as const,
          previousStock: 0,
          quantityChanged: variant.stock,
          newStock: variant.stock,
          reason: 'Initial demo inventory',
          referenceId: product._id,
          performedBy: user._id,
        }));
        await StockMovement.create(initialMovements, { session });
        await session.commitTransaction();
        const totalStock = product.variants.reduce((total, variant) => total + variant.stock, 0);
        insertedProducts.push({ name: demo.name, variants: product.variants.length, stock: totalStock });
        console.info(`Inserted: ${demo.name} (${product.variants.length} variants, ${totalStock} units)`);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
    }

    console.info('\nFashion demo seed report');
    console.info(`Inserted: ${insertedProducts.length}`);
    insertedProducts.forEach((product) => {
      console.info(`  + ${product.name} — ${product.variants} variants, ${product.stock} units`);
    });
    console.info(`Skipped (already existed): ${skippedProducts.length}`);
    skippedProducts.forEach((name) => console.info(`  = ${name}`));
    console.info(`Total configured variants: ${demoProducts.reduce((total, product) => total + product.variants.length, 0)}`);
  } finally {
    await mongoose.disconnect();
  }
}

seedFashionDemo().catch((error: unknown) => {
  console.error('Fashion demo seed failed:', error);
  process.exitCode = 1;
});

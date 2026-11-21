import { Router } from 'express';
import mongoose from 'mongoose';
import userRoutes from '../modules/user/user.routes';
import productRoute from '../modules/product/product.routes';
import saleRoutes from '../modules/sale/sale.routes';
import categoryRoutes from '../modules/category/category.routes';
import brandRoutes from '../modules/brand/brand.routes';
import sellerRoutes from '../modules/seller/seller.routes';
import purchaseRoutes from '../modules/purchase/purchase.routes';

const rootRouter = Router();

rootRouter.get('/health', async (_req, res) => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return res.status(503).json({
      success: false,
      statusCode: 503,
      message: 'Database is unavailable',
      database: 'disconnected'
    });
  }

  try {
    await mongoose.connection.db.admin().ping();
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Health check passed',
      database: 'connected'
    });
  } catch {
    return res.status(503).json({
      success: false,
      statusCode: 503,
      message: 'Database is unavailable',
      database: 'disconnected'
    });
  }
});

rootRouter.use('/users', userRoutes);
rootRouter.use('/products', productRoute);
rootRouter.use('/sales', saleRoutes);
rootRouter.use('/categories', categoryRoutes);
rootRouter.use('/brands', brandRoutes);
rootRouter.use('/sellers', sellerRoutes);
rootRouter.use('/purchases', purchaseRoutes);

export default rootRouter;

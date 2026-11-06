import httpStatus from 'http-status';
import asyncHandler from '../../lib/asyncHandler';
import sendResponse from '../../lib/sendResponse';
import productServices from './product.services';

class ProductControllers {
  services = productServices;

  /**
   * create new product
   */
  create = asyncHandler(async (req, res) => {
    const result = await this.services.create(req.body, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Product created successfully!',
      data: result
    });
  });

  /**
   * Add product to stock
   */
  addStock = asyncHandler(async (req, res) => {
    const result = await this.services.addToStock(req.params.id, req.body, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Product stock added successfully!',
      data: result
    });

  });

  getLowStock = asyncHandler(async (req, res) => {
    const result = await this.services.getLowStock(req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Low stock variants retrieved successfully',
      data: result
    });
  });

  getStockMovements = asyncHandler(async (req, res) => {
    const result = await this.services.getStockMovements(req.params.id, req.query, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Product stock movements retrieved successfully',
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPage: Math.ceil(result.total / result.limit),
      },
      data: result.data,
    });
  });

  getNotes = asyncHandler(async (req, res) => {
    const result = await this.services.getNotes(req.params.id, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Product notes retrieved successfully',
      data: result,
    });
  });

  createNote = asyncHandler(async (req, res) => {
    const result = await this.services.createNote(req.params.id, req.body.body, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Product note created successfully',
      data: result,
    });
  });

  deleteNote = asyncHandler(async (req, res) => {
    await this.services.deleteNote(req.params.id, req.params.noteId, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Product note deleted successfully',
    });
  });

  /**
   * Get all product of user with query
   */
  readAll = asyncHandler(async (req, res) => {
    const result = await this.services.readAll(req.query, req.user._id);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const total = result?.totalCount[0]?.total || 0;
    const safeLimit = limit > 0 ? limit : 10;

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'All products retrieved successfully',
      meta: {
        page,
        limit: safeLimit,
        total,
        totalPage: Math.ceil(total / safeLimit) || 1
      },
      data: result.data
    });
  });

  /**
   * Get total product
   */
  getTotalProduct = asyncHandler(async (req, res) => {
    const result = await this.services.countTotalProduct(req.user._id);
    const payload = result[0] ?? { totalProducts: 0, totalQuantity: 0 };

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Count total products successfully',
      data: payload
    });
  });

  /**
   * Get single product of user
   */
  readSingle = asyncHandler(async (req, res) => {
    const result = await this.services.read(req.params.id, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Product fetched successfully!',
      data: result
    });
  });

  /**
   * update product
   */
  update = asyncHandler(async (req, res) => {
    const result = await this.services.update(req.params.id, req.body, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Product updated successfully!',
      data: result
    });
  });

  /**
   * delete product
   */
  delete = asyncHandler(async (req, res) => {
    await this.services.delete(req.params.id, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Product delete successfully!'
    });
  });

  /**
   * delete multiple product
   */
  bulkDelete = asyncHandler(async (req, res) => {
    await this.services.bulkDelete(req.body, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Delete Selected Product successfully!'
    });
  });
}

const productControllers = new ProductControllers();
export default productControllers;

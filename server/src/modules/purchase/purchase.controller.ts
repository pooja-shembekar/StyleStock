import httpStatus from 'http-status';
import asyncHandler from '../../lib/asyncHandler';
import sendResponse from '../../lib/sendResponse';
import purchaseServices from './purchase.services';

class PurchaseController {
  private services = purchaseServices;

  // create
  create = asyncHandler(async (req, res) => {
    const result = await this.services.create(req.body, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Purchase created successfully!',
      data: result
    });
  });

  // read
  getAll = asyncHandler(async (req, res) => {
    const result = await this.services.getAll(req.user._id, req.query);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const total = result?.totalCount || 0;
    const safeLimit = limit > 0 ? limit : 10;

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Purchase retrieved successfully!',
      meta: {
        page,
        limit: safeLimit,
        total,
        totalPage: Math.ceil(total / safeLimit) || 1
      },
      data: result.data
    });
  });

  // update
  update = asyncHandler(async (req, res) => {
    const result = await this.services.update(req.params.id, req.body, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Purchase updated successfully!',
      data: result
    });
  });

  // delete
  delete = asyncHandler(async (req, res) => {
    await this.services.delete(req.params.id, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Purchase deleted successfully!'
    });
  });
}

const purchaseController = new PurchaseController();
export default purchaseController;

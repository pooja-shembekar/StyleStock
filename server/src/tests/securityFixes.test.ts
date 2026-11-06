import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import express, { Router } from 'express';
import { FilterQuery, Schema, Types, model } from 'mongoose';
import jwt from 'jsonwebtoken';
import config from '../config';
import globalErrorHandler from '../middlewares/globalErrorhandler';
import validateRequest from '../middlewares/validateRequest';
import BaseServices from '../modules/baseServices';
import categoryRoutes from '../modules/category/category.routes';
import categoryServices from '../modules/category/category.services';
import { ICategory } from '../modules/category/category.interface';
import brandRoutes from '../modules/brand/brand.routes';
import brandServices from '../modules/brand/brand.services';
import CustomError from '../errors/customError';
import User from '../modules/user/user.model';
import userValidator from '../modules/user/user.validator';
import { once } from 'node:events';
import { Server } from 'node:http';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import userServices from '../modules/user/user.services';
import app from '../app';
import mongoose from 'mongoose';
import sellerServices from '../modules/seller/seller.services';
import saleServices from '../modules/sale/sale.services';
import saleValidator from '../modules/sale/sale.validator';
import purchaseServices from '../modules/purchase/purchase.services';
import purchaseValidator from '../modules/purchase/purchase.validator';
import productServices from '../modules/product/product.services';
import Product from '../modules/product/product.model';
import StockMovement from '../modules/product/stockMovement.model';
import { getPagination, escapeRegex } from '../lib/queryUtils';

const originalJwtSecret = config.jwt_secret;
config.jwt_secret = 'security-fix-tests-only';
after(() => {
  config.jwt_secret = originalJwtSecret;
});

function replaceProperty(target: object, key: string, value: unknown) {
  const original = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, writable: true, value });

  return () => {
    if (original) Object.defineProperty(target, key, original);
    else Reflect.deleteProperty(target, key);
  };
}

async function listen(app: express.Application) {
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Test server did not bind to a TCP port');
  return { server, url: `http://127.0.0.1:${address.port}` };
}

async function close(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('base update/delete restrict queries to the authenticated owner', async () => {
  const recordId = new Types.ObjectId();
  const ownerA = new Types.ObjectId();
  const ownerB = new Types.ObjectId();
  let recordExists = true;
  let recordName = 'owned by user B';
  const service = new BaseServices<ICategory>(model<ICategory>(
    'SecurityFixCategoryTest',
    new Schema<ICategory>({ user: Schema.Types.ObjectId, name: String })
  ), 'Category');
  const matchesUserBRecord = (filter: FilterQuery<ICategory>) =>
    filter._id instanceof Types.ObjectId &&
    filter._id.equals(recordId) &&
    filter.user instanceof Types.ObjectId &&
    filter.user.equals(ownerB);

  let updateFilter: FilterQuery<ICategory> | undefined;
  const restoreUpdate = replaceProperty(
    service['model'],
    'findOneAndUpdate',
    async (filter: FilterQuery<ICategory>) => {
      updateFilter = filter;
      if (matchesUserBRecord(filter)) recordName = 'modified by user A';
      return null;
    }
  );
  try {
    await assert.rejects(
      service.update(recordId.toString(), { $set: { name: 'changed' } }, ownerA.toString()),
      (error: unknown) => error instanceof CustomError && error.statusCode === 404
    );
    assert.deepEqual(updateFilter, { _id: recordId, user: ownerA });
    assert.equal(recordName, 'owned by user B');
  } finally {
    restoreUpdate();
  }

  let deleteFilter: FilterQuery<ICategory> | undefined;
  const restoreDelete = replaceProperty(service['model'], 'findOneAndDelete', async (filter: FilterQuery<ICategory>) => {
    deleteFilter = filter;
    if (matchesUserBRecord(filter)) recordExists = false;
    return null;
  });
  try {
    await assert.rejects(
      service.delete(recordId.toString(), ownerA.toString()),
      (error: unknown) => error instanceof CustomError && error.statusCode === 404
    );
    assert.deepEqual(deleteFilter, { _id: recordId, user: ownerA });
    assert.equal(recordExists, true);
  } finally {
    restoreDelete();
  }
});

async function assertScopedPatchRoute(
  router: Router,
  services: object,
  path: string,
  userId: string,
  recordId: string
) {
  let updateCall: { id: string; payload: Record<string, unknown>; userId: string } | undefined;
  let createCalled = false;
  const restoreUpdate = replaceProperty(
    services,
    'update',
    async (id: string, payload: Record<string, unknown>, authenticatedUserId: string) => {
      updateCall = { id, payload, userId: authenticatedUserId };
      return { _id: id, ...payload };
    }
  );
  const restoreCreate = replaceProperty(services, 'create', async () => {
    createCalled = true;
    return {};
  });
  const app = express();
  app.use(express.json());
  app.use(path, router);
  app.use(globalErrorHandler);
  const { server, url } = await listen(app);

  try {
    const token = jwt.sign({ _id: userId, email: 'security-test@example.invalid' }, config.jwt_secret!);
    const response = await fetch(`${url}${path}/${recordId}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Updated', user: 'attacker-controlled' })
    });
    assert.equal(response.status, 200);
    const body = await response.json() as { data: { name: string } };
    assert.equal(body.data.name, 'Updated');
    assert.equal(createCalled, false);
    assert.deepEqual(updateCall, { id: recordId, payload: { name: 'Updated' }, userId });

    const invalidResponse = await fetch(`${url}${path}/${recordId}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 7 })
    });
    assert.equal(invalidResponse.status, 400);
    assert.equal(updateCall?.payload.name, 'Updated');
  } finally {
    await close(server);
    restoreCreate();
    restoreUpdate();
  }
}

test('category PATCH updates the owned record and validates the parsed body', async () => {
  await assertScopedPatchRoute(
    categoryRoutes,
    categoryServices,
    '/categories',
    new Types.ObjectId().toString(),
    new Types.ObjectId().toString()
  );
});

test('brand PATCH updates the owned record and validates the parsed body', async () => {
  await assertScopedPatchRoute(
    brandRoutes,
    brandServices,
    '/brands',
    new Types.ObjectId().toString(),
    new Types.ObjectId().toString()
  );
});

test('validateRequest replaces the body with Zod-parsed data and rejects invalid input', async () => {
  const app = express();
  app.use(express.json());
  app.post(
    '/validated',
    validateRequest(z.object({ name: z.string() })),
    (req, res) => res.json(req.body)
  );
  app.use(globalErrorHandler);
  const { server, url } = await listen(app);

  try {
    const validResponse = await fetch(`${url}/validated`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'allowed', role: 'ADMIN' })
    });
    assert.deepEqual(await validResponse.json(), { name: 'allowed' });

    const invalidResponse = await fetch(`${url}/validated`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 3 })
    });
    assert.equal(invalidResponse.status, 400);
  } finally {
    await close(server);
  }
});

test('registration requires confirmPassword and strips unvalidated role fields', () => {
  const result = userValidator.registerSchema.parse({
    name: 'Test user',
    email: 'test@example.invalid',
    password: 'passphrase',
    confirmPassword: 'passphrase',
    role: 'ADMIN'
  });
  assert.deepEqual(result, {
    name: 'Test user',
    email: 'test@example.invalid',
    password: 'passphrase',
    confirmPassword: 'passphrase'
  });
  assert.throws(() => userValidator.registerSchema.parse({
    name: 'Test user',
    email: 'test@example.invalid',
    password: 'passphrase'
  }));
});

test('registration and login responses omit the stored password hash', async () => {
  const rawPassword = 'test-password-for-auth-flow';
  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const storedUser = new User({
    name: 'Test user',
    email: 'test@example.invalid',
    password: passwordHash
  });
  const restoreCreate = replaceProperty(User, 'create', async () => storedUser);
  const restoreFindOne = replaceProperty(User, 'findOne', () => ({
    select: async () => storedUser
  }));

  try {
    const registration = await userServices.register({
      name: 'Test user',
      email: 'test@example.invalid',
      password: rawPassword,
      confirmPassword: rawPassword
    });
    const login = await userServices.login({
      email: 'test@example.invalid',
      password: rawPassword
    });

    for (const responseUser of [registration.user, login.user]) {
      assert.equal('password' in responseUser, false);
      assert.equal(JSON.stringify(responseUser).includes(passwordHash), false);
    }
    assert.equal(typeof registration.token, 'string');
    assert.equal(typeof login.token, 'string');
  } finally {
    restoreFindOne();
    restoreCreate();
  }
});

test('profile validation accepts model-backed fields but strips protected fields', () => {
  const parsed = userValidator.updatedProfileSchema.parse({
    email: 'profile@example.invalid',
    address: '1 Market Street',
    phone: '5550100',
    city: 'Example',
    country: 'Exampleland',
    facebook: 'https://facebook.example/profile',
    role: 'ADMIN',
    status: 'BLOCK',
    password: 'attacker-input'
  });
  assert.deepEqual(parsed, {
    email: 'profile@example.invalid',
    address: '1 Market Street',
    phone: '5550100',
    city: 'Example',
    country: 'Exampleland',
    facebook: 'https://facebook.example/profile'
  });
  assert.equal(userValidator.updatedProfileSchema.safeParse({ email: 'not-an-email' }).success, false);
  assert.equal(userValidator.updatedProfileSchema.safeParse({ role: 'ADMIN' }).success, false);
});

test('sale and purchase validators match fields their services actually persist', () => {
  const productId = new Types.ObjectId().toString();
  const variantId = new Types.ObjectId().toString();
  const sale = saleValidator.createSchema.parse({
    product: productId,
    variantId,
    quantity: 2,
    buyerName: 'Buyer',
    date: '2025-01-31',
    productName: 'Untrusted snapshot',
    productPrice: 1
  });
  assert.deepEqual(sale, {
    product: productId,
    variantId,
    quantity: 2,
    buyerName: 'Buyer',
    date: '2025-01-31'
  });
  assert.equal(saleValidator.createSchema.safeParse({
    product: productId,
    variantId,
    quantity: 2,
    buyerName: 'Buyer',
    date: '2025-02-31'
  }).success, false);
  assert.deepEqual(purchaseValidator.updateSchema.parse({ paid: 10 }), { paid: 10 });
  assert.equal(purchaseValidator.updateSchema.safeParse({ seller: productId }).success, false);
});

test('change-password verifies the old password and persists only a bcrypt hash', async () => {
  const oldPassword = 'old-test-password';
  const newPassword = 'new-test-password';
  const storedUser = new User({
    name: 'Test user',
    email: 'test@example.invalid',
    password: await bcrypt.hash(oldPassword, 10)
  });
  let updatePayload: { password?: string } | undefined;
  const restoreFindById = replaceProperty(User, 'findById', () => ({
    select: async () => storedUser
  }));
  const restoreUpdate = replaceProperty(User, 'findByIdAndUpdate', async (_id: string, update: { password?: string }) => {
    updatePayload = update;
    return storedUser;
  });

  try {
    const result = await userServices.changePassword(storedUser._id.toString(), { oldPassword, newPassword });
    assert.deepEqual(result, { success: true });
    assert.ok(updatePayload?.password);
    assert.notEqual(updatePayload.password, newPassword);
    assert.equal(await bcrypt.compare(newPassword, updatePayload.password!), true);
  } finally {
    restoreUpdate();
    restoreFindById();
  }
});

test('single seller and sale reads do not report another owner record as found', async () => {
  const recordId = new Types.ObjectId().toString();
  const userId = new Types.ObjectId().toString();

  const restoreSellerFind = replaceProperty(sellerServices['model'], 'findOne', () => null);
  try {
    await assert.rejects(
      sellerServices.read(recordId, userId),
      (error: unknown) => error instanceof CustomError && error.statusCode === 404
    );
  } finally {
    restoreSellerFind();
  }

  const restoreSaleFind = replaceProperty(saleServices['model'], 'findOne', () => ({
    populate: async () => null
  }));
  try {
    await assert.rejects(
      saleServices.read(recordId, userId),
      (error: unknown) => error instanceof CustomError && error.statusCode === 404
    );
  } finally {
    restoreSaleFind();
  }
});

test('product, sale, and purchase mutations filter by the authenticated owner', async () => {
  const recordId = new Types.ObjectId();
  const ownerId = new Types.ObjectId();
  const session = {
    startTransaction() {},
    async commitTransaction() {},
    async abortTransaction() {},
    async endSession() {}
  };
  const restoreSession = replaceProperty(mongoose, 'startSession', async () => session);

  let productFilter: Record<string, unknown> | undefined;
  const restoreProductFind = replaceProperty(Product, 'findOne', (filter: Record<string, unknown>) => {
    productFilter = filter;
    return { session: async () => null };
  });
  let productDeleteFilter: Record<string, unknown> | undefined;
  const restoreProductDelete = replaceProperty(Product, 'findOneAndDelete', async (filter: Record<string, unknown>) => {
    productDeleteFilter = filter;
    return null;
  });
  let bulkDeleteFilter: Record<string, unknown> | undefined;
  let bulkDeleteCalled = false;
  const restoreBulkCount = replaceProperty(Product, 'countDocuments', (filter: Record<string, unknown>) => {
    bulkDeleteFilter = filter;
    return { session: async () => 0 };
  });
  const restoreBulkDelete = replaceProperty(Product, 'deleteMany', async () => {
    bulkDeleteCalled = true;
    return { deletedCount: 1 };
  });

  let saleFilter: Record<string, unknown> | undefined;
  const restoreSaleFind = replaceProperty(saleServices['model'], 'findOne', (filter: Record<string, unknown>) => {
    saleFilter = filter;
    return { session: async () => null };
  });
  const purchaseFilters: Array<Record<string, unknown>> = [];
  const restorePurchaseFind = replaceProperty(purchaseServices['model'], 'findOne', (filter: Record<string, unknown>) => {
    purchaseFilters.push(filter);
    return { session: async () => null };
  });

  try {
    const notFound = (error: unknown) => error instanceof CustomError && error.statusCode === 404;
    await assert.rejects(productServices.update(recordId.toString(), { name: 'changed' }, ownerId.toString()), notFound);
    assert.deepEqual(productFilter, { _id: recordId.toString(), user: ownerId });

    await assert.rejects(productServices.delete(recordId.toString(), ownerId.toString()), notFound);
    assert.deepEqual(productDeleteFilter, { _id: recordId, user: ownerId });

    await assert.rejects(productServices.bulkDelete([recordId.toString()], ownerId.toString()), notFound);
    assert.deepEqual(bulkDeleteFilter, { _id: { $in: [recordId] }, user: ownerId });
    assert.equal(bulkDeleteCalled, false);

    await assert.rejects(saleServices.update(recordId.toString(), { quantity: 2 }, ownerId.toString()), notFound);
    assert.deepEqual(saleFilter, { _id: recordId.toString(), user: ownerId });
    await assert.rejects(saleServices.delete(recordId.toString(), ownerId.toString()), notFound);
    assert.deepEqual(saleFilter, { _id: recordId.toString(), user: ownerId });

    await assert.rejects(purchaseServices.update(recordId.toString(), { quantity: 2 }, ownerId.toString()), notFound);
    assert.equal(purchaseFilters[0]._id, recordId.toString());
    assert.deepEqual(purchaseFilters[0].user, ownerId);
    await assert.rejects(purchaseServices.delete(recordId.toString(), ownerId.toString()), notFound);
    const purchaseDeleteId = purchaseFilters[1]._id;
    if (!(purchaseDeleteId instanceof Types.ObjectId)) throw new Error('Purchase delete ID was not cast to ObjectId');
    assert.equal(purchaseDeleteId.equals(recordId), true);
    assert.deepEqual(purchaseFilters[1].user, ownerId);
  } finally {
    restorePurchaseFind();
    restoreSaleFind();
    restoreBulkDelete();
    restoreBulkCount();
    restoreProductDelete();
    restoreProductFind();
    restoreSession();
  }
});

test('purchase deletion reverses owned variant stock and records the adjustment transactionally', async () => {
  const userId = new Types.ObjectId();
  const productId = new Types.ObjectId();
  const purchaseId = new Types.ObjectId();
  const variantId = new Types.ObjectId();
  let updateFilter: Record<string, unknown> | undefined;
  let movement: Array<Record<string, unknown>> | undefined;
  let deleted = false;
  let committed = false;
  const session = {
    startTransaction() {},
    async commitTransaction() { committed = true; },
    async abortTransaction() {},
    async endSession() {}
  };
  const purchase = {
    _id: purchaseId,
    product: productId,
    variantId,
    quantity: 3,
    deleteOne: async () => { deleted = true; }
  };
  const updatedProduct = {
    _id: productId,
    variants: [{ _id: variantId, size: 'M', color: 'Black', stock: 7 }]
  };
  const restoreSession = replaceProperty(mongoose, 'startSession', async () => session);
  const restorePurchaseFind = replaceProperty(purchaseServices['model'], 'findOne', () => ({
    session: async () => purchase
  }));
  const restoreProductFind = replaceProperty(Product, 'findOne', () => ({
    session: async () => ({
      _id: productId,
      variants: [{ _id: variantId, size: 'M', color: 'Black', stock: 10 }]
    })
  }));
  const restoreProductUpdate = replaceProperty(Product, 'findOneAndUpdate', (filter: Record<string, unknown>) => {
    updateFilter = filter;
    return Promise.resolve(updatedProduct);
  });
  const restoreMovementCreate = replaceProperty(StockMovement, 'create', async (entries: Array<Record<string, unknown>>) => {
    movement = entries;
  });

  try {
    await purchaseServices.delete(purchaseId.toString(), userId.toString());
    assert.deepEqual(updateFilter, {
      _id: productId,
      user: userId,
      variants: { $elemMatch: { _id: variantId, stock: { $gte: 3 } } }
    });
    assert.equal(movement?.[0].previousStock, 10);
    assert.equal(movement?.[0].quantityChanged, -3);
    assert.equal(movement?.[0].newStock, 7);
    assert.equal(deleted, true);
    assert.equal(committed, true);
  } finally {
    restoreMovementCreate();
    restoreProductUpdate();
    restoreProductFind();
    restorePurchaseFind();
    restoreSession();
  }
});

test('health routes distinguish liveness from database readiness and preserve 404s', async () => {
  const { server, url } = await listen(app);
  try {
    for (const path of ['/', '/health']) {
      const response = await fetch(`${url}${path}`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { success: true, status: 'ok' });
    }

    const readiness = await fetch(`${url}/api/v1/health`);
    assert.ok([200, 503].includes(readiness.status));
    const readinessBody = await readiness.json() as Record<string, unknown>;
    assert.equal(readinessBody.status, readiness.status === 200 ? 'ready' : 'not_ready');
    assert.equal('stack' in readinessBody, false);
    assert.equal('database_url' in readinessBody, false);

    for (const path of ['/unknown', '/api/v1/unknown']) {
      const response = await fetch(`${url}${path}`);
      assert.equal(response.status, 404);
      const body = await response.json() as { success: boolean; statusCode: number };
      assert.equal(body.success, false);
      assert.equal(body.statusCode, 404);
    }

    const protectedResponse = await fetch(`${url}/api/v1/products`);
    assert.equal(protectedResponse.status, 401);

    const invalidJson = await fetch(`${url}/api/v1/users/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{invalid'
    });
    assert.equal(invalidJson.status, 400);
    assert.equal((await invalidJson.json()).message, 'Invalid JSON request body');

    const allowedOrigin = config.client_url
      ? new URL(config.client_url).origin
      : config.nodeEnv === 'production' ? undefined : 'http://localhost:5173';
    if (allowedOrigin) {
      const allowedResponse = await fetch(`${url}/health`, { headers: { origin: allowedOrigin } });
      assert.equal(allowedResponse.headers.get('access-control-allow-origin'), allowedOrigin);
    }
    const blockedOrigin = await fetch(`${url}/health`, {
      headers: { origin: 'https://unauthorized-origin.example' }
    });
    assert.equal(blockedOrigin.status, 403);
  } finally {
    await close(server);
  }
});

test('pagination limits are bounded and search patterns are treated literally', () => {
  assert.deepEqual(getPagination({ page: '-2', limit: '1000000' }), { page: 1, limit: 100 });
  assert.deepEqual(getPagination({ page: '3', limit: '25' }), { page: 3, limit: 25 });
  assert.equal(escapeRegex('.*[shirt]'), '\\.\\*\\[shirt\\]');
});

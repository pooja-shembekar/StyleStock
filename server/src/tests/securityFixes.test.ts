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

async function listen(app: express.Express) {
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

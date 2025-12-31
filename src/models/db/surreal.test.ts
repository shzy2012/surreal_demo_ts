import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SurrealService, initSurrealDB, closeSurrealDB } from './surreal';
import type { User } from '../UserModel';

describe('SurrealService', () => {
  let userService: SurrealService<User>;

  beforeAll(async () => {
    // 初始化数据库连接
    await initSurrealDB();
    // 等待连接完全就绪
    await new Promise((resolve) => setTimeout(resolve, 500));

    userService = new SurrealService<User>('test_user');

    // 清理测试表
    try {
      await userService.query('DELETE test_user');
    } catch {
      // Ignored if table doesn't exist
    }
  });

  afterAll(async () => {
    // 清理测试表
    await userService.query('DELETE test_user');
    // 关闭连接
    await closeSurrealDB();
  });

  it(' should add a new record', async () => {
    const data = {
      name: 'Test Admin',
      email: 'admin@test.com',
      age: 30,
    };
    const result = await userService.add(data as User);
    expect(result.name).toBe(data.name);
    expect(result.id).toBeDefined();
  });

  it('should add many records', async () => {
    const users: Partial<User>[] = [
      { name: 'User 1', email: 'user1@test.com', age: 20 },
      { name: 'User 2', email: 'user2@test.com', age: 25 },
    ];

    const results = await userService.addMany(users as User[]);
    expect(results).toHaveLength(2);
    expect(results[0]!.name).toBe('User 1');
    expect(results[1]!.name).toBe('User 2');
  });

  it('should find a record by ID', async () => {
    const user = await userService.add({
      name: 'Find Me',
      email: 'findme@test.com',
      age: 22,
    } as User);
    if (!user.id) throw new Error('ID should be defined');

    const found = await userService.findById(user.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Find Me');
  });

  it('should find all records', async () => {
    const all = await userService.findAll();
    expect(all.length).toBeGreaterThanOrEqual(4); // 1 + 2 + 1 from previous tests
  });

  it('should find records by conditions', async () => {
    const results = await userService.findBy({ age: 25 } as Partial<User>);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0]!.age).toBe(25);
  });

  it('should update a record', async () => {
    const user = await userService.add({
      name: 'Old Name',
      email: 'old@test.com',
      age: 40,
    } as User);
    if (!user.id) throw new Error('ID should be defined');

    const updated = await userService.update(user.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');

    const fetched = await userService.findById(user.id);
    expect(fetched!.name).toBe('New Name');
  });

  it('should check if record exists', async () => {
    const user = await userService.add({
      name: 'Exists',
      email: 'exists@test.com',
      age: 10,
    } as User);
    if (!user.id) throw new Error('ID should be defined');

    const exists = await userService.exists(user.id);
    expect(exists).toBe(true);

    const notExists = await userService.exists('test_user:non_existent');
    expect(notExists).toBe(false);
  });

  it('should count records', async () => {
    const total = await userService.count();
    expect(total).toBeGreaterThan(0);

    const count25 = await userService.count({ age: 25 } as Partial<User>);
    expect(count25).toBeGreaterThanOrEqual(1);
  });

  it('should paginate records', async () => {
    // 确保至少有 2 条记录用于测试分页
    await userService.add({ name: 'Page 1', email: 'p1@test.com', age: 31 } as User);
    await userService.add({ name: 'Page 2', email: 'p2@test.com', age: 32 } as User);

    const result = await userService.paginate(1, 2);
    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.pageSize).toBe(2);
    expect(result.page).toBe(1);
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it('should delete a record', async () => {
    const user = await userService.add({
      name: 'Delete Me',
      email: 'delete@test.com',
      age: 50,
    } as User);
    if (!user.id) throw new Error('ID should be defined');

    const deleted = await userService.delete(user.id);
    expect(deleted).toBe(true);

    const found = await userService.findById(user.id);
    expect(found).toBeNull();
  });

  it('should execute custom query', async () => {
    const result = await userService.query<User[]>('SELECT * FROM test_user WHERE age > $age', {
      age: 20,
    });
    expect(Array.isArray(result)).toBe(true);
    result.forEach((u) => {
      expect(u.age).toBeGreaterThan(20);
    });
  });
});

/**
 * SurrealDB CRUD 使用示例
 *
 * 此文件展示了如何使用 SurrealService 进行数据库操作
 */

import { SurrealService, type QueryCondition } from './surreal';

// 定义数据模型接口
interface User {
  id?: string;
  name: string;
  email: string;
  age: number;
  createdAt?: string;
}

// 创建服务实例
const userService = new SurrealService<User>('user');

/**
 * 示例：创建记录
 */
export async function createUserExample() {
  const newUser = await userService.create({
    name: '张三',
    email: 'zhangsan@example.com',
    age: 25,
  });
  console.log('创建的用户:', newUser);
  return newUser;
}

/**
 * 示例：批量创建记录
 */
export async function createManyUsersExample() {
  const users = await userService.createMany([
    { name: '李四', email: 'lisi@example.com', age: 30 },
    { name: '王五', email: 'wangwu@example.com', age: 28 },
  ]);
  console.log('批量创建的用户:', users);
  return users;
}

/**
 * 示例：根据 ID 查询
 */
export async function findByIdExample(id: string) {
  const user = await userService.findById(id);
  if (user) {
    console.log('找到用户:', user);
  } else {
    console.log('用户不存在');
  }
  return user;
}

/**
 * 示例：查询所有记录
 */
export async function findAllUsersExample() {
  const users = await userService.findAll();
  console.log('所有用户:', users);
  return users;
}

/**
 * 示例：根据条件查询（简单条件）
 */
export async function findByExample() {
  // 使用对象条件
  const users = await userService.findBy({ age: 25 });
  console.log('年龄为 25 的用户:', users);
  return users;
}

/**
 * 示例：根据条件查询（复杂条件）
 */
export async function findByComplexExample() {
  // 使用 QueryCondition 数组支持多种操作符
  const conditions: QueryCondition[] = [
    { field: 'age', operator: '>', value: 20 },
    { field: 'age', operator: '<', value: 30 },
    { field: 'email', operator: 'LIKE', value: '%@example.com' },
  ];
  const users = await userService.findBy(conditions);
  console.log('符合条件的用户:', users);
  return users;
}

/**
 * 示例：查询单条记录
 */
export async function findOneExample() {
  const user = await userService.findOne({ email: 'zhangsan@example.com' });
  if (user) {
    console.log('找到用户:', user);
  }
  return user;
}

/**
 * 示例：检查记录是否存在
 */
export async function existsExample(id: string) {
  const exists = await userService.exists(id);
  console.log(`用户 ${id} 是否存在:`, exists);
  return exists;
}

/**
 * 示例：更新记录
 */
export async function updateExample(id: string) {
  const updatedUser = await userService.update(id, {
    age: 26,
    name: '张三（已更新）',
  });
  console.log('更新后的用户:', updatedUser);
  return updatedUser;
}

/**
 * 示例：批量更新记录
 */
export async function updateManyExample(ids: string[]) {
  const updatedUsers = await userService.updateMany(ids, {
    age: 27,
  });
  console.log('批量更新后的用户:', updatedUsers);
  return updatedUsers;
}

/**
 * 示例：根据条件更新记录
 */
export async function updateByExample() {
  const updatedUsers = await userService.updateBy({ age: 25 }, { age: 26 });
  console.log('条件更新后的用户:', updatedUsers);
  return updatedUsers;
}

/**
 * 示例：更新或创建（Upsert）
 */
export async function upsertExample(id: string) {
  const user = await userService.upsert(id, {
    name: '赵六',
    email: 'zhaoliu@example.com',
    age: 32,
  });
  console.log('Upsert 后的用户:', user);
  return user;
}

/**
 * 示例：删除记录
 */
export async function deleteExample(id: string) {
  const success = await userService.delete(id);
  console.log(`删除用户 ${id}:`, success ? '成功' : '失败');
  return success;
}

/**
 * 示例：批量删除记录
 */
export async function deleteManyExample(ids: string[]) {
  const success = await userService.deleteMany(ids);
  console.log('批量删除:', success ? '成功' : '失败');
  return success;
}

/**
 * 示例：根据条件删除记录
 */
export async function deleteByExample() {
  const deletedCount = await userService.deleteBy({ age: 30 });
  console.log(`删除了 ${deletedCount} 条记录`);
  return deletedCount;
}

/**
 * 示例：统计记录数量
 */
export async function countExample() {
  // 统计所有记录
  const totalCount = await userService.count();
  console.log('总记录数:', totalCount);

  // 根据条件统计
  const age25Count = await userService.count({ age: 25 });
  console.log('年龄为 25 的记录数:', age25Count);

  return { totalCount, age25Count };
}

/**
 * 示例：分页查询
 */
export async function paginateExample() {
  // 简单分页
  const page1 = await userService.paginate(1, 10);
  console.log('第 1 页:', page1);

  // 带条件的分页
  const page2 = await userService.paginate(2, 10, { age: 25 });
  console.log('第 2 页（年龄为 25）:', page2);

  // 带排序的分页
  const page3 = await userService.paginate(1, 10, undefined, {
    field: 'age',
    direction: 'DESC',
  });
  console.log('按年龄降序排列:', page3);

  return { page1, page2, page3 };
}

/**
 * 示例：自定义查询
 */
export async function customQueryExample() {
  // 使用自定义 SQL 查询
  const result = await userService.query<User[]>(
    'SELECT * FROM user WHERE age > $minAge ORDER BY age DESC LIMIT 10',
    { minAge: 20 },
  );
  console.log('自定义查询结果:', result);
  return result;
}

/**
 * 完整示例：CRUD 操作流程
 */
export async function fullCrudExample() {
  try {
    // 1. 创建
    const user = await userService.create({
      name: '测试用户',
      email: 'test@example.com',
      age: 25,
    });
    console.log('1. 创建用户:', user);

    // 2. 查询
    const foundUser = await userService.findById(user.id!);
    console.log('2. 查询用户:', foundUser);

    // 3. 更新
    const updatedUser = await userService.update(user.id!, {
      age: 26,
    });
    console.log('3. 更新用户:', updatedUser);

    // 4. 删除
    const deleted = await userService.delete(user.id!);
    console.log('4. 删除用户:', deleted ? '成功' : '失败');
  } catch (error) {
    console.error('CRUD 操作失败:', error);
  }
}

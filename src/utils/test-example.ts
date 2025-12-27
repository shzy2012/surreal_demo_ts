/**
 * 测试 surreal-example.ts 中的示例函数
 *
 * 使用方法：
 * 1. 确保 SurrealDB 服务正在运行
 * 2. 运行: npx tsx src/utils/test-example.ts
 * 或者: node --loader ts-node/esm src/utils/test-example.ts
 */

import { initSurrealDB } from './surreal';

async function runTests() {
  try {
    // 先初始化 SurrealDB 连接（必须在导入示例函数之前）
    console.log('正在初始化 SurrealDB 连接...');
    await initSurrealDB();
    console.log('SurrealDB 连接成功！\n');

    // 在数据库初始化后再导入示例函数
    const {
      createUserExample,
      createManyUsersExample,
      findByIdExample,
      findAllUsersExample,
      findByExample,
      findByComplexExample,
      findOneExample,
      existsExample,
      countExample,
      paginateExample,
      customQueryExample,
      fullCrudExample,
    } = await import('./surreal-example');

    // 运行完整 CRUD 示例
    console.log('=== 运行完整 CRUD 示例 ===');
    await fullCrudExample();
    console.log('\n');

    // 运行其他示例
    console.log('=== 运行其他示例 ===');

    // 创建用户
    console.log('1. 创建用户示例');
    const newUser = await createUserExample();
    console.log('\n');

    // 批量创建
    console.log('2. 批量创建用户示例');
    await createManyUsersExample();
    console.log('\n');

    // 查询所有
    console.log('3. 查询所有用户');
    await findAllUsersExample();
    console.log('\n');

    // 根据 ID 查询
    if (newUser?.id) {
      console.log('4. 根据 ID 查询用户');
      await findByIdExample(newUser.id);
      console.log('\n');
    }

    // 条件查询
    console.log('5. 条件查询示例');
    await findByExample();
    console.log('\n');

    // 复杂条件查询
    console.log('6. 复杂条件查询示例');
    await findByComplexExample();
    console.log('\n');

    // 查询单条
    console.log('7. 查询单条记录示例');
    await findOneExample();
    console.log('\n');

    // 检查存在
    if (newUser?.id) {
      console.log('8. 检查记录是否存在');
      await existsExample(newUser.id);
      console.log('\n');
    }

    // 统计数量
    console.log('9. 统计记录数量');
    await countExample();
    console.log('\n');

    // 分页查询
    console.log('10. 分页查询示例');
    await paginateExample();
    console.log('\n');

    // 自定义查询
    console.log('11. 自定义查询示例');
    await customQueryExample();
    console.log('\n');

    console.log('所有测试完成！');
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
void runTests();

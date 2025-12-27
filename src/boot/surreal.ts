import { boot } from 'quasar/wrappers';
import { initSurrealDB } from 'src/utils/surreal';

export default boot(async () => {
  try {
    await initSurrealDB();
    console.log('SurrealDB 连接成功');
  } catch (error) {
    console.error('SurrealDB 初始化失败:', error);
    // 不抛出错误，允许应用继续运行，但会在使用时显示错误
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
    }
  }
});

import { Surreal } from 'surrealdb';

// SurrealDB 连接配置
export interface DbConfig {
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
}

// 默认配置
const DEFAULT_CONFIG: DbConfig = {
  url: 'ws://localhost:8000/rpc',
  namespace: 'test',
  database: 'test',
  username: 'root',
  password: 'root',
};

// 全局 SurrealDB 实例
let dbInstance: Surreal | null = null;

/**
 * 获取数据库实例
 */
export async function getDb(config: DbConfig): Promise<Surreal> {
  const db = new Surreal();

  try {
    await db.connect(config.url, {
      auth: {
        username: config.username,
        password: config.password,
      },
    });
    await db.use({ namespace: config.namespace, database: config.database });
    return db;
  } catch (err) {
    console.error(
      'Failed to connect to SurrealDB:',
      err instanceof Error ? err.message : String(err),
    );
    await db.close();
    throw err;
  }
}

/**
 * 初始化 SurrealDB 连接
 */
export async function initSurrealDB(): Promise<Surreal> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await getDb(DEFAULT_CONFIG);
    return dbInstance;
  } catch (error) {
    console.error('SurrealDB 连接失败:', error);
    dbInstance = null;
    throw error;
  }
}

/**
 * 检查 SurrealDB 是否已初始化
 */
export function isSurrealDBInitialized(): boolean {
  return dbInstance !== null;
}

/**
 * 获取 SurrealDB 实例
 */
export function getSurrealDB(): Surreal {
  if (!dbInstance) {
    throw new Error('SurrealDB 未初始化，请先调用 initSurrealDB()');
  }
  return dbInstance;
}

/**
 * 关闭 SurrealDB 连接
 */
export async function closeSurrealDB(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

// 查询条件操作符
export type QueryOperator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'IN' | 'NOT IN';

// 查询条件
export interface QueryCondition {
  field: string;
  operator?: QueryOperator;
  value: unknown;
}

// 分页结果
export interface PaginateResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 通用 CRUD 服务类
 */
export class SurrealService<T> {
  private db: Surreal;
  private table: string;

  constructor(table: string) {
    this.db = getSurrealDB();
    this.table = table;
  }

  /**
   * 构建 WHERE 子句
   */
  private buildWhereClause(conditions: Partial<T> | QueryCondition[]): string {
    if (Array.isArray(conditions)) {
      return conditions
        .map((cond) => {
          const field = cond.field;
          const operator = cond.operator || '=';
          let condition: string;

          if (operator === 'IN' || operator === 'NOT IN') {
            const values = Array.isArray(cond.value) ? cond.value : [cond.value];
            const value = `[${values.map((v) => JSON.stringify(v)).join(', ')}]`;
            condition = `${field} ${operator} ${value}`;
          } else if (operator === 'LIKE') {
            // SurrealDB 使用下划线命名法：string::contains(), string::starts_with(), string::ends_with()
            const pattern = String(cond.value);
            if (pattern.startsWith('%') && pattern.endsWith('%')) {
              // %pattern% -> contains
              const searchStr = pattern.slice(1, -1);
              condition = `string::contains(${field}, ${JSON.stringify(searchStr)})`;
            } else if (pattern.startsWith('%')) {
              // %pattern -> ends_with
              const searchStr = pattern.slice(1);
              condition = `string::ends_with(${field}, ${JSON.stringify(searchStr)})`;
            } else if (pattern.endsWith('%')) {
              // pattern% -> starts_with
              const searchStr = pattern.slice(0, -1);
              condition = `string::starts_with(${field}, ${JSON.stringify(searchStr)})`;
            } else {
              // 精确匹配
              condition = `${field} = ${JSON.stringify(cond.value)}`;
            }
          } else {
            const value = JSON.stringify(cond.value);
            condition = `${field} ${operator} ${value}`;
          }

          return condition;
        })
        .join(' AND ');
    }

    return Object.entries(conditions)
      .map(([key, value]) => {
        return `${key} = ${JSON.stringify(value)}`;
      })
      .join(' AND ');
  }

  /**
   * 格式化记录，确保 id 是字符串
   */
  private formatRecord(record: unknown): T {
    if (record && typeof record === 'object' && 'id' in record) {
      const r = record as Record<string, unknown>;
      if (typeof r.id === 'object' && r.id !== null && 'id' in r.id && 'tb' in r.id) {
        const rid = r.id as { tb: string; id: string };
        r.id = `${rid.tb}:${rid.id}`;
      } else {
        r.id = String(r.id);
      }
    }
    return record as T;
  }

  /**
   * 创建记录
   */
  async add(data: T): Promise<T> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (this.db.create as (table: string, data: any) => Promise<T | T[]>)(
        this.table,
        data,
      );
      const records = Array.isArray(result) ? result : [result];
      if (!records[0]) {
        throw new Error('创建记录失败：未返回结果');
      }
      return this.formatRecord(records[0]);
    } catch (error) {
      console.error(`创建 ${this.table} 记录失败:`, error);
      throw error;
    }
  }

  /**
   * 创建多条记录
   */
  async addMany(dataArray: T[]): Promise<T[]> {
    try {
      const results = await Promise.all(dataArray.map((data) => this.add(data)));
      return results;
    } catch (error) {
      console.error(`批量创建 ${this.table} 记录失败:`, error);
      throw error;
    }
  }

  /**
   * 根据 ID 查询单条记录
   */
  async findById(id: string): Promise<T | null> {
    try {
      if (!id) {
        console.error(`无效的 ID: ${id}`);
        return null;
      }
      // 确保 ID 是字符串类型
      const idStr = String(id);
      // 如果 ID 已经包含表名（格式为 table:id），直接使用；否则添加表名
      const recordId = idStr.includes(':') ? idStr : `${this.table}:${idStr}`;

      // 使用 db.query 替代 db.select 以获得更一致的结果结构
      const query = `SELECT * FROM ${recordId}`;
      const result = await this.db.query<unknown[]>(query);

      const firstResult = result[0];
      if (firstResult && typeof firstResult === 'object') {
        if ('result' in firstResult) {
          const records = (firstResult.result as unknown[]) || [];
          return records[0] ? this.formatRecord(records[0]) : null;
        }
        if (Array.isArray(firstResult)) {
          return firstResult[0] ? this.formatRecord(firstResult[0]) : null;
        }
      }
      return null;
    } catch (error) {
      console.error(`查询 ${this.table}:${id} 失败:`, error);
      return null;
    }
  }

  /**
   * 查询所有记录
   */
  async findAll(): Promise<T[]> {
    try {
      const result = await (this.db.select as (table: string) => Promise<T | T[]>)(this.table);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error(`查询所有 ${this.table} 记录失败:`, error);
      throw error;
    }
  }

  /**
   * 根据条件查询记录
   */
  async findBy(conditions: Partial<T> | QueryCondition[]): Promise<T[]> {
    try {
      const whereClause = this.buildWhereClause(conditions);
      const query = `SELECT * FROM ${this.table} WHERE ${whereClause}`;
      const result = await this.db.query<unknown[]>(query);

      // SurrealDB query returns an array of results for each statement
      const firstResult = result[0];
      if (firstResult && typeof firstResult === 'object') {
        // In newer SurrealDB JS versions, the result is directly the data or inside a result property
        if ('result' in firstResult) {
          const records = (firstResult.result as unknown[]) || [];
          return records.map((r) => this.formatRecord(r));
        }
        if ('status' in firstResult && (firstResult as { status: string }).status === 'ERR') {
          const errRes = firstResult as { detail?: string; message?: string };
          console.error(`SurrealDB Query Error: ${errRes.detail || errRes.message}`);
          return [];
        }
        // If it's an array, it might be the result directly
        if (Array.isArray(firstResult)) {
          return firstResult.map((r) => this.formatRecord(r));
        }
      }
      const finalResult = result || [];
      return finalResult.map((r) => this.formatRecord(r));
    } catch (error) {
      console.error(`条件查询 ${this.table} 失败:`, error);
      throw error;
    }
  }

  /**
   * 查询单条记录（根据条件）
   */
  async findOne(conditions: Partial<T> | QueryCondition[]): Promise<T | null> {
    try {
      const results = await this.findBy(conditions);
      return results[0] || null;
    } catch (error) {
      console.error(`查询单条 ${this.table} 记录失败:`, error);
      throw error;
    }
  }

  /**
   * 检查记录是否存在
   */
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
  }

  /**
   * 根据条件检查记录是否存在
   */
  async existsBy(conditions: Partial<T> | QueryCondition[]): Promise<boolean> {
    const record = await this.findOne(conditions);
    return record !== null;
  }

  /**
   * 更新记录
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      if (!id) {
        throw new Error(`无效的 ID: ${id}`);
      }
      // 确保 ID 是字符串类型
      const idStr = String(id);
      // 如果 ID 已经包含表名（格式为 table:id），直接使用；否则添加表名
      const recordId = idStr.includes(':') ? idStr : `${this.table}:${idStr}`;

      const updateData = Object.entries(data)
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join(', ');

      const query = `UPDATE ${recordId} SET ${updateData} RETURN AFTER`;
      const result = await this.db.query<unknown[]>(query);

      const firstResult = result[0];
      if (firstResult && typeof firstResult === 'object') {
        if ('result' in firstResult) {
          const records = (firstResult.result as unknown[]) || [];
          if (records.length === 0) {
            throw new Error(`更新记录失败：记录 ${recordId} 不存在`);
          }
          return this.formatRecord(records[0]);
        }
        if (Array.isArray(firstResult)) {
          if (firstResult.length === 0) {
            throw new Error(`更新记录失败：记录 ${recordId} 不存在`);
          }
          return this.formatRecord(firstResult[0]);
        }
      }

      throw new Error(`更新记录失败：记录 ${recordId} 不存在`);
    } catch (error) {
      console.error(`更新 ${this.table}:${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 批量更新记录
   */
  async updateMany(ids: string[], data: Partial<T>): Promise<T[]> {
    try {
      const results = await Promise.all(ids.map((id) => this.update(id, data)));
      return results;
    } catch (error) {
      console.error(`批量更新 ${this.table} 记录失败:`, error);
      throw error;
    }
  }

  /**
   * 根据条件更新记录
   */
  async updateBy(conditions: Partial<T> | QueryCondition[], data: Partial<T>): Promise<T[]> {
    try {
      const whereClause = this.buildWhereClause(conditions);
      const updateData = Object.entries(data)
        .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
        .join(', ');
      const query = `UPDATE ${this.table} SET ${updateData} WHERE ${whereClause} RETURN AFTER`;
      const result = await this.db.query<unknown[]>(query);
      const firstResult = result[0];
      if (firstResult && typeof firstResult === 'object') {
        if ('result' in firstResult) {
          const records = (firstResult.result as unknown[]) || [];
          return records.map((r) => this.formatRecord(r));
        }
        if (Array.isArray(firstResult)) {
          return firstResult.map((r) => this.formatRecord(r));
        }
      }
      return [];
    } catch (error) {
      console.error(`条件更新 ${this.table} 记录失败:`, error);
      throw error;
    }
  }

  /**
   * 更新或创建记录（upsert）
   */
  async upsert(id: string, data: Partial<T>): Promise<T> {
    try {
      const existing = await this.findById(id);
      if (existing) {
        return await this.update(id, data);
      } else {
        return await this.add({ ...data } as T);
      }
    } catch (error) {
      console.error(`Upsert ${this.table}:${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 删除记录
   */
  async delete(id: string): Promise<boolean> {
    try {
      if (!id) {
        console.error(`无效的 ID: ${id}`);
        return false;
      }
      // 确保 ID 是字符串类型
      const idStr = String(id);
      // 如果 ID 已经包含表名（格式为 table:id），直接使用；否则添加表名
      const recordId = idStr.includes(':') ? idStr : `${this.table}:${idStr}`;

      // 使用 db.query 执行 DELETE 以获得更可靠的行为
      const query = `DELETE ${recordId}`;
      await this.db.query(query);
      return true;
    } catch (error) {
      console.error(`删除 ${this.table}:${id} 失败:`, error);
      return false;
    }
  }

  /**
   * 删除表中所有数据
   */
  async deleteAll(): Promise<boolean> {
    try {
      const query = `DELETE FROM ${this.table}`;
      await this.db.query(query);
      return true;
    } catch (error) {
      console.error(`删除所有 ${this.table} 记录失败:`, error);
      return false;
    }
  }

  /**
   * 批量删除记录
   */
  async deleteMany(ids: string[]): Promise<boolean> {
    try {
      await Promise.all(ids.map((id) => this.delete(id)));
      return true;
    } catch (error) {
      console.error(`批量删除 ${this.table} 失败:`, error);
      return false;
    }
  }

  /**
   * 根据条件删除记录
   */
  async deleteBy(conditions: Partial<T> | QueryCondition[]): Promise<number> {
    try {
      const whereClause = this.buildWhereClause(conditions);
      const query = `DELETE FROM ${this.table} WHERE ${whereClause} RETURN BEFORE`;
      const result = await this.db.query<unknown[]>(query);
      const firstResult = result[0];
      if (
        firstResult &&
        typeof firstResult === 'object' &&
        firstResult !== null &&
        'result' in firstResult
      ) {
        const deleted = firstResult.result as T[];
        return deleted ? deleted.length : 0;
      }
      return 0;
    } catch (error) {
      console.error(`条件删除 ${this.table} 记录失败:`, error);
      throw error;
    }
  }

  /**
   * 执行自定义查询
   */
  async query<R = T[]>(queryStr: string, vars?: Record<string, unknown>): Promise<R> {
    try {
      const result = vars
        ? await this.db.query<unknown[]>(queryStr, vars)
        : await this.db.query<unknown[]>(queryStr);

      const firstResult = result[0];
      if (firstResult && typeof firstResult === 'object') {
        if ('result' in firstResult) {
          return firstResult.result as R;
        }
        if ('status' in firstResult && (firstResult as { status: string }).status === 'ERR') {
          const errRes = firstResult as { detail?: string; message?: string };
          console.error(`SurrealDB Query Error: ${errRes.detail || errRes.message}`);
          return [] as unknown as R;
        }
        if (Array.isArray(firstResult)) {
          return firstResult as unknown as R;
        }
      }
      return result as unknown as R;
    } catch (error) {
      console.error(`执行查询失败:`, error);
      throw error;
    }
  }

  /**
   * 统计记录数量
   */
  async count(conditions?: Partial<T> | QueryCondition[]): Promise<number> {
    try {
      let query: string;
      if (conditions) {
        const whereClause = this.buildWhereClause(conditions);
        query = `SELECT count() FROM ${this.table} WHERE ${whereClause} GROUP ALL`;
      } else {
        query = `SELECT count() FROM ${this.table} GROUP ALL`;
      }
      const result = await this.db.query<unknown[]>(query);
      const firstResult = result[0];
      if (firstResult && typeof firstResult === 'object') {
        let data: unknown[] = [];
        if ('result' in firstResult) {
          data = (firstResult.result as unknown[]) || [];
        } else if (Array.isArray(firstResult)) {
          data = firstResult;
        }

        if (
          data.length > 0 &&
          data[0] !== null &&
          typeof data[0] === 'object' &&
          'count' in data[0]
        ) {
          return (data[0] as { count: number }).count || 0;
        }
      }
      return 0;
    } catch (error) {
      console.error(`统计 ${this.table} 记录数量失败:`, error);
      throw error;
    }
  }

  /**
   * 分页查询
   */
  async paginate(
    page: number = 1,
    pageSize: number = 10,
    conditions?: Partial<T> | QueryCondition[],
    orderBy?: { field: string; direction?: 'ASC' | 'DESC' },
  ): Promise<PaginateResult<T>> {
    try {
      const offset = (page - 1) * pageSize;
      let query = `SELECT * FROM ${this.table}`;

      if (conditions) {
        const whereClause = this.buildWhereClause(conditions);
        query += ` WHERE ${whereClause}`;
      }

      if (orderBy) {
        const direction = orderBy.direction || 'ASC';
        query += ` ORDER BY ${orderBy.field} ${direction}`;
      }

      query += ` LIMIT ${pageSize} START ${offset}`;

      const [dataResult, countResult] = await Promise.all([
        this.db.query<unknown[]>(query),
        this.count(conditions),
      ]);

      const firstResult = dataResult[0];
      let data: T[] = [];
      if (firstResult && typeof firstResult === 'object') {
        if ('result' in firstResult) {
          data = (firstResult.result as T[]) || [];
        } else if (Array.isArray(firstResult)) {
          data = firstResult as T[];
        }
      } else if (Array.isArray(dataResult)) {
        data = dataResult as T[];
      }

      const totalPages = Math.ceil(countResult / pageSize);

      return {
        data,
        total: countResult,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error(`分页查询 ${this.table} 失败:`, error);
      throw error;
    }
  }
}

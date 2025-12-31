import { SurrealService } from './db/surreal';

/**
 * 基础模型类，实现 Active Record 模式
 */
export abstract class BaseModel<T extends { id?: string }> {
  // 每个子类必须定义对应的表名
  protected abstract get _table(): string;

  // 统一的 ID 属性，符合 SurrealDB 规范
  public id?: string;

  // 维护一个内部 service 实例
  private _service: SurrealService<T> | null = null;

  protected get service(): SurrealService<T> {
    if (!this._service) {
      this._service = new SurrealService<T>(this._table);
    }
    return this._service;
  }

  /**
   * 获取不带前缀的短 ID（例如从 "user:123" 获取 "123"）
   */
  public get shortId(): string | undefined {
    if (!this.id) return undefined;
    return this.id.includes(':') ? this.id.split(':')[1] : this.id;
  }

  /**
   * 将当前实例保存（插入）到数据库
   */
  async add(): Promise<this> {
    // 排除私有属性和方法
    const data = this.toJSON();
    const result = await this.service.add(data as unknown as T);

    // 将结果回填到当前对象（例如回填生成的 ID）
    Object.assign(this, result);
    return this;
  }

  /**
   * 更新当前实例到数据库
   */
  async update(): Promise<this> {
    if (!this.id) {
      throw new Error('无法更新没有 ID 的记录');
    }
    const data = this.toJSON();
    const result = await this.service.update(this.id, data);
    Object.assign(this, result);
    return this;
  }

  /**
   * 从数据库中删除当前实例
   */
  async delete(): Promise<boolean> {
    if (!this.id) return false;
    return await this.service.delete(this.id);
  }

  /**
   * 排除下划线开头的私有属性和方法，转换为纯 JS 对象
   */
  toJSON(): Partial<T> {
    const obj: Record<string, unknown> = {};
    const self = this as unknown as Record<string, unknown>;

    Object.keys(this).forEach((key) => {
      // 这里的逻辑：保留 id 和正常数据属性，排除方法和下划线开头的内部属性
      if ((key === 'id' || !key.startsWith('_')) && typeof self[key] !== 'function') {
        obj[key] = self[key];
      }
    });
    return obj as Partial<T>;
  }
}

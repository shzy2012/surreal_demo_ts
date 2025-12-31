import { BaseModel } from './BaseModel';

/**
 * User 模型类，支持 Active Record 模式
 */
export class User extends BaseModel<User> {
  name: string = '';
  email: string = '';
  age: number = 0;
  createdAt?: string;

  protected get _table(): string {
    return 'user';
  }

  /**
   * 静态查询接口，用于处理集合操作（如 findAll, paginate）
   */
  static get query() {
    return new User().service;
  }

  constructor(data?: Partial<User>) {
    super();
    if (data) {
      Object.assign(this, data);
    }
  }
}

export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  age: number;
  createdAt?: string;
}

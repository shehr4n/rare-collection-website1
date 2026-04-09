declare module "better-sqlite3" {
  type BindParameters = unknown[] | Record<string, unknown>;

  interface Statement {
    run(...params: BindParameters extends infer P ? (P extends unknown[] ? P : [P]) : never): {
      lastInsertRowid: number | bigint;
      changes: number;
    };
    get<T = unknown>(...params: BindParameters extends infer P ? (P extends unknown[] ? P : [P]) : never): T;
    all<T = unknown>(...params: BindParameters extends infer P ? (P extends unknown[] ? P : [P]) : never): T[];
  }

  class Database {
    constructor(filename?: string, options?: Record<string, unknown>);
    pragma(source: string): void;
    exec(source: string): void;
    prepare(source: string): Statement;
  }

  export default Database;
}

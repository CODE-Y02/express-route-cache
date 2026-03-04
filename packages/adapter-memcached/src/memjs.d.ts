declare module "memjs" {
  export interface ClientOptions {
    retries?: number;
    retry_delay?: number;
    expires?: number;
    logger?: { log: (...args: unknown[]) => void };
    failover?: boolean;
    failoverTime?: number;
    username?: string;
    password?: string;
  }

  export interface GetResult {
    value: Buffer | null;
    flags: Buffer | null;
  }

  export interface IncrResult {
    value: number | null;
    success: boolean;
  }

  export class Client {
    static create(servers?: string, options?: ClientOptions): Client;
    get(key: string): Promise<GetResult>;
    set(key: string, value: string, options?: { expires?: number }): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    increment(
      key: string,
      amount: number,
      options?: { initial?: number; expires?: number }
    ): Promise<IncrResult>;
    close(): void;
  }

  const memjs: {
    Client: typeof Client;
    ClientOptions: ClientOptions;
  };

  export default memjs;
}

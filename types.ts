export interface CacheNamespace {
  get: <T>(key: string, config?: any) => Promise<T>;
  put: (key: string, value: any, config?: any) => Promise<void>;
}

export type Env = { cache: CacheNamespace; MASTER_SECRET: string };

export type CacheType = {
  content: string;
  ext: string;
  promptTokens?: number;
  completionTokens?: number;
};

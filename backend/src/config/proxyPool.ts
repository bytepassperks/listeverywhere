import { env } from './env';

export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks5';
}

let proxyIndex = 0;
let proxies: ProxyConfig[] = [];

export async function loadProxies(): Promise<void> {
  if (!env.PROXY_POOL_URL) {
    proxies = [];
    return;
  }

  try {
    const response = await fetch(env.PROXY_POOL_URL);
    const data = await response.json() as ProxyConfig[];
    proxies = data;
  } catch {
    proxies = [];
  }
}

export function getNextProxy(): ProxyConfig | null {
  if (proxies.length === 0) return null;
  const proxy = proxies[proxyIndex % proxies.length];
  proxyIndex++;
  return proxy;
}

export function getProxyUrl(proxy: ProxyConfig): string {
  const auth = proxy.username && proxy.password
    ? `${proxy.username}:${proxy.password}@`
    : '';
  return `${proxy.protocol}://${auth}${proxy.host}:${proxy.port}`;
}

export function isProxyEnabled(): boolean {
  return proxies.length > 0;
}

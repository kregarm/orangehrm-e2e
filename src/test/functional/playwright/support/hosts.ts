/**
 * The dev environment's nginx routes by host name (php80 -> PHP 8.0), which
 * normally needs an /etc/hosts entry. E2E_LOCAL_HOSTS (comma separated) maps
 * the given names to 127.0.0.1 for both Chromium and Node-side requests
 * (APIRequestContext), so bin/run-e2e works without editing /etc/hosts.
 */
import dns, {type LookupAddress, type LookupOptions} from 'node:dns';

type Options = number | LookupOptions | undefined;
type Callback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

const localHosts = (process.env.E2E_LOCAL_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

if (localHosts.length > 0) {
  const isLocal = (hostname: string) => localHosts.includes(hostname);
  // Published container ports are reliably reachable over IPv4 only, so IPv6
  // lookups (Playwright resolves both families) get no addresses.
  const answer = (options: Options) => {
    const family = typeof options === 'number' ? options : options?.family;
    const address: LookupAddress = {address: '127.0.0.1', family: 4};
    if (typeof options === 'number' || !options?.all) return address;
    return family === 6 ? [] : [address];
  };

  const lookup = dns.lookup;
  dns.lookup = ((
    hostname: string,
    options: Options | Callback,
    callback: Callback,
  ) => {
    if (!isLocal(hostname)) {
      return (lookup as (...args: unknown[]) => void)(
        hostname,
        options,
        callback,
      );
    }
    if (typeof options === 'function') [callback, options] = [options, {}];
    const result = answer(options);
    process.nextTick(() =>
      Array.isArray(result)
        ? callback(null, result)
        : callback(null, result.address, result.family),
    );
  }) as typeof dns.lookup;

  const lookupAsync = dns.promises.lookup;
  dns.promises.lookup = (async (hostname: string, options?: Options) =>
    isLocal(hostname)
      ? answer(options)
      : (lookupAsync as (...args: unknown[]) => Promise<unknown>)(
          hostname,
          options,
        )) as typeof dns.promises.lookup;
}

export const chromiumArgs = localHosts.length
  ? [
      `--host-resolver-rules=${localHosts
        .map((host) => `MAP ${host} 127.0.0.1`)
        .join(', ')}`,
    ]
  : [];

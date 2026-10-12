/**
 * OrangeHRM is a comprehensive Human Resource Management (HRM) System that captures
 * all the essential functionalities required for any enterprise.
 * Copyright (C) 2006 OrangeHRM Inc., http://www.orangehrm.com
 *
 * OrangeHRM is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * OrangeHRM is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with OrangeHRM.
 * If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * The dev environment's nginx routes by host name (php80 -> PHP 8.0), which
 * normally needs an /etc/hosts entry. E2E_LOCAL_HOSTS (comma separated) maps
 * the given names to 127.0.0.1 for both Chromium and Node-side requests
 * (APIRequestContext), so bin/run-e2e works without editing /etc/hosts.
 */
const dns = require('node:dns');

const localHosts = (process.env.E2E_LOCAL_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

if (localHosts.length > 0 && !dns.__e2eLocalHosts) {
  dns.__e2eLocalHosts = true;
  const isLocal = (hostname) => localHosts.includes(hostname);
  // Published container ports are reliably reachable over IPv4 only, so IPv6
  // lookups (Playwright resolves both families) get no addresses.
  const answer = (options) => {
    const family = typeof options === 'number' ? options : options?.family;
    const address = {address: '127.0.0.1', family: 4};
    if (!options?.all) return address;
    return family === 6 ? [] : [address];
  };

  const lookup = dns.lookup;
  dns.lookup = (hostname, options, callback) => {
    if (!isLocal(hostname)) return lookup(hostname, options, callback);
    if (typeof options === 'function') [callback, options] = [options, {}];
    const result = answer(options);
    process.nextTick(() =>
      options?.all
        ? callback(null, result)
        : callback(null, result.address, result.family),
    );
  };

  const lookupAsync = dns.promises.lookup;
  dns.promises.lookup = async (hostname, options) =>
    isLocal(hostname) ? answer(options) : lookupAsync(hostname, options);
}

module.exports = {
  chromiumArgs: localHosts.length
    ? [
        `--host-resolver-rules=${localHosts
          .map((host) => `MAP ${host} 127.0.0.1`)
          .join(', ')}`,
      ]
    : [],
};

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

import type {
  APIRequest,
  APIRequestContext,
  APIResponse,
} from '@playwright/test';
import {users, type UserKey} from '../data/users';

export type Credentials = {username: string; password: string};
/** A key of `users` (data/users), a User, or any other credentials */
export type UserRef = UserKey | Credentials;

/** Options of APIRequestContext.fetch that ApiSession.request accepts */
export type RequestOptions = {
  method?: string;
  url: string;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
};

/** Envelope of every /api/v2 response */
export type ApiResponse<T, M = Record<string, unknown>> = {
  data: T;
  meta: M;
  rels: unknown[];
};

/**
 * Thrown for any non-2xx response. `invalidParams` lists the offending keys
 * of a 422 so assertions can target them directly.
 */
export class ApiError extends Error {
  constructor(
    readonly method: string,
    readonly url: string,
    readonly status: number | undefined,
    readonly body: unknown,
    readonly user: string | undefined,
    cause?: unknown,
  ) {
    super(
      `${method} ${url} as ${user ?? '<anonymous>'} failed` +
        (status ? ` with HTTP ${status}` : '') +
        `: ${ApiError.describe(body, cause)}`,
      {cause},
    );
    this.name = 'ApiError';
  }

  get invalidParams(): string[] {
    const error = (
      this.body as {error?: {data?: {invalidParamKeys?: string[]}}}
    )?.error;
    return error?.data?.invalidParamKeys ?? [];
  }

  private static describe(body: unknown, cause: unknown): string {
    if (body && typeof body === 'object') return JSON.stringify(body);
    if (typeof body === 'string' && body) return body.slice(0, 500);
    return cause instanceof Error ? cause.message : String(cause);
  }
}

const resolveCredentials = (user: UserRef): Credentials =>
  typeof user === 'string' ? users[user] : user;

const ANONYMOUS = Symbol('anonymous');

/**
 * Auth state shared by every API class built on it, so switching user on one
 * switches it for all of them.
 *
 * Each user gets its own Playwright APIRequestContext (and so its own cookie
 * jar), so switching back and forth only logs in once per user.
 */
export class ApiSession {
  private readonly contexts = new Map<
    string | typeof ANONYMOUS,
    APIRequestContext
  >();

  private current?: Credentials;

  /**
   * @param request `playwright.request` from a fixture
   * @param baseURL the app's index.php URL with a trailing slash, as in
   *   playwright.config.ts
   */
  constructor(
    private readonly apiRequest: APIRequest,
    private readonly baseURL: string,
  ) {}

  get user(): string | undefined {
    return this.current?.username;
  }

  /** Authenticate as `user` (reusing an existing session) and make it current */
  async loginAs(user: UserRef, {force = false} = {}): Promise<void> {
    const credentials = resolveCredentials(user);
    if (force || !this.contexts.has(credentials.username)) {
      await this.authenticate(credentials);
    }
    this.current = credentials;
  }

  /** Run `fn` as `user`, then switch back to the previous user */
  async asUser<T>(user: UserRef, fn: () => Promise<T>): Promise<T> {
    const previous = this.current;
    await this.loginAs(user);
    try {
      return await fn();
    } finally {
      this.current = previous;
    }
  }

  /**
   * Cookies of `user`'s session, to skip the UI login in a browser context:
   * `browser.newContext({storageState: await api.session.storageState('admin')})`
   */
  async storageState(user: UserRef) {
    const {username} = resolveCredentials(user);
    await this.asUser(user, async () => undefined);
    return this.contexts.get(username)!.storageState();
  }

  /** Dispose all sessions; the next request is anonymous until loginAs */
  async logout(): Promise<void> {
    const contexts = [...this.contexts.values()];
    this.contexts.clear();
    this.current = undefined;
    await Promise.all(contexts.map((context) => context.dispose()));
  }

  /**
   * Send a request as the current user and return the parsed JSON body. A
   * 401 (expired or lost session) triggers one re-login and retry.
   */
  async request<T>(options: RequestOptions): Promise<T> {
    try {
      return await this.send<T>(options);
    } catch (error) {
      if (this.current && error instanceof ApiError && error.status === 401) {
        await this.authenticate(this.current);
        return this.send<T>(options);
      }
      throw error;
    }
  }

  private async authenticate(credentials: Credentials): Promise<void> {
    // A fresh context has no cookies, so the server issues a new session.
    await this.contexts.get(credentials.username)?.dispose();
    this.contexts.delete(credentials.username);
    const context = await this.context(credentials.username);
    const {success} = await this.send<{success: boolean}>(
      {
        method: 'POST',
        url: 'functional-testing/auth/validate',
        data: credentials,
      },
      credentials.username,
    );
    if (!success) {
      this.contexts.delete(credentials.username);
      await context.dispose();
      throw new Error(`Login failed for user "${credentials.username}"`);
    }
  }

  private async context(username?: string): Promise<APIRequestContext> {
    const key = username ?? ANONYMOUS;
    let context = this.contexts.get(key);
    if (!context) {
      context = await this.apiRequest.newContext({
        baseURL: this.baseURL,
        extraHTTPHeaders: {Accept: 'application/json'},
      });
      this.contexts.set(key, context);
    }
    return context;
  }

  private async send<T>(
    {method = 'GET', url, params, data}: RequestOptions,
    username = this.current?.username,
  ): Promise<T> {
    const context = await this.context(username);
    method = method.toUpperCase();

    let response: APIResponse;
    try {
      response = await context.fetch(url, {
        method,
        params,
        data,
        // An unauthenticated page request redirects to the login page;
        // surface that as an error instead of following it to HTML.
        maxRedirects: 0,
      });
    } catch (error) {
      throw new ApiError(method, url, undefined, undefined, username, error);
    }

    const text = await response.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      // Not JSON (e.g. an nginx error page); keep the raw text.
    }
    if (!response.ok()) {
      throw new ApiError(method, url, response.status(), body, username);
    }
    return body as T;
  }
}

/**
 * Base for resource API classes (e.g. CandidatesApiClass). Subclasses pass
 * an `ApiSession`; reuse one session across classes to share the current
 * user.
 */
export class BaseApiClass {
  constructor(protected readonly session: ApiSession) {}

  get user(): string | undefined {
    return this.session.user;
  }

  loginAs(user: UserRef, options?: {force?: boolean}): Promise<void> {
    return this.session.loginAs(user, options);
  }

  asUser<T>(user: UserRef, fn: () => Promise<T>): Promise<T> {
    return this.session.asUser(user, fn);
  }

  protected get<T>(url: string, params?: RequestOptions['params']) {
    return this.session.request<T>({method: 'GET', url, params});
  }

  protected post<T>(url: string, data?: unknown) {
    return this.session.request<T>({method: 'POST', url, data});
  }

  protected put<T>(url: string, data?: unknown) {
    return this.session.request<T>({method: 'PUT', url, data});
  }

  protected delete<T>(url: string, data?: unknown) {
    return this.session.request<T>({method: 'DELETE', url, data});
  }
}

/** Drop keys whose value is undefined so they are not sent at all */
export const compact = <T extends Record<string, unknown>>(body: T) =>
  Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

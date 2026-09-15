import type { RequestTypeConfig } from "./request-config.mjs";
export type RequestSettingsSnapshot = {
  configs: RequestTypeConfig[];
  expectedValue: string | null;
  exists: boolean;
};
export type RequestSettingsRpc = (
  name: string, args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: unknown }>;
export class RequestSettingsError extends Error {
  code: string;
  constructor(code: string, message: string);
}
export function parseRequestSettingsSnapshot(input: unknown): RequestSettingsSnapshot;
export function loadRequestTypeSettings(rpc: RequestSettingsRpc): Promise<RequestSettingsSnapshot>;
export function saveRequestTypeSettings(rpc: RequestSettingsRpc, configs: readonly RequestTypeConfig[], expectedValue: string | null): Promise<RequestSettingsSnapshot>;

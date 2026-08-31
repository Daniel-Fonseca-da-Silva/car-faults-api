export const X_CLIENT_HEADER = 'x-client';
export const MOBILE_CLIENT_VALUE = 'mobile';

export type ClientType = 'mobile' | 'web';

export function resolveClientType(headerValue?: string): ClientType {
  return headerValue?.trim().toLowerCase() === MOBILE_CLIENT_VALUE
    ? 'mobile'
    : 'web';
}

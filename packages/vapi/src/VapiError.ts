/**
 * Typed error for VAPI-specific failure modes.
 * Consumers should use `instanceof VapiError` instead of matching `.message` strings.
 */
export type VapiErrorCode = 'VAPI_SDK_NOT_AVAILABLE' | 'VAPI_NOT_CONFIGURED';

export class VapiError extends Error {
  readonly code: VapiErrorCode;

  constructor(code: VapiErrorCode) {
    super(code);
    this.name = 'VapiError';
    this.code = code;
  }
}

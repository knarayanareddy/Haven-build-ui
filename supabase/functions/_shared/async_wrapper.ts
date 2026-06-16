import { corsHeaders, json, recordMetric, safeErrorMessage } from "./core.ts";
import { captureException } from "./sentry.ts";

export interface ErrorResponse {
  ok: false;
  error_code: string;
  message?: string;
}

export function asyncWrapper(
  functionName: string,
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
    const started = Date.now();

    try {
      const response = await handler(req);
      await recordMetric(functionName, started, "success").catch(() => undefined);
      return response;
    } catch (error) {
      const errorString = safeErrorMessage(error);
      let errorCode = (error as { error_code?: string }).error_code ?? "SYSTEM_ERROR";
      let statusCode = (error as { status?: number }).status ?? 500;

      if (errorString.includes("400") || errorString.includes("Malformed") || errorString.includes("Fields")) {
        errorCode = "BAD_REQUEST";
        statusCode = 400;
      }
      if (errorString.includes("403") || errorString.includes("Unauthorized") || errorString.includes("Prohibited") || errorString.includes("not allowed")) {
        errorCode = "FORBIDDEN";
        statusCode = 403;
      }
      if (errorString.includes("422")) {
        errorCode = "UNPROCESSABLE_ENTITY";
        statusCode = 422;
      }
      if (errorString.includes("429")) {
        errorCode = "TOO_MANY_REQUESTS";
        statusCode = 429;
      }

      const errorResponseBody: ErrorResponse = {
        ok: false,
        error_code: errorCode,
        message: errorString,
      };

      // Awaits telemetry capture/flush with a bounded timeout
      const telemetryFlush = async () => {
        await captureException(error, { fn: functionName, error_code: errorCode }).catch(() => undefined);
        await recordMetric(functionName, started, "error").catch(() => undefined);
      };

      await Promise.race([
        telemetryFlush(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Telemetry capture timeout")), 1500)),
      ]).catch(() => undefined); // Fully guarantees no unhandled promise rejections

      const customHeaders: Record<string, string> = {};
      const retryAfter = (error as { retryAfterSeconds?: number }).retryAfterSeconds;
      if (retryAfter) {
        customHeaders["Retry-After"] = String(retryAfter);
      }

      return json(errorResponseBody, statusCode, req, customHeaders);
    }
  };
}

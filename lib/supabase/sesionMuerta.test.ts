import { describe, it, expect } from "vitest";
import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError } from "@supabase/supabase-js";
import { sesionMuerta } from "@/lib/supabase/client";

describe("sesionMuerta: solo se recrea la sesión si GoTrue la rechaza", () => {
  it("401/403 o sesión inexistente → muerta", () => {
    expect(sesionMuerta(new AuthApiError("jwt expired", 401, "bad_jwt"))).toBe(true);
    expect(sesionMuerta(new AuthApiError("forbidden", 403, undefined))).toBe(true);
    expect(sesionMuerta(new AuthSessionMissingError())).toBe(true);
  });
  it("falla de red o 5xx → NO muerta (no cambiar el uid)", () => {
    expect(sesionMuerta(new AuthRetryableFetchError("Failed to fetch", 0))).toBe(false);
    expect(sesionMuerta(new AuthApiError("server error", 500, undefined))).toBe(false);
    expect(sesionMuerta(new Error("network"))).toBe(false);
  });
});

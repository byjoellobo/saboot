// Optional RFC 3161 trusted timestamp for a generated PDF.
//
// This is the only feature that uses the network. Only a hash of the PDF is
// sent to the Time Stamping Authority (TSA); the PDF itself never leaves the
// device. Most TSAs do not allow browser requests (no CORS); the default below
// is one that does. The library is loaded only when the user asks for it.
import { sha256Hex } from "../../engine/util/crypto";

export const DEFAULT_TSA_URL = "https://rfc3161.ai.moda/tsa";

export interface TimestampOutcome {
  readonly bytes: Uint8Array;
  readonly sha256: string;
  readonly tsaTime: Date;
  readonly tsaUrl: string;
}

export async function timestampPdf(pdf: Uint8Array, tsaUrl: string = DEFAULT_TSA_URL): Promise<TimestampOutcome> {
  if (!navigator.onLine) throw new Error("You are offline. A timestamp needs a short internet connection.");
  const { timestampPdf: stamp } = await import("pdf-rfc3161");
  try {
    const result = await stamp({
      pdf,
      tsa: { url: tsaUrl, hashAlgorithm: "SHA-256", timeout: 30_000, retry: 1 },
      reason: "RFC 3161 document timestamp",
      enableLTV: false,
    });
    return { bytes: result.pdf, sha256: await sha256Hex(result.pdf), tsaTime: result.timestamp.genTime, tsaUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `The timestamp service did not respond (${message}). Your PDF is unchanged. Try again later, or skip this optional step.`,
    );
  }
}

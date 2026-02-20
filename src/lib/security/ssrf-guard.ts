/**
 * SSRF Guard — Validates URLs before server-side fetching.
 *
 * Prevents Server-Side Request Forgery by blocking:
 * - Private/internal IP ranges (127.x, 10.x, 172.16-31.x, 192.168.x, 169.254.x)
 * - Loopback and localhost
 * - IPv6 loopback (::1)
 * - Non-HTTP(S) schemes
 * - .local and .internal domains
 */

import { lookup } from "dns/promises";

const BLOCKED_HOSTNAMES = [
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "[::1]",
  "metadata.google.internal",
  "169.254.169.254", // AWS/GCP metadata
];

const BLOCKED_DOMAIN_SUFFIXES = [
  ".local",
  ".internal",
  ".localhost",
];

function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (ip === "0.0.0.0") return true;

  // 172.16.0.0 - 172.31.255.255
  if (ip.startsWith("172.")) {
    const second = parseInt(ip.split(".")[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  // IPv6 loopback
  if (ip === "::1" || ip === "[::1]") return true;

  // IPv6 private (fc00::/7, fe80::/10)
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }

  return false;
}

/**
 * Validates a URL is safe for server-side fetching.
 * Throws an error if the URL targets a private/internal resource.
 */
export async function validateUrlForFetch(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  // Only allow HTTP(S)
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(
      `Blocked scheme "${parsed.protocol}" — only http: and https: are allowed`
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new Error(`Blocked hostname: ${hostname}`);
  }

  // Check blocked domain suffixes
  for (const suffix of BLOCKED_DOMAIN_SUFFIXES) {
    if (hostname.endsWith(suffix)) {
      throw new Error(`Blocked domain suffix: ${hostname}`);
    }
  }

  // Check if hostname is already an IP
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new Error(`Blocked private IP: ${hostname}`);
    }
    return;
  }

  // Resolve DNS and check resolved IP
  try {
    const result = await lookup(hostname);
    if (isPrivateIP(result.address)) {
      throw new Error(
        `DNS for "${hostname}" resolved to private IP ${result.address} — blocked`
      );
    }
  } catch (err) {
    // If it's our own error, re-throw
    if (err instanceof Error && err.message.includes("blocked")) {
      throw err;
    }
    // DNS resolution failures are allowed through (the fetch itself will fail)
  }
}

"use client";

import { useEffect, useState } from "react";

import { authenticatedFetch } from "@/lib/api-auth";

export default function AuthTestPage() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testAuth() {
      try {
        const response = await authenticatedFetch(
          "/api/auth/me",
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || "Authentication test failed",
          );
        }

        setResult(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Authentication test failed",
        );
      } finally {
        setLoading(false);
      }
    }

    testAuth();
  }, []);

  return (
    <div className="min-h-screen bg-[#181b18] text-[#ececec] p-8">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-2xl font-semibold mb-2">
          Authentication Test
        </h1>

        <p className="text-[#858a83] mb-8">
          Testing Supabase → FastAPI authentication.
        </p>

        {loading && (
          <div className="text-[#858a83]">
            Testing authentication...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-[#7c443b] bg-[#3a211e] p-4 text-[#f2a092]">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-[#2a2d29] bg-[#20241f] p-5">
            <h2 className="text-sm text-[#858a83] mb-3">
              FastAPI Response
            </h2>

            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
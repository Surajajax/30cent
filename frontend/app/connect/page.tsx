"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function ConnectPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLinkToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://127.0.0.1:8000/api/plaid/create-link-token",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create link token");
      }

      setLinkToken(data.link_token);
    } catch (err) {
      console.error(err);

      setError("Unable to connect to Plaid.");
    } finally {
      setLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,

    onSuccess: async (publicToken, metadata) => {
      console.log("Plaid connected:", metadata);

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/plaid/exchange-public-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              public_token: publicToken,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Token exchange failed");
        }

        console.log("Plaid token exchange successful:", data);

        setConnected(true);
        setLinkToken(null);
      } catch (err) {
        console.error(err);

        setError("Bank connected, but token exchange failed.");
      }
    },

    onExit: (error, metadata) => {
      console.log("Plaid Link closed");
      console.log("Error:", error);
      console.log("Metadata:", metadata);
    },
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return (
    <div className="px-6 py-8 text-[#ececec]">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold mb-3">
          Connect
        </h1>

        <p className="text-slate-300 max-w-2xl mb-8">
          Connect your accounts, banks, and services to power
          your financial insights.
        </p>

        <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-medium mb-2">
            Connect a bank account
          </h2>

          <p className="text-sm text-slate-400 mb-6">
            Securely connect your account using Plaid.
            This demo uses the Plaid Sandbox environment.
          </p>

          {connected ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
              <p className="font-medium text-green-400">
                Bank connected successfully
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Your Sandbox account is now connected to 30cent.
              </p>
            </div>
          ) : (
            <button
              onClick={createLinkToken}
              disabled={loading || (!!linkToken && !ready)}
              className="rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Connecting..."
                : linkToken && !ready
                  ? "Loading..."
                  : "Connect Bank"}
            </button>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

type Account = {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    iso_currency_code: string | null;
  };
};

type PlaidLinkFlowProps = {
  linkToken: string | null;
  onSuccess: (publicToken: string) => void;
  onExit: () => void;
};

function PlaidLinkFlow({
  linkToken,
  onSuccess,
  onExit,
}: PlaidLinkFlowProps) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken) => {
      if (publicToken) {
        onSuccess(publicToken);
      }
    },
    onExit,
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  return null;
}

export default function ConnectPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [connected, setConnected] = useState(false);

  const [startingLink, setStartingLink] = useState(false);

  const [disconnecting, setDisconnecting] = useState(false);

  const [loading, setLoading] = useState(false);

  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [checkingConnection, setCheckingConnection] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // Fetch existing accounts from backend
  // --------------------------------------------------

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      setError(null);

      const response = await fetch(
        "http://127.0.0.1:8000/api/plaid/accounts"
      );

      const data = await response.json();

      // No bank connected
      if (response.status === 400) {
        setAccounts([]);
        setConnected(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to fetch accounts"
        );
      }

      // Existing accounts found
      setAccounts(data.accounts);
      setConnected(data.accounts.length > 0);

    } catch (err) {
      console.error("Fetch accounts error:", err);

      setAccounts([]);
      setConnected(false);

      setError("Unable to load your accounts.");

    } finally {
      setLoadingAccounts(false);
      setCheckingConnection(false);
    }
  };

  // --------------------------------------------------
  // Create Plaid Link Token
  // --------------------------------------------------

  const createLinkToken = async () => {
    try {
      setStartingLink(true);
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
        throw new Error(
          data.detail || "Failed to create link token"
        );
      }

      setLinkToken(data.link_token);

    } catch (err) {
      console.error("Create link token error:", err);

      setError("Unable to connect to Plaid.");
      setStartingLink(false);

    } finally {
      setLoading(false);
    }
  };

  const exchangePublicToken = async (publicToken: string) => {
    try {
      setError(null);

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

      console.log("Token exchange successful:", data);
      setLinkToken(null);
      setStartingLink(false);
      await fetchAccounts();
    } catch (err) {
      console.error("Token exchange error:", err);
      setStartingLink(false);
      setError("Bank connected, but account retrieval failed.");
    }
  };

  const disconnectAccount = async () => {
    if (!window.confirm("Log out from this bank account?")) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);

      const response = await fetch(
        "http://127.0.0.1:8000/api/plaid/disconnect",
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to log out");
      }

      setAccounts([]);
      setConnected(false);
    } catch (err) {
      console.error("Disconnect account error:", err);
      setError("Unable to log out from this bank account.");
    } finally {
      setDisconnecting(false);
    }
  };

  // --------------------------------------------------
  // IMPORTANT:
  // Check database/backend every time this page opens
  // --------------------------------------------------

  useEffect(() => {
    void Promise.resolve().then(fetchAccounts);
  }, []);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="px-6 py-8 text-[#ececec]">
      <div className="mx-auto max-w-5xl">

        {startingLink && (
          <PlaidLinkFlow
            linkToken={linkToken}
            onSuccess={exchangePublicToken}
            onExit={() => {
              setLinkToken(null);
              setStartingLink(false);
            }}
          />
        )}

        {/* Header */}

        <h1 className="text-3xl font-semibold mb-3">
          Connect
        </h1>

        <p className="text-slate-300 max-w-2xl mb-8">
          Connect your accounts, banks, and services to
          power your financial insights.
        </p>

        {/* ------------------------------------------ */}
        {/* Checking existing connection */}
        {/* ------------------------------------------ */}

        {checkingConnection ? (

          <div className="py-10">
            <p className="text-slate-400">
              Checking your connected accounts...
            </p>
          </div>

        ) : !connected ? (

          /* ---------------------------------------- */
          /* No bank connected */
          /* ---------------------------------------- */

          <div className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">

            <h2 className="text-xl font-medium mb-2">
              Connect a bank account
            </h2>

            <p className="text-sm text-slate-400 mb-6">
              Securely connect your account using Plaid.
              This demo uses the Plaid Sandbox environment.
            </p>

            <button
              onClick={createLinkToken}
              disabled={
                loading ||
                startingLink
              }
              className="rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Connecting..."
                : startingLink
                ? "Loading..."
                : "Connect Bank"}
            </button>

            {error && (
              <p className="mt-4 text-sm text-red-400">
                {error}
              </p>
            )}

          </div>

        ) : (

          /* ---------------------------------------- */
          /* Connected accounts */
          /* ---------------------------------------- */

          <div>

            <div className="mb-6">

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Connected Accounts
                  </h2>

                  <p className="text-sm text-slate-400 mt-1">
                    Your accounts connected through Plaid
                    Sandbox.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={disconnectAccount}
                  disabled={disconnecting}
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {disconnecting ? "Logging out..." : "Log out"}
                </button>
              </div>

            </div>

            {loadingAccounts ? (

              <p className="text-slate-400">
                Loading accounts...
              </p>

            ) : (

              <div className="grid gap-4 md:grid-cols-2">

                {accounts.map((account) => (

                  <div
                    key={account.account_id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                  >

                    {/* Account Header */}

                    <div className="flex items-start justify-between">

                      <div>

                        <h3 className="text-lg font-medium">
                          {account.name}
                        </h3>

                        <p className="text-sm text-slate-400 mt-1">
                          {account.subtype}

                          {account.mask
                            ? ` •••• ${account.mask}`
                            : ""}
                        </p>

                      </div>

                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                        {account.type}
                      </span>

                    </div>

                    {/* Current Balance */}

                    <div className="mt-6">

                      <p className="text-sm text-slate-400">
                        Current Balance
                      </p>

                      <p className="text-2xl font-semibold mt-1">

                        {account.balances
                          .iso_currency_code || "USD"}

                        {" "}

                        {account.balances.current?.toLocaleString(
                          "en-US",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        ) ?? "0.00"}

                      </p>

                    </div>

                    {/* Available Balance */}

                    {account.balances.available !== null && (

                      <div className="mt-3">

                        <p className="text-sm text-slate-400">
                          Available
                        </p>

                        <p className="text-sm text-slate-200">

                          {account.balances
                            .iso_currency_code || "USD"}

                          {" "}

                          {account.balances.available.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}

                        </p>

                      </div>

                    )}

                  </div>

                ))}

              </div>

            )}

            {error && (

              <p className="mt-4 text-sm text-red-400">
                {error}
              </p>

            )}

          </div>

        )}

      </div>
    </div>
  );
}
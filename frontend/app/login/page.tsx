"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setMessage(
            "Account created. Check your email to confirm your account.",
          );
        } else {
          router.push("/");
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#181b18] text-[#f4f2ed] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-[#20241f] border border-[#2a2d29] rounded-2xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold">30cent</h1>

            <p className="text-[#858a83] mt-2">
              {isSignup
                ? "Create your account"
                : "Sign in to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-[#858a83] mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl bg-[#181b18] border border-[#2a2d29] px-4 py-3 outline-none focus:border-[#b7d67b]"
              />
            </div>

            <div>
              <label className="block text-sm text-[#858a83] mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full rounded-xl bg-[#181b18] border border-[#2a2d29] px-4 py-3 outline-none focus:border-[#b7d67b]"
              />
            </div>

            {message && (
              <div className="rounded-xl border border-[#7c443b] bg-[#3a211e] px-4 py-3 text-sm text-[#f2a092]">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#b7d67b] text-[#181b18] py-3 font-medium transition-opacity disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsSignup((value) => !value);
              setMessage("");
            }}
            className="w-full mt-5 text-sm text-[#858a83] hover:text-[#f4f2ed]"
          >
            {isSignup
              ? "Already have an account? Sign in"
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </main>
  );
}
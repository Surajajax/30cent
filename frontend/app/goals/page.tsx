"use client";

import { FormEvent, useEffect, useState } from "react";
import { getApiUrl, getBackendErrorMessage } from "@/lib/api";

type Goal = {
  id: number;
  name: string;
  description: string | null;
  current_amount: number;
  target_amount: number;
  target_date: string;
  status: string;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create goal modal
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const [creating, setCreating] = useState(false);

  // Contribution modal
  const [showContributionModal, setShowContributionModal] =
    useState(false);

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(
    null,
  );

  const [contributionAmount, setContributionAmount] =
    useState("");

  const [contributionNote, setContributionNote] =
    useState("");

  const [addingContribution, setAddingContribution] =
    useState(false);

  // ============================================================
  // FETCH GOALS
  // ============================================================

  async function fetchGoals() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        getApiUrl("/api/goals"),
      );

      if (!response.ok) {
        throw new Error("Failed to fetch goals.");
      }

      const result = await response.json();

      setGoals(result.data ?? []);
    } catch (error) {
      setError(
        getBackendErrorMessage(
          error,
          "Unable to load your goals.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGoals();
  }, []);

  // ============================================================
  // CREATE GOAL
  // ============================================================

  async function handleCreateGoal(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    if (
      !targetAmount ||
      Number(targetAmount) <= 0
    ) {
      return;
    }

    if (!targetDate) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      const response = await fetch(
        getApiUrl("/api/goals"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description:
              description.trim() || null,
            target_amount: Number(targetAmount),
            target_date: targetDate,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            "Failed to create goal.",
        );
      }

      setShowModal(false);

      setName("");
      setDescription("");
      setTargetAmount("");
      setTargetDate("");

      await fetchGoals();
    } catch (error) {
      setError(
        getBackendErrorMessage(
          error,
          "Unable to create goal.",
        ),
      );
    } finally {
      setCreating(false);
    }
  }

  // ============================================================
  // OPEN CONTRIBUTION MODAL
  // ============================================================

  function openContributionModal(goal: Goal) {
    setSelectedGoal(goal);
    setContributionAmount("");
    setContributionNote("");
    setError("");
    setShowContributionModal(true);
  }

  // ============================================================
  // ADD CONTRIBUTION
  // ============================================================

  async function handleAddContribution(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedGoal) {
      return;
    }

    const amount = Number(contributionAmount);

    if (!amount || amount <= 0) {
      setError("Enter a valid contribution amount.");
      return;
    }

    const remaining =
      selectedGoal.target_amount -
      selectedGoal.current_amount;

    if (amount > remaining) {
      setError(
        `You can add a maximum of $${remaining.toFixed(
          2,
        )} to this goal.`,
      );
      return;
    }

    try {
      setAddingContribution(true);
      setError("");

      const response = await fetch(
        getApiUrl(
          `/api/goals/${selectedGoal.id}/contributions`,
        ),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            note:
              contributionNote.trim() || null,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.detail ||
            "Failed to add contribution.",
        );
      }

      // Close contribution modal
      setShowContributionModal(false);

      // Reset contribution form
      setSelectedGoal(null);
      setContributionAmount("");
      setContributionNote("");

      // Reload goals from database
      await fetchGoals();
    } catch (error) {
      setError(
        getBackendErrorMessage(
          error,
          "Unable to add contribution.",
        ),
      );
    } finally {
      setAddingContribution(false);
    }
  }

  // ============================================================
  // PROGRESS
  // ============================================================

  function getProgress(goal: Goal) {
    if (goal.target_amount <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (goal.current_amount /
          goal.target_amount) *
          100,
      ),
    );
  }

  // ============================================================
  // FORMAT MONEY
  // ============================================================

  function formatAmount(amount: number) {
    return `$${amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    )}`;
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(date: string) {
    return new Date(
      `${date}T00:00:00`,
    ).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-full bg-[#181b18] px-6 py-8 text-[#f4f2ed]">
      <div className="mx-auto max-w-6xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Goals
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#858a83]">
              Set and monitor your financial goals,
              from saving plans to major purchases.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-[#f4f2ed] px-4 py-2.5 text-sm font-medium text-[#181b18] transition hover:opacity-90"
          >
            + New Goal
          </button>
        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-[#7c443b] bg-[#3a211e] px-4 py-3 text-sm text-[#f2a092]">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="ml-4 text-lg"
            >
              ×
            </button>
          </div>
        )}

        {/* ======================================================
            LOADING
        ====================================================== */}

        {loading ? (
          <div className="rounded-2xl border border-[#2a2d29] bg-[#20241f] p-8 text-center text-sm text-[#858a83]">
            Loading your goals...
          </div>
        ) : goals.length === 0 ? (

          /* ====================================================
             EMPTY STATE
          ==================================================== */

          <div className="rounded-2xl border border-[#2a2d29] bg-[#20241f] px-6 py-16 text-center">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#252925] text-2xl">
              🎯
            </div>

            <h2 className="text-lg font-medium">
              No goals yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#858a83]">
              Create your first financial goal
              and start tracking your progress.
            </p>

            <button
              onClick={() => setShowModal(true)}
              className="mt-6 rounded-xl bg-[#f4f2ed] px-5 py-2.5 text-sm font-medium text-[#181b18] transition hover:opacity-90"
            >
              Create your first goal
            </button>
          </div>

        ) : (

          /* ====================================================
             GOAL GRID
          ==================================================== */

          <div className="grid gap-5 md:grid-cols-2">

            {goals.map((goal) => {
              const progress =
                getProgress(goal);

              const remaining =
                Math.max(
                  0,
                  goal.target_amount -
                    goal.current_amount,
                );

              return (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-[#2a2d29] bg-[#20241f] p-6"
                >

                  {/* Goal header */}

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <h2 className="text-lg font-medium">
                        {goal.name}
                      </h2>

                      {goal.description && (
                        <p className="mt-1 text-sm text-[#858a83]">
                          {goal.description}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        goal.status ===
                        "completed"
                          ? "bg-[#b7d67b]/15 text-[#b7d67b]"
                          : "bg-[#252925] text-[#858a83]"
                      }`}
                    >
                      {goal.status ===
                      "completed"
                        ? "Completed"
                        : "Active"}
                    </span>
                  </div>

                  {/* Amount */}

                  <div className="mt-7 flex items-end justify-between">

                    <div>
                      <p className="text-2xl font-semibold">
                        {formatAmount(
                          goal.current_amount,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-[#737970]">
                        of{" "}
                        {formatAmount(
                          goal.target_amount,
                        )}
                      </p>
                    </div>

                    <p className="text-sm font-medium text-[#b7d67b]">
                      {progress}%
                    </p>
                  </div>

                  {/* Progress bar */}

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#2a2d29]">
                    <div
                      className="h-full rounded-full bg-[#b7d67b] transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  {/* Footer */}

                  <div className="mt-4 flex items-center justify-between text-xs text-[#737970]">
                    <span>
                      Target date
                    </span>

                    <span className="text-[#858a83]">
                      {formatDate(
                        goal.target_date,
                      )}
                    </span>
                  </div>

                  {/* Add money */}

                  {goal.status !==
                    "completed" && (
                    <button
                      onClick={() =>
                        openContributionModal(
                          goal,
                        )
                      }
                      className="mt-5 w-full rounded-xl border border-[#2a2d29] bg-[#252925] px-4 py-2.5 text-sm font-medium text-[#f4f2ed] transition hover:border-[#b7d67b] hover:bg-[#2b302a]"
                    >
                      + Add Money
                    </button>
                  )}

                  {/* Remaining */}

                  {goal.status !==
                    "completed" && (
                    <p className="mt-3 text-center text-xs text-[#737970]">
                      {formatAmount(
                        remaining,
                      )}{" "}
                      remaining
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ======================================================
            NEW GOAL MODAL
        ====================================================== */}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">

            <div className="w-full max-w-md rounded-2xl border border-[#2a2d29] bg-[#20241f] p-6 shadow-2xl">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-xl font-semibold">
                    New Goal
                  </h2>

                  <p className="mt-1 text-sm text-[#858a83]">
                    Create a goal you want to
                    save towards.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="text-xl text-[#737970] transition hover:text-[#f4f2ed]"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleCreateGoal}
                className="mt-6 space-y-4"
              >

                {/* Name */}

                <div>
                  <label className="mb-2 block text-sm text-[#858a83]">
                    Goal name
                  </label>

                  <input
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. New Laptop"
                    className="w-full rounded-xl border border-[#2a2d29] bg-[#181b18] px-4 py-3 text-sm outline-none transition placeholder:text-[#737970] focus:border-[#b7d67b]"
                  />
                </div>

                {/* Description */}

                <div>
                  <label className="mb-2 block text-sm text-[#858a83]">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value,
                      )
                    }
                    placeholder="What are you saving for?"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[#2a2d29] bg-[#181b18] px-4 py-3 text-sm outline-none transition placeholder:text-[#737970] focus:border-[#b7d67b]"
                  />
                </div>

                {/* Target amount */}

                <div>
                  <label className="mb-2 block text-sm text-[#858a83]">
                    Target amount
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={targetAmount}
                    onChange={(event) =>
                      setTargetAmount(
                        event.target.value,
                      )
                    }
                    placeholder="1000"
                    className="w-full rounded-xl border border-[#2a2d29] bg-[#181b18] px-4 py-3 text-sm outline-none transition placeholder:text-[#737970] focus:border-[#b7d67b]"
                  />
                </div>

                {/* Target date */}

                <div>
                  <label className="mb-2 block text-sm text-[#858a83]">
                    Target date
                  </label>

                  <input
                    type="date"
                    value={targetDate}
                    onChange={(event) =>
                      setTargetDate(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-[#2a2d29] bg-[#181b18] px-4 py-3 text-sm outline-none transition focus:border-[#b7d67b]"
                  />
                </div>

                {/* Buttons */}

                <div className="flex gap-3 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setShowModal(false)
                    }
                    className="flex-1 rounded-xl border border-[#2a2d29] px-4 py-3 text-sm text-[#858a83] transition hover:bg-[#252925]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 rounded-xl bg-[#f4f2ed] px-4 py-3 text-sm font-medium text-[#181b18] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating
                      ? "Creating..."
                      : "Create Goal"}
                  </button>

                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================
            CONTRIBUTION MODAL
        ====================================================== */}

        {showContributionModal &&
          selectedGoal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">

              <div className="w-full max-w-md rounded-2xl border border-[#2a2d29] bg-[#20241f] p-6 shadow-2xl">

                {/* Header */}

                <div className="flex items-start justify-between">

                  <div>
                    <h2 className="text-xl font-semibold">
                      Add to {selectedGoal.name}
                    </h2>

                    <p className="mt-1 text-sm text-[#858a83]">
                      Add money to this goal.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setShowContributionModal(
                        false,
                      )
                    }
                    className="text-xl text-[#737970] transition hover:text-[#f4f2ed]"
                  >
                    ×
                  </button>
                </div>

                {/* Current progress */}

                <div className="mt-6 rounded-xl border border-[#2a2d29] bg-[#181b18] p-4">

                  <div className="flex items-center justify-between text-sm">

                    <span className="text-[#858a83]">
                      Current
                    </span>

                    <span className="font-medium">
                      {formatAmount(
                        selectedGoal.current_amount,
                      )}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm">

                    <span className="text-[#858a83]">
                      Target
                    </span>

                    <span className="font-medium">
                      {formatAmount(
                        selectedGoal.target_amount,
                      )}
                    </span>
                  </div>

                </div>

                {/* Form */}

                <form
                  onSubmit={
                    handleAddContribution
                  }
                  className="mt-5 space-y-4"
                >

                  {/* Amount */}

                  <div>
                    <label className="mb-2 block text-sm text-[#858a83]">
                      Amount
                    </label>

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#737970]">
                        $
                      </span>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          contributionAmount
                        }
                        onChange={(event) =>
                          setContributionAmount(
                            event.target.value,
                          )
                        }
                        placeholder="100"
                        className="w-full rounded-xl border border-[#2a2d29] bg-[#181b18] py-3 pl-8 pr-4 text-sm outline-none transition placeholder:text-[#737970] focus:border-[#b7d67b]"
                      />
                    </div>
                  </div>

                  {/* Note */}

                  <div>
                    <label className="mb-2 block text-sm text-[#858a83]">
                      Note
                    </label>

                    <input
                      value={contributionNote}
                      onChange={(event) =>
                        setContributionNote(
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Saved from allowance"
                      className="w-full rounded-xl border border-[#2a2d29] bg-[#181b18] px-4 py-3 text-sm outline-none transition placeholder:text-[#737970] focus:border-[#b7d67b]"
                    />
                  </div>

                  {/* Buttons */}

                  <div className="flex gap-3 pt-2">

                    <button
                      type="button"
                      onClick={() =>
                        setShowContributionModal(
                          false,
                        )
                      }
                      className="flex-1 rounded-xl border border-[#2a2d29] px-4 py-3 text-sm text-[#858a83] transition hover:bg-[#252925]"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        addingContribution
                      }
                      className="flex-1 rounded-xl bg-[#f4f2ed] px-4 py-3 text-sm font-medium text-[#181b18] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addingContribution
                        ? "Adding..."
                        : "Add Contribution"}
                    </button>

                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
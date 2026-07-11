"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  spinMyBooking,
  type BookingSpinResult
} from "@/app/[locale]/(public)/book/actions";
import LotteryWheel from "@/components/admin/LotteryWheel";

export interface MyBookingPrize {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  wonCount: number;
}

type SpinError = Extract<BookingSpinResult, { ok: false }>["error"];

const SPIN_ERROR_KEY: Record<SpinError, string> = {
  rateLimited: "spinError_rateLimited",
  notReady: "spinError_notReady",
  notFound: "spinError_notFound",
  alreadySpun: "spinError_alreadySpun",
  noPrizesLeft: "spinError_noPrizesLeft"
};

/**
 * The booker's own wheel, shown on their /my-booking/{cancelToken} page. Keyed
 * on the private cancelToken (not a draw/entry token) and driven by the
 * booking-linked spinMyBooking action; mirrors PublicLotteryDraw otherwise.
 */
export default function MyBookingDraw({
  cancelToken,
  prizes,
  alreadyWonPrizeName
}: {
  cancelToken: string;
  prizes: MyBookingPrize[];
  alreadyWonPrizeName: string | null;
}) {
  const t = useTranslations("lotteryEntry");

  const wheelSlices = useMemo(
    () =>
      prizes
        .filter((p) => p.quantity - p.wonCount > 0)
        .map((p) => ({ id: p.id, label: p.name, weight: p.weight })),
    [prizes]
  );

  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [pendingPrizeName, setPendingPrizeName] = useState<string | null>(null);
  const [revealedPrizeName, setRevealedPrizeName] = useState<string | null>(
    null
  );
  const [spinError, setSpinError] = useState<SpinError | null>(null);
  const [busy, setBusy] = useState(false);

  // Already spun (this visit or a previous one) — just show what they won.
  if (alreadyWonPrizeName) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">{t("spinTitle")}</h2>
        <div className="w-full rounded-lg border border-success-border bg-success-surface p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-success">
            {t("alreadySpunNotice")}
          </p>
          <p className="mt-1 text-lg font-bold text-success-strong">
            {alreadyWonPrizeName}
          </p>
        </div>
      </div>
    );
  }

  const canSpin = !spinning && !busy && wheelSlices.length > 0;

  async function handleSpin() {
    if (!canSpin) return;
    setSpinError(null);
    setRevealedPrizeName(null);
    setBusy(true);
    const result = await spinMyBooking(cancelToken);
    setBusy(false);
    if (!result.ok) {
      setSpinError(result.error);
      return;
    }
    const idx = wheelSlices.findIndex((s) => s.id === result.winner.prizeId);
    if (idx === -1) {
      // Local slice list is stale (prize sold out between render and spin) —
      // reveal directly instead of animating to a slice that isn't there.
      setRevealedPrizeName(result.winner.prizeName);
      return;
    }
    setPendingPrizeName(result.winner.prizeName);
    setTargetIndex(idx);
    setSpinning(true);
  }

  function handleSpinComplete() {
    setSpinning(false);
    setRevealedPrizeName(pendingPrizeName);
    setPendingPrizeName(null);
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">{t("spinTitle")}</h2>

      <LotteryWheel
        slices={wheelSlices}
        spinning={spinning}
        targetIndex={targetIndex}
        onSpinComplete={handleSpinComplete}
      />

      <button
        type="button"
        onClick={handleSpin}
        disabled={!canSpin}
        className="rounded-full bg-fg px-6 py-3 text-sm font-semibold text-page transition hover:opacity-90 disabled:opacity-50"
      >
        {spinning ? t("spinning") : t("spin")}
      </button>

      {wheelSlices.length === 0 && !revealedPrizeName && (
        <p className="text-xs text-fg-subtle">{t("noPrizesYet")}</p>
      )}

      {spinError && (
        <p className="text-xs text-danger">{t(SPIN_ERROR_KEY[spinError])}</p>
      )}

      {revealedPrizeName && (
        <div className="w-full rounded-lg border border-success-border bg-success-surface p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-success">
            {t("winnerNotice")}
          </p>
          <p className="mt-1 text-lg font-bold text-success-strong">
            {revealedPrizeName}
          </p>
        </div>
      )}
    </div>
  );
}

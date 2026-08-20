import { useState } from "react";

export interface AdvisorInfo {
  advisorName: string;
  advisorWhatsapp: string;
  advisorEmail: string;
  tagline: string;
}

const STORAGE_KEY = "vecindata_advisor_info";

const EMPTY_INFO: AdvisorInfo = {
  advisorName: "",
  advisorWhatsapp: "",
  advisorEmail: "",
  tagline: "",
};

function readStoredInfo(): AdvisorInfo {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_INFO;
  try {
    return { ...EMPTY_INFO, ...JSON.parse(raw) };
  } catch {
    return EMPTY_INFO;
  }
}

/**
 * Advisor contact info is the same across every report an operator
 * generates (single or batch), so — unlike logoUrl/brandColor, which vary
 * per-report — it persists in localStorage and is shared between both.
 */
export function useAdvisorInfo(): [AdvisorInfo, (patch: Partial<AdvisorInfo>) => void] {
  const [info, setInfo] = useState<AdvisorInfo>(readStoredInfo);

  function update(patch: Partial<AdvisorInfo>) {
    setInfo((current) => {
      const next = { ...current, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return [info, update];
}

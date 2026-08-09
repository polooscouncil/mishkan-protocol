import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { councilsQuery, type Council } from "@/lib/db";

const KEY = "mishkan.active-council";

type ActiveCouncilState = {
  councils: Council[];
  council: Council | null;
  setCouncilId: (id: string | null) => void;
};

const Ctx = createContext<ActiveCouncilState | null>(null);

export function ActiveCouncilProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery(councilsQuery);
  const [councilId, setCouncilId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setCouncilId(window.localStorage.getItem(KEY));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (councilId) window.localStorage.setItem(KEY, councilId);
    else window.localStorage.removeItem(KEY);
  }, [councilId]);

  const councils = useMemo(() => data ?? [], [data]);

  const value = useMemo<ActiveCouncilState>(
    () => ({
      councils,
      council: councils.find((c) => c.id === councilId) ?? null,
      setCouncilId,
    }),
    [councils, councilId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActiveCouncil(): ActiveCouncilState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useActiveCouncil must be used within an ActiveCouncilProvider");
  return ctx;
}

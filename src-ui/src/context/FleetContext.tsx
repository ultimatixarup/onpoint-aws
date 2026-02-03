import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

export type Fleet = {
  id: string;
  name: string;
};

type FleetContextValue = {
  fleet?: Fleet;
  setFleet: (fleet: Fleet | undefined) => void;
};

const FleetContext = createContext<FleetContextValue | undefined>(undefined);

export function FleetProvider({ children }: PropsWithChildren) {
  const [fleet, setFleet] = useState<Fleet | undefined>();

  const value = useMemo<FleetContextValue>(
    () => ({
      fleet,
      setFleet
    }),
    [fleet]
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used within FleetProvider");
  return ctx;
}

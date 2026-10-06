import React, { createContext, useContext, useMemo, useState } from "react";
import LeadModal from "@/components/site/LeadModal";

const LeadModalContext = createContext({ open: () => {}, close: () => {} });

export function LeadModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [ctx, setCtx] = useState({});

  const value = useMemo(
    () => ({
      open: (context = {}) => {
        setCtx(context);
        setIsOpen(true);
      },
      close: () => setIsOpen(false),
    }),
    []
  );

  return (
    <LeadModalContext.Provider value={value}>
      {children}
      <LeadModal isOpen={isOpen} onClose={() => setIsOpen(false)} context={ctx} />
    </LeadModalContext.Provider>
  );
}

export function useLeadModal() {
  return useContext(LeadModalContext);
}

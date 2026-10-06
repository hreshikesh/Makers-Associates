import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import BrochureModal from "@/components/site/BrochureModal";

const BrochureModalContext = createContext({ open: () => {} });

export function BrochureModalProvider({ children }) {
  const [state, setState] = useState({ isOpen: false, slug: null, packageName: "", ctx: {} });

  const open = useCallback((slug, packageName = "", ctx = {}) => {
    setState({ isOpen: true, slug, packageName, ctx });
  }, []);

  const close = useCallback(() => setState((s) => ({ ...s, isOpen: false })), []);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <BrochureModalContext.Provider value={value}>
      {children}
      <BrochureModal
        isOpen={state.isOpen}
        onClose={close}
        slug={state.slug}
        packageName={state.packageName}
        ctx={state.ctx}
      />
    </BrochureModalContext.Provider>
  );
}

export function useBrochureModal() {
  return useContext(BrochureModalContext);
}

"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmOpts = {
  title: string;
  body?: string;
  confirmText?: string;
  destructive?: boolean;
};

type Ctx = (opts: ConfirmOpts) => Promise<boolean>;

const ConfirmContext = React.createContext<Ctx | null>(null);

export function useConfirm(): Ctx {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<
    (ConfirmOpts & { resolve: (v: boolean) => void }) | null
  >(null);

  const confirm = React.useCallback<Ctx>((opts) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <Dialog
          open
          onClose={() => close(false)}
          title={state.title}
          description={state.body}
        >
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              variant={state.destructive ? "destructive" : "default"}
              onClick={() => close(true)}
            >
              {state.confirmText ?? "Confirm"}
            </Button>
          </div>
        </Dialog>
      )}
    </ConfirmContext.Provider>
  );
}

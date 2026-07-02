"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

/** Máximo de piedras en una propuesta. */
export const MAX_SELECT = 4;

interface SelectionCtx {
  selected: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  max: number;
}

const Ctx = createContext<SelectionCtx | null>(null);

export function useSelection(): SelectionCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSelection debe usarse dentro de SelectionProvider");
  return c;
}

/**
 * Selección de piedras para la propuesta. Vive en el layout raíz para persistir
 * entre navegaciones (inventario ↔ detalle ↔ cotizador) sin localStorage.
 */
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [set, setSet] = useState<Set<string>>(new Set());

  const has = useCallback((id: string) => set.has(id), [set]);
  const toggle = useCallback((id: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_SELECT) next.add(id);
      return next;
    });
  }, []);
  const add = useCallback((id: string) => {
    setSet((prev) => {
      if (prev.has(id) || prev.size >= MAX_SELECT) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);
  const remove = useCallback((id: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);
  const clear = useCallback(() => setSet(new Set()), []);

  return (
    <Ctx.Provider
      value={{ selected: [...set], has, toggle, add, remove, clear, max: MAX_SELECT }}
    >
      {children}
    </Ctx.Provider>
  );
}

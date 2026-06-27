"use client";

import * as React from "react";
import { cn } from "@/common/utils/utils";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
  registerTab: (v: string, el: HTMLButtonElement | null) => void;
  focusSibling: (direction: 1 | -1) => void;
  focusEdge: (edge: "first" | "last") => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext(component: string) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}/> must be used inside <Tabs/>`);
  return ctx;
}

type TabsProps = {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

export function Tabs({
  value: controlled,
  defaultValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const value = controlled ?? internal;
  const baseId = React.useId();
  const tabsRef = React.useRef(new Map<string, HTMLButtonElement>());

  const setValue = React.useCallback(
    (v: string) => {
      if (controlled === undefined) setInternal(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange],
  );

  const registerTab = React.useCallback(
    (v: string, el: HTMLButtonElement | null) => {
      if (el) tabsRef.current.set(v, el);
      else tabsRef.current.delete(v);
    },
    [],
  );

  const focusSibling = React.useCallback(
    (direction: 1 | -1) => {
      const entries = Array.from(tabsRef.current.entries());
      if (entries.length === 0) return;
      const idx = entries.findIndex(([v]) => v === value);
      if (idx === -1) return;
      const next = (idx + direction + entries.length) % entries.length;
      const [nextValue, nextEl] = entries[next];
      nextEl.focus();
      setValue(nextValue);
    },
    [value, setValue],
  );

  const focusEdge = React.useCallback(
    (edge: "first" | "last") => {
      const entries = Array.from(tabsRef.current.entries());
      if (entries.length === 0) return;
      const [targetValue, targetEl] =
        edge === "first" ? entries[0] : entries[entries.length - 1];
      targetEl.focus();
      setValue(targetValue);
    },
    [setValue],
  );

  const ctx = React.useMemo<TabsContextValue>(
    () => ({ value, setValue, baseId, registerTab, focusSibling, focusEdge }),
    [value, setValue, baseId, registerTab, focusSibling, focusEdge],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabsListProps = {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={props["aria-label"]}
      className={cn(
        "inline-flex items-center gap-1 border-b border-gray-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export function TabsTrigger({
  value,
  children,
  className,
  disabled,
}: TabsTriggerProps) {
  const ctx = useTabsContext("TabsTrigger");
  const selected = ctx.value === value;
  const ref = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    ctx.registerTab(value, ref.current);
    return () => ctx.registerTab(value, null);
  }, [ctx, value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      ctx.focusSibling(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      ctx.focusSibling(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      ctx.focusEdge("first");
    } else if (event.key === "End") {
      event.preventDefault();
      ctx.focusEdge("last");
    }
  }

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => ctx.setValue(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-t-lg px-4 text-sm font-medium transition-colors",
        "text-gray-500 hover:text-brand-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
        selected &&
          "bg-brand-primary text-white shadow-sm hover:text-white",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

type TabsContentProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
  /**
   * Keep the panel mounted even when inactive (hidden via the `hidden`
   * attribute), so children that hold transient state — e.g. an unsaved form —
   * survive tab switches instead of being torn down and re-hydrated.
   */
  forceMount?: boolean;
};

export function TabsContent({
  value,
  children,
  className,
  forceMount,
}: TabsContentProps) {
  const ctx = useTabsContext("TabsContent");
  const selected = ctx.value === value;
  if (!selected && !forceMount) return null;
  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      hidden={!selected}
      tabIndex={selected ? 0 : -1}
      className={cn("focus-visible:outline-none", className)}
    >
      {children}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { subscribeTables } from "./client";
export function useLiveSQLiteQuery<T>(
  fn: () => Promise<T>,
  tables: string[],
  deps: readonly unknown[] = [],
) {
  const callback = useRef(fn);
  callback.current = fn;
  const [state, setState] = useState<{
    data?: T;
    error?: Error;
    loading: boolean;
    tables?: string;
    dependencies?: readonly unknown[];
  }>({
    loading: true,
  });
  const tableKey = tables.join(",");
  useEffect(() => {
    let active = true;
    let revision = 0;
    const refresh = () => {
      const request = ++revision;
      void callback.current().then(
        (data) => {
          if (active && request === revision)
            setState({ data, loading: false, tables: tableKey, dependencies: deps });
        },
        (error: unknown) => {
          if (active && request === revision)
            setState({
              error: error instanceof Error ? error : new Error(String(error)),
              loading: false,
              tables: tableKey,
              dependencies: deps,
            });
        },
      );
    };
    const unsubscribe = subscribeTables(tableKey.split(","), refresh);
    refresh();
    return () => {
      active = false;
      unsubscribe();
    };
    // Callers explicitly declare query dependencies, like an effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey, ...deps]);
  const current =
    state.tables === tableKey &&
    state.dependencies?.length === deps.length &&
    deps.every((value, index) => Object.is(value, state.dependencies?.[index]));
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: !current || state.loading,
  };
}

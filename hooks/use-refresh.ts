import { useState } from "react";
import { mutate } from "swr";

export function useRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch("/api/refresh", { method: "POST" });
      // Revalidate all SWR keys
      await mutate(() => true, undefined, { revalidate: true });
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refresh, isRefreshing };
}

import { useEffect, useRef } from "react";
import {
  apiGetCatalogCrawlJobStatus,
  type CrawlJobStatusResponse,
} from "@/shared/api/admin/catalogCrawlApi";

type PollDoneCallback<T> = (status: CrawlJobStatusResponse<T>) => void;
type PollErrorCallback = (error: unknown) => void;

const DEFAULT_INTERVAL_MS = 3000;

export function useCatalogCrawlJobPoller() {
  const timerIdsRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
      timerIdsRef.current = [];
    };
  }, []);

  function schedulePoll<T>(
    jobId: string,
    onDone: PollDoneCallback<T>,
    onError?: PollErrorCallback,
    intervalMs = DEFAULT_INTERVAL_MS,
  ) {
    const poll = async () => {
      try {
        const status = await apiGetCatalogCrawlJobStatus<T>(jobId);
        if (status.status === "RUNNING") {
          const timerId = window.setTimeout(poll, intervalMs);
          timerIdsRef.current.push(timerId);
          return;
        }
        onDone(status);
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    };

    void poll();
  }

  return {
    schedulePoll,
  };
}

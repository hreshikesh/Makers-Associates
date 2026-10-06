import { useEffect, useRef, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { playChime, showNativeNotification, notificationPermission } from "@/lib/notifications";
import api from "@/lib/api";
import { toast } from "sonner";

const STORAGE_KEY = "cons_admin_notif_seen_at";
const POLL_MS = 15000;

/**
 * Polls the backend for new leads + quiz submissions since the last seen timestamp.
 * Returns { items, unseenCount, markAllSeen, markSeen }.
 */
export function useAdminNotifications({ enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const seenAtRef = useRef(localStorage.getItem(STORAGE_KEY) || new Date().toISOString());
  const knownIdsRef = useRef(new Set());
  const timerRef = useRef(null);
  const firstRunRef = useRef(true);

  const fetchOnce = useCallback(async () => {
    try {
      const res = await api.get(`/notifications/pending?since=${encodeURIComponent(seenAtRef.current)}`);
      const data = res.data;
      const list = data.items || [];

      // Determine new items (not previously seen this session)
      const trulyNew = list.filter((i) => !knownIdsRef.current.has(`${i.type}:${i.id}`));

      // Update state
      setItems(list);
      setUnseenCount(list.length);

      if (!firstRunRef.current) {
        // Fire notifications for NEW ones
        trulyNew.forEach((it) => {
          playChime();
          showNativeNotification(it.title, { body: it.subtitle, url: it.link, tag: `${it.type}-${it.id}` });
          toast.success(it.title, { description: it.subtitle });
        });
      }
      // Update known ids
      list.forEach((i) => knownIdsRef.current.add(`${i.type}:${i.id}`));
      firstRunRef.current = false;
    } catch (e) {
      // Auth may have expired or network dropped — log for observability but don't spam the UI.
      if (e?.response?.status && ![401, 403].includes(e.response.status)) {
        // eslint-disable-next-line no-console
        console.warn("[useAdminNotifications] poll failed:", e?.response?.status || e?.message || e);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchOnce();
    timerRef.current = setInterval(fetchOnce, POLL_MS);
    return () => clearInterval(timerRef.current);
  }, [enabled, fetchOnce]);

  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, now);
    seenAtRef.current = now;
    setItems([]);
    setUnseenCount(0);
    knownIdsRef.current = new Set();
  }, []);

  const markSeen = useCallback((id, type) => {
    setItems((prev) => prev.filter((i) => !(i.id === id && i.type === type)));
    setUnseenCount((c) => Math.max(0, c - 1));
  }, []);

  return {
    items,
    unseenCount,
    markAllSeen,
    markSeen,
    permission: notificationPermission(),
  };
}

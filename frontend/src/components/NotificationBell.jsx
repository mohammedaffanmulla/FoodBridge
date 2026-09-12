import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../api/api.js";
import { getSocket } from "../api/socket.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const load = () => {
    api.get("/notifications").then(({ data }) => {
      setItems(data.notifications);
      setUnread(data.unreadCount);
    }).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    load();

    // Real-time: join this user's room and prepend anything that arrives
    // live (e.g. "donation accepted", "new listing nearby") instead of
    // waiting for the next poll.
    const socket = getSocket();
    socket.emit("join", `user:${user._id}`);
    const onNotification = (doc) => {
      setItems((prev) => [doc, ...prev]);
      setUnread((n) => n + 1);
    };
    socket.on("notification", onNotification);

    // Poll as a fallback in case the socket connection drops.
    const interval = setInterval(load, 30000);

    return () => {
      socket.off("notification", onNotification);
      clearInterval(interval);
    };
  }, [user?._id]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const openPanel = async () => {
    setOpen((o) => !o);
    if (unread > 0) {
      setUnread(0);
      try { await api.patch("/notifications/read-all"); } catch {}
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={boxRef}>
      <button onClick={openPanel} aria-label="Notifications" className="relative w-9 h-9 grid place-items-center rounded-full border border-banyan/20 dark:border-husk/20">
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-clay text-white text-[10px] font-medium rounded-full w-4 h-4 grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-husk dark:bg-husk-dark border border-banyan/15 dark:border-husk/15 rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 border-b border-banyan/10 dark:border-husk/10 font-medium text-sm">
            Notifications
          </div>
          {items.length === 0 && (
            <p className="px-4 py-6 text-sm text-ink-light dark:text-husk/60 text-center">
              Nothing yet — you'll see pickup alerts and updates here.
            </p>
          )}
          {items.map((n) => (
            <div key={n._id} className="px-4 py-3 border-b border-banyan/5 dark:border-husk/5 last:border-0">
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-ink-light dark:text-husk/70 mt-0.5">{n.body}</p>
              <p className="text-[11px] text-ink-light dark:text-husk/50 mt-1">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

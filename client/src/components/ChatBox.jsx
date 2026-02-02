import { useEffect, useMemo, useRef, useState } from "react";

import { api, uploadFile } from "../services/api.js";
import Message from "./Message.jsx";

export default function ChatBox({ chat, me, socket, onOpenGroupSettings }) {
  const API_URL = useMemo(() => import.meta.env.VITE_API_URL || "http://localhost:5000", []);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [pendingUploads, setPendingUploads] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());

  const listRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setText("");
    setPendingUploads([]);
    setTypingUsers(new Map());
  }, [chat?._id]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!chat?._id) return;
      const res = await api.get(`/messages/${chat._id}`);
      if (!mounted) return;
      setMessages(res.data.messages || []);
    }

    load().catch(() => null);

    return () => {
      mounted = false;
    };
  }, [chat?._id]);

  useEffect(() => {
    if (!socket || !chat?._id) return;

    socket.emit("chat:join", { chatId: chat._id });

    return () => {
      socket.emit("chat:leave", { chatId: chat._id });
    };
  }, [socket, chat?._id]);

  useEffect(() => {
    if (!socket) return;

    function onNew({ message }) {
      if (!message?.chat || String(message.chat) !== String(chat?._id)) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    }

    function onTyping({ chatId, userId, isTyping }) {
      if (!chatId || String(chatId) !== String(chat?._id)) return;
      if (String(userId) === String(me?._id)) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        if (isTyping) next.set(String(userId), true);
        else next.delete(String(userId));
        return next;
      });
    }

    socket.on("message:new", onNew);
    socket.on("typing:update", onTyping);

    return () => {
      socket.off("message:new", onNew);
      socket.off("typing:update", onTyping);
    };
  }, [socket, chat?._id, me?._id]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, typingUsers.size]);

  function onTypingInput(value) {
    setText(value);
    if (!socket || !chat?._id) return;

    socket.emit("typing:start", { chatId: chat._id });

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing:stop", { chatId: chat._id });
    }, 600);
  }

  async function onPickFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setPendingUploads((prev) => [...prev, ...files.map((f) => ({ file: f, status: "uploading" }))]);

    for (const file of files) {
      try {
        const uploaded = await uploadFile(file);
        setPendingUploads((prev) =>
          prev.map((p) => (p.file === file ? { ...p, status: "done", uploaded } : p))
        );
      } catch (e2) {
        setPendingUploads((prev) =>
          prev.map((p) => (p.file === file ? { ...p, status: "error" } : p))
        );
      }
    }
  }

  async function send() {
    if (!chat?._id) return;

    const attachments = pendingUploads
      .filter((p) => p.status === "done" && p.uploaded)
      .map((p) => p.uploaded);

    if (!text.trim() && attachments.length === 0) return;

    const res = await api.post("/messages", {
      chatId: chat._id,
      content: text,
      attachments,
    });

    setText("");
    setPendingUploads([]);

    setMessages((prev) => {
      const msg = res.data.message;
      if (prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
  }

  const title = chat?.isGroupChat
    ? chat.chatName
    : chat?.users?.find((u) => String(u._id) !== String(me?._id))?.name || "Chat";

  if (!chat) {
    return (
      <div className="h-full w-full grid place-items-center bg-gray-50">
        <div className="text-gray-500">Select a user or group to start chatting.</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold text-gray-900 truncate">{title}</div>
          {chat?.isGroupChat ? (
            <button
              onClick={onOpenGroupSettings}
              className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
            >
              Group
            </button>
          ) : null}
        </div>
        {typingUsers.size > 0 ? (
          <div className="text-xs text-brand-600">typing...</div>
        ) : (
          <div className="text-xs text-gray-500">&nbsp;</div>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((m) => (
          <Message
            key={m._id}
            message={m}
            isMine={String(m.sender?._id || m.sender) === String(me?._id)}
            apiUrl={API_URL}
          />
        ))}
      </div>

      <div className="border-t border-gray-200 bg-white p-3">
        {pendingUploads.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {pendingUploads.map((p) => (
              <div
                key={`${p.file.name}-${p.file.size}-${p.file.lastModified}`}
                className={`text-xs px-2 py-1 rounded-md border ${
                  p.status === "done"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : p.status === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-gray-200 bg-gray-50 text-gray-700"
                }`}
              >
                {p.file.name}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2">
          <label className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer text-sm">
            <input type="file" className="hidden" multiple onChange={onPickFiles} />
            +
          </label>

          <textarea
            value={text}
            onChange={(e) => onTypingInput(e.target.value)}
            rows={1}
            placeholder="Type a message"
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
          />

          <button
            onClick={send}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white hover:bg-brand-600 text-sm"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

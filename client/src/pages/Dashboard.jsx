import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

import Sidebar from "../components/Sidebar.jsx";
import ChatBox from "../components/ChatBox.jsx";
import CreateGroupModal from "../components/CreateGroupModal.jsx";
import GroupSettingsModal from "../components/GroupSettingsModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";

export default function Dashboard() {
  const { user: me, token, logout } = useAuth();

  const SOCKET_URL = useMemo(
    () => import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
    []
  );

  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [socket, setSocket] = useState(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [uRes, cRes] = await Promise.all([api.get("/users"), api.get("/chats")]);
      if (!mounted) return;
      setUsers(uRes.data.users || []);
      setChats(cRes.data.chats || []);
    }

    load().catch(() => null);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    function onPresenceUpdate(payload) {
      const { userId, isOnline, lastSeenAt } = payload || {};
      if (!userId) return;

      setUsers((prev) =>
        prev.map((u) =>
          String(u._id) === String(userId) ? { ...u, isOnline, lastSeenAt } : u
        )
      );

      setChats((prev) =>
        prev.map((c) => ({
          ...c,
          users: Array.isArray(c.users)
            ? c.users.map((u) =>
                String(u._id) === String(userId) ? { ...u, isOnline, lastSeenAt } : u
              )
            : c.users,
        }))
      );
    }

    function onNewMessage({ message }) {
      if (!message?.chat) return;
      const chatId = String(message.chat);

      setChats((prev) => {
        const idx = prev.findIndex((c) => String(c._id) === chatId);
        if (idx === -1) return prev;

        const updated = {
          ...prev[idx],
          latestMessage: message,
          updatedAt: message.createdAt,
        };

        const next = [updated, ...prev.filter((_, i) => i !== idx)];
        return next;
      });
    }

    s.on("presence:update", onPresenceUpdate);
    s.on("message:new", onNewMessage);

    setSocket(s);

    return () => {
      s.off("presence:update", onPresenceUpdate);
      s.off("message:new", onNewMessage);
      s.disconnect();
      setSocket(null);
    };
  }, [SOCKET_URL, token]);

  useEffect(() => {
    if (!socket) return;
    if (!Array.isArray(chats)) return;
    chats.forEach((c) => {
      socket.emit("chat:join", { chatId: c._id });
    });
  }, [socket, chats]);

  async function onSelectUser(u) {
    const res = await api.post("/chats", { userId: u._id });
    const chat = res.data.chat;

    setChats((prev) => {
      const exists = prev.some((c) => String(c._id) === String(chat._id));
      if (exists) {
        return prev.map((c) => (String(c._id) === String(chat._id) ? chat : c));
      }
      return [chat, ...prev];
    });

    setSelectedChat(chat);
  }

  function onSelectChat(chat) {
    setSelectedChat(chat);
  }

  async function onCreateGroup({ name, users: userIds }) {
    const res = await api.post("/chats/group", { name, users: userIds });
    const chat = res.data.chat;
    setChats((prev) => [chat, ...prev]);
    setSelectedChat(chat);
  }

  async function onRenameGroup({ chatId, name }) {
    const res = await api.put("/chats/group/rename", { chatId, name });
    const updated = res.data.chat;
    setChats((prev) => prev.map((c) => (String(c._id) === String(updated._id) ? updated : c)));
    setSelectedChat((prev) => (prev && String(prev._id) === String(updated._id) ? updated : prev));
  }

  async function onAddGroupMember({ chatId, userId }) {
    const res = await api.put("/chats/group/add", { chatId, userId });
    const updated = res.data.chat;
    setChats((prev) => prev.map((c) => (String(c._id) === String(updated._id) ? updated : c)));
    setSelectedChat((prev) => (prev && String(prev._id) === String(updated._id) ? updated : prev));
  }

  async function onRemoveGroupMember({ chatId, userId }) {
    const res = await api.put("/chats/group/remove", { chatId, userId });

    if (res.data.deleted) {
      setChats((prev) => prev.filter((c) => String(c._id) !== String(chatId)));
      setSelectedChat((prev) => (prev && String(prev._id) === String(chatId) ? null : prev));
      return;
    }

    const updated = res.data.chat;
    setChats((prev) => prev.map((c) => (String(c._id) === String(updated._id) ? updated : c)));
    setSelectedChat((prev) => (prev && String(prev._id) === String(updated._id) ? updated : prev));
  }

  return (
    <div className="h-full w-full bg-gray-100">
      <div className="h-full w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[320px_1fr]">
        <Sidebar
          me={me}
          users={users}
          chats={chats}
          selectedChatId={selectedChat?._id}
          onSelectUser={onSelectUser}
          onSelectChat={onSelectChat}
          onOpenCreateGroup={() => setCreateGroupOpen(true)}
          onLogout={logout}
        />

        <ChatBox
          chat={selectedChat}
          me={me}
          socket={socket}
          onOpenGroupSettings={() => setGroupSettingsOpen(true)}
        />
      </div>

      <CreateGroupModal
        open={createGroupOpen}
        users={users}
        onClose={() => setCreateGroupOpen(false)}
        onCreate={onCreateGroup}
      />

      <GroupSettingsModal
        open={groupSettingsOpen}
        chat={selectedChat}
        me={me}
        allUsers={users}
        onClose={() => setGroupSettingsOpen(false)}
        onRename={onRenameGroup}
        onAddMember={onAddGroupMember}
        onRemoveMember={onRemoveGroupMember}
      />
    </div>
  );
}

export default function Sidebar({
  me,
  users,
  chats,
  selectedChatId,
  onSelectUser,
  onSelectChat,
  onOpenCreateGroup,
  onLogout,
}) {
  const groupChats = chats.filter((c) => c.isGroupChat);

  return (
    <div className="h-full w-full border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{me?.name || "FChat"}</div>
          <div className="text-xs text-gray-500 truncate">{me?.email}</div>
        </div>
        <button
          onClick={onLogout}
          className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50"
        >
          Logout
        </button>
      </div>

      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-700">Users</div>
        <button
          onClick={onOpenCreateGroup}
          className="text-xs px-2 py-1 rounded-md bg-brand-500 text-white hover:bg-brand-600"
        >
          New group
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-2">
          <div className="space-y-1">
            {users.map((u) => (
              <button
                key={u._id}
                onClick={() => onSelectUser(u)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-3"
              >
                <div className="relative">
                  <div className="h-9 w-9 rounded-full bg-gray-200 overflow-hidden">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                      u.isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{u.name}</div>
                  <div className="text-xs text-gray-500 truncate">{u.isOnline ? "Online" : "Offline"}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200" />

        <div className="p-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">Groups</div>
          <div className="space-y-1">
            {groupChats.map((c) => (
              <button
                key={c._id}
                onClick={() => onSelectChat(c)}
                className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 ${
                  selectedChatId === c._id ? "bg-gray-50" : ""
                }`}
              >
                <div className="text-sm font-medium text-gray-900 truncate">{c.chatName}</div>
                <div className="text-xs text-gray-500 truncate">
                  {c.users?.length || 0} members
                </div>
              </button>
            ))}

            {groupChats.length === 0 ? (
              <div className="text-xs text-gray-500">No groups yet.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

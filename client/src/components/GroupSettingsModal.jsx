import { useMemo, useState } from "react";

export default function GroupSettingsModal({
  open,
  chat,
  me,
  allUsers,
  onClose,
  onRename,
  onAddMember,
  onRemoveMember,
}) {
  const isGroup = Boolean(chat?.isGroupChat);
  const isAdmin = useMemo(
    () => String(chat?.groupAdmin?._id || chat?.groupAdmin) === String(me?._id),
    [chat?.groupAdmin, me?._id]
  );

  const [name, setName] = useState(chat?.chatName || "");
  const [selectedToAdd, setSelectedToAdd] = useState("");
  const [busy, setBusy] = useState(false);

  const memberIds = useMemo(
    () => new Set((chat?.users || []).map((u) => String(u._id || u))),
    [chat?.users]
  );

  const availableToAdd = useMemo(() => {
    return (allUsers || []).filter((u) => !memberIds.has(String(u._id)));
  }, [allUsers, memberIds]);

  async function rename() {
    if (!isAdmin) return;
    const nextName = name.trim();
    if (!nextName) return;

    setBusy(true);
    try {
      await onRename({ chatId: chat._id, name: nextName });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function addMember() {
    if (!isAdmin) return;
    if (!selectedToAdd) return;

    setBusy(true);
    try {
      await onAddMember({ chatId: chat._id, userId: selectedToAdd });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId) {
    setBusy(true);
    try {
      await onRemoveMember({ chatId: chat._id, userId });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!open || !isGroup) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Group settings</div>
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-sm text-gray-700">
            <div className="font-medium text-gray-900">{chat.chatName}</div>
            <div className="text-xs text-gray-500">
              Admin: {chat.groupAdmin?.name || "(unknown)"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Rename group</div>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-gray-50"
              />
              <button
                onClick={rename}
                disabled={!isAdmin || busy}
                className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
            {!isAdmin ? (
              <div className="text-xs text-gray-500">Only admin can rename.</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Add member</div>
            <div className="flex gap-2">
              <select
                value={selectedToAdd}
                onChange={(e) => setSelectedToAdd(e.target.value)}
                disabled={!isAdmin}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
              >
                <option value="">Select user</option>
                {availableToAdd.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              <button
                onClick={addMember}
                disabled={!isAdmin || busy || !selectedToAdd}
                className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm hover:bg-brand-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {!isAdmin ? (
              <div className="text-xs text-gray-500">Only admin can add members.</div>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">Members</div>
            <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
              {(chat.users || []).map((u) => {
                const id = String(u._id || u);
                const canRemove = isAdmin || String(me?._id) === id;
                const isAdminMember =
                  String(chat.groupAdmin?._id || chat.groupAdmin) === String(u._id || u);

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between px-3 py-2 border-b border-gray-100"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 truncate">
                        {u.name || id} {isAdminMember ? "(admin)" : ""}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{u.email || ""}</div>
                    </div>

                    <button
                      onClick={() => removeMember(id)}
                      disabled={!canRemove || busy || isAdminMember}
                      className="text-xs px-2 py-1 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {String(me?._id) === id ? "Leave" : "Remove"}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-500">
              Admin cannot be removed (transfer admin first not implemented).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

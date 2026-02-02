import { useMemo, useState } from "react";

export default function CreateGroupModal({ open, users, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const canCreate = useMemo(() => name.trim().length > 0 && selected.length >= 2, [name, selected]);

  function toggleUser(id) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (!canCreate) return;
    setBusy(true);
    try {
      await onCreate({ name: name.trim(), users: selected });
      setName("");
      setSelected([]);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Create group</div>
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
            Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Group name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="e.g. Project Team"
            />
          </div>

          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Add members (min 2)</div>
            <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
              {users.map((u) => (
                <label key={u._id} className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                  <input
                    type="checkbox"
                    checked={selected.includes(u._id)}
                    onChange={() => toggleUser(u._id)}
                  />
                  <span className="text-sm text-gray-900">{u.name}</span>
                  <span className="text-xs text-gray-500">({u.email})</span>
                </label>
              ))}
            </div>
          </div>

          <button
            disabled={!canCreate || busy}
            onClick={submit}
            className="w-full rounded-lg bg-brand-500 text-white py-2 text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ name, email, password, avatar });
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full bg-gray-50 grid place-items-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="text-2xl font-semibold text-gray-900">Create account</div>
        <div className="text-sm text-gray-500 mt-1">Join FChat</div>

        {error ? (
          <div className="mt-4 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Avatar URL (optional)</label>
            <input
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              type="url"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="https://..."
            />
          </div>

          <button
            disabled={busy}
            className="w-full rounded-lg bg-brand-500 text-white py-2 text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? "Creating..." : "Register"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

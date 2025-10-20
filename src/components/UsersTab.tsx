"use client";
import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

type Person = { id: number; name: string; email: string };
type User = {
  id: number;
  username: string;
  role: string;
  person_id?: number;
  person_name?: string;
  person_email?: string;
  must_change_password: number;
  created_at: string;
};

type CredentialsModalData = {
  username: string;
  tempPassword: string;
  person_name: string;
  person_email: string;
  emailSent: boolean;
  emailError?: string;
};

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [loading, setLoading] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<CredentialsModalData | null>(null);

  useEffect(() => {
    loadUsers();
    loadPeople();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await apiGet<User[]>("/api/users");
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPeople() {
    try {
      const data = await apiGet<Person[]>("/api/people");
      setPeople(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function createUser() {
    if (!selectedPersonId) {
      alert("Please select a person");
      return;
    }

    try {
      const result = await apiPost<any>("/api/users", {
        person_id: Number(selectedPersonId),
      });

      setCredentialsModal({
        username: result.username,
        tempPassword: result.tempPassword,
        person_name: result.person_name,
        person_email: result.person_email,
        emailSent: result.emailSent,
        emailError: result.emailError,
      });

      setSelectedPersonId("");
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to create user");
    }
  }

  async function resendCredentials(userId: number) {
    if (!confirm("Generate a new temporary password and send it via email?")) return;

    try {
      const result = await apiPost<any>(`/api/users/${userId}/resend-credentials`);

      setCredentialsModal({
        username: result.username,
        tempPassword: result.tempPassword,
        person_name: result.person_name,
        person_email: result.person_email,
        emailSent: result.emailSent,
        emailError: result.emailError,
      });
    } catch (err: any) {
      alert(err.message || "Failed to resend credentials");
    }
  }

  async function deleteUser(id: number) {
    if (!confirm("Delete this user account?")) return;

    try {
      await apiDelete(`/api/users/${id}`);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  }

  const closeCredentialsModal = () => {
    setCredentialsModal(null);
  };

  // Filter out people who already have user accounts
  const availablePeople = people.filter(
    (p) => !users.some((u) => u.person_id === p.id)
  );

  return (
    <div>
      <h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">
        User Management
      </h2>
      <p className="text-gray-600 mb-4 text-sm">
        Create user accounts for family members so they can log in and manage their wishlists
      </p>

      {/* Credentials Modal */}
      {credentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-indigo-600 mb-4">
              {credentialsModal.emailSent ? "✅ Credentials Sent!" : "⚠️ Email Failed"}
            </h3>
            
            {credentialsModal.emailSent ? (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <p className="text-sm text-green-800 mb-2">
                  <strong>✓ Email sent successfully to:</strong>
                </p>
                <p className="text-sm text-green-700">{credentialsModal.person_email}</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>⚠️ Email could not be sent:</strong>
                </p>
                <p className="text-sm text-yellow-700">{credentialsModal.emailError}</p>
                <p className="text-sm text-yellow-800 mt-2">
                  Please share these credentials manually with {credentialsModal.person_name}.
                </p>
              </div>
            )}
            
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  For
                </label>
                <div className="bg-gray-100 p-3 rounded border border-gray-300 text-sm">
                  {credentialsModal.person_name} ({credentialsModal.person_email})
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Username
                </label>
                <div className="bg-gray-100 p-3 rounded border border-gray-300 font-mono text-sm">
                  {credentialsModal.username}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Temporary Password
                </label>
                <div className="bg-gray-100 p-3 rounded border border-gray-300 font-mono text-sm break-all">
                  {credentialsModal.tempPassword}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-sm text-blue-800">
                The user will be required to change this password on first login.
              </p>
            </div>

            <button
              onClick={closeCredentialsModal}
              className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create User Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Create New User Account
        </h3>
        
        {availablePeople.length === 0 ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-yellow-700 text-sm">
              All people already have user accounts, or no people exist yet.
            </p>
          </div>
        ) : (
          <div className="flex gap-3">
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="flex-1 p-2 border rounded"
            >
              <option value="">Select a person...</option>
              {availablePeople.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
            
            <button
              onClick={createUser}
              disabled={!selectedPersonId}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create User
            </button>
          </div>
        )}
      </div>

      {/* Users List */}
      <div>
        <h3 className="text-indigo-600 text-xl font-semibold mb-3">
          Existing Users
        </h3>

        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-500">No users yet</p>
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-gray-50 p-4 rounded-lg flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-lg">{user.username}</strong>
                    {user.role === "admin" && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-semibold">
                        ADMIN
                      </span>
                    )}
                    {user.must_change_password === 1 && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                        Temp Password
                      </span>
                    )}
                  </div>
                  
                  {user.person_name && (
                    <div className="text-sm text-gray-600 mt-1">
                      Linked to: <strong>{user.person_name}</strong> ({user.person_email})
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-1">
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  {user.role !== "admin" && user.person_email && (
                    <button
                      onClick={() => resendCredentials(user.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                      title="Generate new password and send via email"
                    >
                      📧 Resend
                    </button>
                  )}
                  
                  {user.role !== "admin" && (
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
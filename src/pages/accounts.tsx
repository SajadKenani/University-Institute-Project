import React, { useCallback, useEffect, useState } from "react";
import { DELETE, GET, POST } from "../components/Requests";

export const ACCOUNTS = () => {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    phoneNumber: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    text: "",
    type: "default",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<number | null>(null);

  interface Account {
    id: number;
    gen_id: string;
    name: string;
    phone_number: string;
    role: string;
  }

  const [accounts, setAccounts] = useState<Account[]>([]);

  // Generic handler for input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleAccountInsertion = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const { name, password, phoneNumber, role } = formData;

      // Comprehensive validation
      if (!name.trim() || !password.trim() || !phoneNumber.trim() || !role.trim()) {
        setMessage({
          text: "All fields are required.",
          type: "error",
        });
        return;
      }

      // Phone number validation (basic)
      const phoneRegex = /^[0-9]{11}$/;
      if (!phoneRegex.test(phoneNumber)) {
        setMessage({
          text: "Please enter a valid 11-digit phone number.",
          type: "error",
        });
        return;
      }

      // Password strength check
      if (password.length < 8) {
        setMessage({
          text: "Password must be at least 8 characters long.",
          type: "error",
        });
        return;
      }

      setMessage({ text: "", type: "default" });

      const response = await POST("api/create-admin-account", {
        name: name.trim(),
        password: password.trim(),
        phone_number: phoneNumber.trim(),
        role: role.trim(),
      });

      if (response) {
        setMessage({
          text: "Account created successfully!",
          type: "success",
        });

        // Refresh accounts list
        await handleAccountsFetching();

        // Reset form
        setFormData({
          name: "",
          password: "",
          phoneNumber: "",
          role: "",
        });
      } else {
        setMessage({
          text: "Failed to create the account!",
          type: "error",
        });
      }
    },
    [formData]
  );

  const handleAccountsFetching = useCallback(async () => {
    setLoading(true);
    try {
      const response = await GET("api/fetch-accounts");
      setAccounts(response.data || []);
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAccountDeletion = useCallback(async () => {
    if (accountToDelete === null) return;

    setLoading(true);
    try {
      await DELETE(`api/delete-account/${accountToDelete}`, {});
      setMessage({
        text: "Account deleted successfully!",
        type: "success",
      });
      await handleAccountsFetching();
    } catch (error) {
      console.error("Failed to delete account", error);
      setMessage({
        text: "Failed to delete the account!",
        type: "error",
      });
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setAccountToDelete(null);
    }
  }, [accountToDelete, handleAccountsFetching]);

  useEffect(() => {
    handleAccountsFetching();
  }, [handleAccountsFetching]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row p-6 gap-8">
      {/* Account Creation Form */}
      <div className="w-full lg:w-1/2 bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create Admin Account
        </h2>
        <form onSubmit={handleAccountInsertion} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use at least 8 characters, including uppercase, lowercase, and numbers.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="11-digit phone number"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Role</option>
              <option value="Admin">مدير</option>
              <option value="Teacher">تدريسي</option>
              <option value="Announcer">معلن</option>
              {/* <option value="User">طالب</option> */}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold uppercase tracking-wider transition duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
          {message.text && (
            <div
              className={`p-4 rounded-lg text-center font-medium ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-50 text-gray-700 border border-gray-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </div>

      {/* Accounts List */}
      <div className="w-full lg:w-1/2 bg-white shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Existing Accounts
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="loader border-t-4 border-blue-500 rounded-full w-8 h-8 animate-spin"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center text-gray-500">No accounts found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.gen_id}
                    className="border-b hover:bg-gray-50 transition duration-200"
                  >
                    <td className="p-3">{account.name}</td>
                    <td className="p-3">{account.phone_number}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.role === "Admin"
                            ? "bg-red-100 text-red-800"
                            : account.role === "Manager"
                            ? "bg-blue-100 text-blue-800"
                            : account.role === "Supervisor"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {account.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setAccountToDelete(account.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this account? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountDeletion}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
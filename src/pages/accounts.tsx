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
    is_active: boolean;
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

  const handleStatusChange = useCallback(async (myid: number) => {
    console.log(myid);
    setLoading(true);
    try {
      const response = await POST("api/update-status", { id: myid });
      console.log(response);
      if (response.status === 200) {
        await handleAccountsFetching();
      }
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setLoading(false);
    }
  }, [handleAccountsFetching]);

  useEffect(() => {
    handleAccountsFetching();
  }, [handleAccountsFetching]);


  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-8 bg-blue-50 p-6 font-arabic" dir="rtl">
      {/* نموذج إنشاء حساب */}
      <div className="w-full lg:w-1/2 bg-white shadow-lg rounded-lg p-8 border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
          إنشاء حساب مسؤول
        </h2>
        <form onSubmit={handleAccountInsertion} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-blue-700">الاسم</label>
            <input
              type="text"
              name="name"
              placeholder="أدخل الاسم الكامل"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700">كلمة المرور</label>
            <input
              type="password"
              name="password"
              placeholder="أنشئ كلمة مرور قوية"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-500 mt-1">
              استخدم 8 أحرف على الأقل، بما في ذلك الأحرف الكبيرة والصغيرة والأرقام.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700">رقم الهاتف</label>
            <input
              type="tel"
              name="phoneNumber"
              placeholder="رقم هاتف مكون من 11 رقمًا"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-700">الدور</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر الدور</option>
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
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
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
  
      {/* قائمة الحسابات */}
      <div className="w-full lg:w-1/2 bg-white shadow-lg rounded-lg p-8 border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
          الحسابات الموجودة
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="loader border-t-4 border-blue-500 rounded-full w-8 h-8 animate-spin"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center text-blue-500">لم يتم العثور على حسابات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-100">
                  <th className="p-3 text-right text-blue-700">الاسم</th>
                  <th className="p-3 text-right text-blue-700">الهاتف</th>
                  <th className="p-3 text-right text-blue-700">الدور</th>
                  <th className="p-3 text-right text-blue-700">الإجراءات</th>
                  <th className="p-3 text-right text-blue-700">حاله التسجيل</th>
                  
                </tr>
              </thead>
              <tbody>
                {accounts.sort((a, b) => a.id - b.id).map((account) => (
                  <tr
                    key={account.gen_id}
                    className="border-b border-blue-100 hover:bg-blue-50 transition duration-200"
                  >
                    <td className="p-3">{account.name}</td>
                    <td className="p-3">{account.phone_number}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.role === "Admin"
                            ? "bg-blue-100 text-blue-800"
                            : account.role === "Teacher"
                            ? "bg-indigo-100 text-indigo-800"
                            : account.role === "Announcer"
                            ? "bg-cyan-100 text-cyan-800"
                            : "bg-teal-100 text-teal-800"
                        }`}
                      >
                        {account.role === "Admin" ? "مدير" : 
                         account.role === "Teacher" ? "تدريسي" : 
                         account.role === "Announcer" ? "معلن" : account.role}
                      </span>
                    </td>
                    <td className="cursor-pointer" onClick={() => handleStatusChange(account.id)}>{account.is_active === true ? "مفعل" : "غير مفعل"}</td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setAccountToDelete(account.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  
      {/* نافذة تأكيد الحذف */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold text-blue-800 mb-4">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">
              هل أنت متأكد أنك تريد حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex justify-start space-x-4 space-x-reverse">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                إلغاء
              </button>
              <button
                onClick={handleAccountDeletion}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mr-4"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
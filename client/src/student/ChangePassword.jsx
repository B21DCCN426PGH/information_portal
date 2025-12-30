import { useState } from 'react';
import { changeStudentPassword } from '../services/api';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

export const ChangePassword = () => {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate
    if (!form.current_password) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    if (!form.new_password) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (form.new_password.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (form.current_password === form.new_password) {
      setError('Mật khẩu mới phải khác mật khẩu hiện tại');
      return;
    }

    try {
      setLoading(true);
      await changeStudentPassword({
        current_password: form.current_password,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      });
      setSuccess(true);
      setForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Đổi mật khẩu</h1>
        <p className="mt-2 text-slate-600">Thay đổi mật khẩu đăng nhập của bạn</p>
      </div>

      {success && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600 border border-green-200">
          Đổi mật khẩu thành công!
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mật khẩu hiện tại <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              name="current_password"
              value={form.current_password}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Nhập mật khẩu hiện tại"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">Mật khẩu phải có ít nhất 6 ký tự</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Xác nhận mật khẩu mới <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Nhập lại mật khẩu mới"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            <FaLock className="text-xs" />
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </form>
    </div>
  );
};


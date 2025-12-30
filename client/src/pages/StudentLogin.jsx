import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginStudent } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const StudentLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    student_code: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const data = await loginStudent({
        student_code: form.student_code,
        password: form.password,
      });
      login(data.token, data.profile);
      navigate('/student');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập Sinh viên</h1>
          <p className="mt-2 text-sm text-slate-500">Đăng nhập để truy cập hệ thống</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-600">
            Mã sinh viên <span className="text-red-500">*</span>
            <input
              type="text"
              name="student_code"
              value={form.student_code}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3"
              required
              placeholder="Nhập mã sinh viên"
            />
          </label>

          <label className="block text-sm font-medium text-slate-600">
            Mật khẩu <span className="text-red-500">*</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3"
              required
              minLength={6}
            />
          </label>

          <div className="flex justify-end">
            <Link to="/student/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 transition">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="text-center text-xs text-slate-500">
            Tài khoản được quản lý bởi admin. Vui lòng liên hệ admin để được cấp tài khoản.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/" className="text-slate-500 hover:text-slate-700 transition">
            ← Quay lại trang chủ
          </Link>
          <Link to="/admin/login" className="text-blue-600 hover:text-blue-700 font-medium transition">
            Đăng nhập Admin →
          </Link>
        </div>
      </div>
    </div>
  );
};


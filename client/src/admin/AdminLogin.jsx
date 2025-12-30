import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginAdmin } from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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
      const data = await loginAdmin(form);
      
      if (!data.token) {
        throw new Error('Không nhận được token từ server');
      }
      
      login(data.token, data.profile);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-8 w-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập Quản trị</h1>
          <p className="mt-2 text-sm text-slate-500">
            Đăng nhập bằng tài khoản admin
          </p>
        </div>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}
        <label className="mt-6 block text-sm font-medium text-slate-600">
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 p-3"
            required
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-600">
          Mật khẩu
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="mt-1 w-full rounded-xl border border-slate-200 p-3"
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-900 disabled:opacity-50 transition"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between text-sm">
            <Link to="/" className="text-slate-500 hover:text-slate-700 transition">
              ← Quay lại trang chủ
            </Link>
            <Link to="/student/login" className="text-slate-600 hover:text-slate-800 font-medium transition">
              Đăng nhập Sinh viên →
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};


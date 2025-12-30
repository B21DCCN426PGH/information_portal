import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token không hợp lệ. Vui lòng yêu cầu khôi phục mật khẩu mới.');
    }
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!token) {
      setError('Token không hợp lệ.');
      return;
    }

    if (form.password !== form.confirm_password) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await resetPassword({ token, password: form.password, confirm_password: form.confirm_password });
      setSuccess(true);
      
      // Chuyển đến trang login sau 3 giây
      setTimeout(() => {
        navigate('/student/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Token không hợp lệ</h1>
            <p className="text-sm text-slate-500 mb-4">{error || 'Link khôi phục mật khẩu không hợp lệ hoặc đã hết hạn.'}</p>
            <Link
              to="/student/forgot-password"
              className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              Yêu cầu link mới
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-sm text-slate-500">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              <p className="font-semibold mb-1">Đặt lại mật khẩu thành công!</p>
              <p>Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...</p>
            </div>
            <Link
              to="/student/login"
              className="block w-full text-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-600">
              Mật khẩu mới <span className="text-red-500">*</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                required
                minLength={6}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </label>

            <label className="block text-sm font-medium text-slate-600">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                required
                minLength={6}
                placeholder="Nhập lại mật khẩu mới"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/student/login" className="text-sm text-blue-600 hover:text-blue-700 transition">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};


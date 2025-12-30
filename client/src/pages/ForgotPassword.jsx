import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await forgotPassword({ email });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Quên mật khẩu</h1>
          <p className="mt-2 text-sm text-slate-500">Nhập email để nhận link khôi phục mật khẩu</p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        {success ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              <p className="font-semibold mb-1">Email đã được gửi!</p>
              <p>Chúng tôi đã gửi link khôi phục mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư (bao gồm cả thư mục spam).</p>
              <p className="mt-2 text-xs">Link sẽ hết hạn sau 1 giờ.</p>
            </div>
            <Link
              to="/student/login"
              className="block w-full text-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-600">
              Email <span className="text-red-500">*</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 p-3"
                required
                placeholder="Nhập email đăng ký"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Đang gửi...' : 'Gửi link khôi phục'}
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


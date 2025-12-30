import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  FaUser,
  FaBuilding,
  FaSignOutAlt,
  FaUserGraduate,
  FaLock,
  FaChalkboardTeacher,
  FaListAlt
} from 'react-icons/fa';

const navItems = [
  { path: '/student/change-password', label: 'Đổi mật khẩu', icon: FaLock },
  { path: '/student/register-lecturer', label: 'Đăng ký giảng viên hướng dẫn', icon: FaChalkboardTeacher },
  { path: '/student/register-preferences', label: 'Đăng ký nguyện vọng thực tập', icon: FaListAlt },
];

export const StudentLayout = () => {
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden w-64 flex-shrink-0 bg-white shadow-lg lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-10">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
              SV
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900">Sinh viên</h2>
              {profile && (
                <p className="mt-1 text-sm text-slate-700 truncate">{profile.name || profile.student_code}</p>
              )}
            </div>
          </div>
          {profile && (
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              {profile.major_name && (
                <div className="flex items-center gap-2">
                  <FaBuilding className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{profile.major_name}</span>
                </div>
              )}
              {profile.class_name && (
                <div className="flex items-center gap-2">
                  <FaUserGraduate className="text-slate-400 flex-shrink-0" />
                  <span>Lớp: {profile.class_name}</span>
                </div>
              )}
              {profile.gpa !== null && profile.gpa !== undefined && (
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>GPA: {parseFloat(profile.gpa || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="text-base" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-red-500 hover:border-red-200 hover:bg-red-50 transition"
          >
            <FaSignOutAlt />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 bg-slate-50 lg:ml-64">
        <div className="h-full p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};


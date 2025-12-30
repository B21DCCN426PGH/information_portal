import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  FaTh, 
  FaImage, 
  FaNewspaper, 
  FaCalendarAlt,
  FaBriefcase, 
  FaBuilding, 
  FaUser, 
  FaFlask, 
  FaFileAlt, 
  FaGraduationCap, 
  FaBook,
  FaSignOutAlt,
  FaUserGraduate,
  FaSitemap,
  FaCalendarCheck,
  FaChalkboardTeacher,
  FaCheckCircle,
  FaChartBar,
  FaUserShield
} from 'react-icons/fa';

const navItems = [
  { path: '/admin', label: 'Tổng quan', icon: FaTh },
  { path: '/admin/banners', label: 'Banner', icon: FaImage },
  { path: '/admin/news', label: 'Tin tức', icon: FaNewspaper },
  { path: '/admin/events', label: 'Sự kiện', icon: FaCalendarAlt },
  { path: '/admin/recruitment', label: 'Tuyển dụng', icon: FaBriefcase },
  { path: '/admin/enterprises', label: 'Doanh nghiệp', icon: FaBuilding },
  { path: '/admin/lecturers', label: 'Giảng viên', icon: FaUser },
  { path: '/admin/departments', label: 'Bộ môn', icon: FaSitemap },
  { path: '/admin/research', label: 'Nghiên cứu', icon: FaFlask },
  { path: '/admin/documents', label: 'Tài liệu sinh viên', icon: FaFileAlt },
  { path: '/admin/admissions', label: 'Tuyển sinh', icon: FaGraduationCap },
  { path: '/admin/majors', label: 'Đào tạo', icon: FaBook },
  { path: '/admin/students', label: 'Sinh viên', icon: FaUserGraduate },
  { path: '/admin/internship-periods', label: 'Đợt đăng ký thực tập', icon: FaCalendarCheck },
  { path: '/admin/internship-enterprises', label: 'Doanh nghiệp thực tập', icon: FaBuilding },
  { path: '/admin/internship-lecturers', label: 'Giảng viên hướng dẫn', icon: FaChalkboardTeacher },
  { path: '/admin/internship-preferences', label: 'Duyệt đơn đăng ký', icon: FaCheckCircle },
  { path: '/admin/internship-results', label: 'Kết quả đăng ký thực tập', icon: FaChartBar },
  { path: '/admin/admins', label: 'Quản lý Admin', icon: FaUserShield, superAdminOnly: true },
];

export const AdminLayout = () => {
  const { profile, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden w-64 flex-shrink-0 bg-white shadow-lg lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:z-10">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg">
              IT
            </div>
            <h2 className="text-lg font-bold text-slate-900">Admin Portal</h2>
          </div>
        </div>
        <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
          {navItems
            .filter((item) => !item.superAdminOnly || profile?.role === 'super-admin')
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
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


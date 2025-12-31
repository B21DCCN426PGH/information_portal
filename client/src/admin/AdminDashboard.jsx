import { useEffect, useState } from 'react';
import { fetchDashboardStats } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FaClock, FaUser, FaBuilding, FaBook, FaNewspaper, FaCalendarAlt, FaBriefcase, FaGraduationCap, FaUsers } from 'react-icons/fa';

export const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDashboardStats(token);
        setStats(data);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [token]);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  if (!stats) {
    return <p className="text-slate-500">Đang tải bảng điều khiển...</p>;
  }

  // stats display - Hàng 1: Thống kê chính
  const primaryStats = [
    { 
      label: 'Số đơn đăng ký chưa được duyệt', 
      value: stats.pending_preferences || 0, 
      icon: FaClock, 
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      label: 'Sinh viên', 
      value: stats.total_students || stats.students || 0, 
      icon: FaGraduationCap, 
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    { 
      label: 'Giảng viên', 
      value: stats.total_lecturers || stats.lecturers || 0, 
      icon: FaUser, 
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    { 
      label: 'Doanh nghiệp', 
      value: stats.total_enterprises || stats.enterprises || 0, 
      icon: FaBuilding, 
      color: 'orange',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
  ];

  // stats display - Hàng 2: Thống kê nội dung
  const secondaryStats = [
    { 
      label: 'Chuyên ngành', 
      value: stats.total_majors || stats.majors || 0, 
      icon: FaBook, 
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    { 
      label: 'Tin tức', 
      value: stats.total_news || stats.news || 0, 
      icon: FaNewspaper, 
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    },
    { 
      label: 'Sự kiện', 
      value: stats.total_events || stats.events || 0, 
      icon: FaCalendarAlt, 
      color: 'pink',
      bgColor: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    { 
      label: 'Tuyển dụng', 
      value: stats.total_recruitment || stats.recruitment || 0, 
      icon: FaBriefcase, 
      color: 'teal',
      bgColor: 'bg-teal-100',
      iconColor: 'text-teal-600'
    },
  ];

  const StatCard = ({ stat }) => {
    const Icon = stat.icon;
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
            <Icon className={`text-xl ${stat.iconColor}`} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
        <p className="mt-1 text-sm text-slate-500">Chào mừng trở lại hệ thống quản trị.</p>
      </div>
      
      {/* Hàng 1: Thống kê chính */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {primaryStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Hàng 2: Thống kê nội dung */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Thống kê giảng viên theo bộ môn */}
      {stats.lecturers_by_department && stats.lecturers_by_department.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <FaUsers className="text-lg text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Giảng viên theo bộ môn</h2>
              <p className="text-sm text-slate-500">Thống kê số lượng giảng viên của từng bộ môn</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Bộ môn</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Số giảng viên</th>
                </tr>
              </thead>
              <tbody>
                {stats.lecturers_by_department.map((dept) => (
                  <tr key={dept.id || 'unassigned'} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm text-slate-900">{dept.department_name || 'Chưa phân loại'}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{dept.lecturer_count || 0}</td>
                  </tr>
                ))}
                {stats.lecturers_by_department.length > 0 && (
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <td className="px-4 py-3 text-sm text-slate-900">Tổng cộng</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-900">
                      {stats.lecturers_by_department.reduce((sum, dept) => sum + (dept.lecturer_count || 0), 0)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


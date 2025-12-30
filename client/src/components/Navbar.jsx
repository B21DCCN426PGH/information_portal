import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaBars, FaTimes, FaChevronDown } from 'react-icons/fa';
import { fetchResource } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const links = [
  { path: '/', label: 'Trang chủ' },
  { path: '/recruitment', label: 'Tuyển dụng' },
  { path: '/enterprises', label: 'Doanh nghiệp' },
  { path: '/research', label: 'Nghiên cứu' },
  { path: '/documents', label: 'Tài liệu sinh viên' },
  { path: '/admissions', label: 'Tuyển sinh' },
  { path: '/majors', label: 'Đào tạo' },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [departmentsDropdownOpen, setDepartmentsDropdownOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  
  // Kiểm tra xem có phải là sinh viên đã đăng nhập không
  const isStudentLoggedIn = isAuthenticated && profile && profile.role === 'student';

  const isNewsOrEventsActive = location.pathname === '/news' || location.pathname === '/events';
  const isDepartmentsActive = location.pathname.startsWith('/departments');

  useEffect(() => {
    fetchResource('departments')
      .then(setDepartments)
      .catch((error) => {
        console.error('Error fetching departments:', error);
      });
  }, []);

  const renderLinks = (onClick) =>
    links.map((link) => {
      // Rút ngắn một số label cho màn hình nhỏ hơn
      const getLabel = () => {
        if (link.path === '/documents') return 'Tài liệu';
        return link.label;
      };
      
      return (
        <NavLink
          key={link.path}
          to={link.path}
          onClick={onClick}
          className={({ isActive }) =>
            `px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
              isActive ? 'bg-primary text-white' : 'text-slate-600 hover:text-primary'
            }`
          }
        >
          {getLabel()}
        </NavLink>
      );
    });

  return (
    <header className="sticky top-0 z-50 bg-white shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 lg:px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img 
            src="/logo.png" 
            alt="Logo Khoa Công nghệ Thông tin" 
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className=" px-3 py-1 text-base font-bold text-primary">KHOA CNTT1</span>
        </Link>
        <nav className="hidden flex-1 items-center justify-start lg:flex gap-0.5 ml-4">
          {/* Trang chủ */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                isActive ? 'bg-primary text-white' : 'text-slate-600 hover:text-primary'
              }`
            }
          >
            Trang chủ
          </NavLink>
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <NavLink
              to="/news"
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
                  isNewsOrEventsActive || isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:text-primary'
                }`
              }
            >
              <span className="hidden xl:inline">Tin tức & Sự kiện</span>
              <span className="xl:hidden">Tin & Sự kiện</span>
              <FaChevronDown className="text-xs" />
            </NavLink>
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                <Link
                  to="/news"
                  onClick={() => setDropdownOpen(false)}
                  className={`block px-4 py-2 text-sm font-semibold transition ${
                    location.pathname === '/news'
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tin tức
                </Link>
                <Link
                  to="/events"
                  onClick={() => setDropdownOpen(false)}
                  className={`block px-4 py-2 text-sm font-semibold transition ${
                    location.pathname === '/events'
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Sự kiện
                </Link>
              </div>
            )}
          </div>
          {/* Các links từ Tuyển dụng đến Tuyển sinh */}
          {links
            .filter((link) => link.path !== '/' && link.path !== '/majors')
            .map((link) => {
              const getLabel = () => {
                if (link.path === '/documents') return 'Tài liệu';
                return link.label;
              };
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                      isActive ? 'bg-primary text-white' : 'text-slate-600 hover:text-primary'
                    }`
                  }
                >
                  {getLabel()}
                </NavLink>
              );
            })}
          {/* Dropdown menu for Departments - sau Tuyển sinh */}
          <div
            className="relative"
            onMouseEnter={() => setDepartmentsDropdownOpen(true)}
            onMouseLeave={() => setDepartmentsDropdownOpen(false)}
          >
            <NavLink
              to="/departments"
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${
                  isDepartmentsActive || isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:text-primary'
                }`
              }
            >
              Bộ môn
              <FaChevronDown className="text-xs" />
            </NavLink>
            {departmentsDropdownOpen && departments.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden max-h-96 overflow-y-auto">
                {departments.map((dept) => (
                  <Link
                    key={dept.id}
                    to={`/departments/${dept.id}`}
                    onClick={() => setDepartmentsDropdownOpen(false)}
                    className={`block px-4 py-2 text-sm font-semibold transition ${
                      location.pathname === `/departments/${dept.id}`
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {dept.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* Đào tạo */}
          <NavLink
            to="/majors"
            className={({ isActive }) =>
              `px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap ${
                isActive ? 'bg-primary text-white' : 'text-slate-600 hover:text-primary'
              }`
            }
          >
            Đào tạo
          </NavLink>
        </nav>
        <div className="flex items-center gap-3">
          {/* Nút Đăng ký thực tập */}
          <button
            onClick={() => {
              if (isStudentLoggedIn) {
                navigate('/student/register-lecturer');
              } else {
                navigate('/student/login');
              }
            }}
            className="hidden lg:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-semibold whitespace-nowrap"
          >
            <span>Đăng ký thực tập</span>
          </button>
          <button
            type="button"
            className="text-2xl text-primary lg:hidden"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-100 px-4 pb-4 lg:hidden">
          {/* Trang chủ */}
          <NavLink
            to="/"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-semibold ${
                isActive ? 'bg-primary text-white' : 'text-slate-600 hover:text-primary'
              }`
            }
          >
            Trang chủ
          </NavLink>
          {/* Tin tức & Sự kiện - sau Trang chủ */}
          <Link
            to="/news"
            onClick={() => setOpen(false)}
            className={`px-3 py-2 rounded-md text-sm font-semibold ${
              location.pathname === '/news'
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:text-primary'
            }`}
          >
            Tin tức
          </Link>
          <Link
            to="/events"
            onClick={() => setOpen(false)}
            className={`px-3 py-2 rounded-md text-sm font-semibold ${
              location.pathname === '/events'
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:text-primary'
            }`}
          >
            Sự kiện
          </Link>
          {/* Các links từ Tuyển dụng đến Tuyển sinh */}
          {links
            .filter((link) => link.path !== '/' && link.path !== '/majors')
            .map((link) => {
              const getLabel = () => {
                if (link.path === '/documents') return 'Tài liệu';
                return link.label;
              };
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-semibold ${
                      isActive ? 'bg-primary text-white' : 'text-slate-600 hover:text-primary'
                    }`
                  }
                >
                  {getLabel()}
                </NavLink>
              );
            })}
          {/* Bộ môn - sau Tuyển sinh */}
          <Link
            to="/departments"
            onClick={() => setOpen(false)}
            className={`px-3 py-2 rounded-md text-sm font-semibold ${
              isDepartmentsActive
                ? 'bg-primary text-white'
                : 'text-slate-600 hover:text-primary'
            }`}
          >
            Bộ môn
          </Link>
          {departments.length > 0 && (
            <div className="pl-4 space-y-1">
              {departments.map((dept) => (
                <Link
                  key={dept.id}
                  to={`/departments/${dept.id}`}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm ${
                    location.pathname === `/departments/${dept.id}`
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-600 hover:text-primary'
                  }`}
                >
                  {dept.name}
                </Link>
              ))}
            </div>
          )}
          {/* Đào tạo */}
          <NavLink
            to="/majors"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-semibold ${
                isActive ? 'bg-primary text-white' : 'text-slate-600 hover:text-primary'
              }`
            }
          >
            Đào tạo
          </NavLink>
          {/* Nút Đăng ký thực tập cho mobile */}
          <button
            onClick={() => {
              setOpen(false);
              if (isStudentLoggedIn) {
                navigate('/student/register-lecturer');
              } else {
                navigate('/student/login');
              }
            }}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-semibold text-center"
          >
            Đăng ký thực tập
          </button>
        </nav>
      )}
    </header>
  );
};



import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMajorWithCourses } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { FaClock, FaBook, FaGraduationCap, FaArrowLeft } from 'react-icons/fa';

// Map category to color
const getCategoryColor = (category) => {
  const categoryMap = {
    'General Education': 'bg-blue-500', // Bắt buộc chung
    'Foundation': 'bg-red-500', // Cơ sở ngành
    'Major': 'bg-purple-500', // Chuyên ngành
    'Elective': 'bg-sky-200', // Bắt buộc chuyên ngành (light blue)
    'Internship': 'bg-orange-500', // Thực tập
    'Thesis': 'bg-green-500', // Luận văn tốt nghiệp
    'Professional Education': 'bg-purple-200', // Giáo dục chuyên nghiệp (light purple)
  };
  return categoryMap[category] || 'bg-slate-300';
};

// Map category to Vietnamese label
const getCategoryLabel = (category) => {
  const labelMap = {
    'General Education': 'Bắt buộc chung',
    'Foundation': 'Cơ sở ngành',
    'Major': 'Chuyên ngành',
    'Elective': 'Bắt buộc chuyên ngành',
    'Internship': 'Thực tập',
    'Thesis': 'Luận văn tốt nghiệp',
    'Professional Education': 'Giáo dục chuyên nghiệp',
  };
  return labelMap[category] || category;
};

export const MajorDetail = () => {
  const { id } = useParams();
  const [major, setMajor] = useState(null);

  useEffect(() => {
    fetchMajorWithCourses(id).then(setMajor);
  }, [id]);

  const grouped = useMemo(() => {
    if (!major) return {};
    const semesters = {};
    (major.courses || []).forEach((course) => {
      const sem = course.semester || 1;
      if (!semesters[sem]) {
        semesters[sem] = [];
      }
      semesters[sem].push(course);
    });
    // Sort semesters
    Object.keys(semesters).forEach((sem) => {
      semesters[sem].sort((a, b) => a.code.localeCompare(b.code));
    });
    return semesters;
  }, [major]);

  const totalCredits = useMemo(() => {
    if (!major?.courses) return 0;
    return major.courses.reduce((sum, course) => sum + (course.credits || 0), 0);
  }, [major]);

  if (!major) {
    return <LoadingSpinner label="Đang tải chi tiết chương trình đào tạo" />;
  }

  const degree = major.degree || 'Kỹ sư';

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Link
          to="/majors"
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary transition"
        >
          <FaArrowLeft />
          Quay lại
        </Link>
      </div>

      {/* Major Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FaBook className="text-xl" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{major.name}</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FaClock className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Thời gian đào tạo</p>
              <p className="text-xl font-bold text-slate-900">
                {major.duration_years ? Number(major.duration_years).toFixed(1).replace(/\.0$/, '') : 4} năm
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <FaBook className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tổng số tín chỉ</p>
              <p className="text-xl font-bold text-slate-900">{totalCredits} tín chỉ</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <FaGraduationCap className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Bằng cấp</p>
              <p className="text-xl font-bold text-slate-900">{degree}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {major.description && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">{major.description}</p>
        </div>
      )}

      {/* Curriculum Structure */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Cấu trúc chương trình các chương trình đào tạo
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            (Tiến trình học tập theo học chế tín chỉ)
          </p>
        </div>

        {/* Semesters */}
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([semester, courses]) => (
            <section key={semester} className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Học kỳ {semester}</h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    {/* Colored left border */}
                    <div
                      className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${getCategoryColor(course.category)}`}
                    />
                    {/* Credits */}
                    <p className="mb-2 text-xs font-semibold text-slate-500">
                      {course.credits || 0} tín chỉ
                    </p>
                    {/* Course name */}
                    <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                      {course.name}
                    </h4>
                    {/* Course code (optional, smaller) */}
                    {course.code && (
                      <p className="mt-1 text-xs text-slate-400">{course.code}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
      </div>

      {/* Legend */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Chú thích</h3>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-blue-500" />
            <span className="text-sm text-slate-700">Bắt buộc chung</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-sky-200" />
            <span className="text-sm text-slate-700">Bắt buộc chuyên ngành</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-red-500" />
            <span className="text-sm text-slate-700">Cơ sở ngành</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-orange-500" />
            <span className="text-sm text-slate-700">Thực tập</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-purple-500" />
            <span className="text-sm text-slate-700">Chuyên ngành</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-purple-200" />
            <span className="text-sm text-slate-700">Giáo dục chuyên nghiệp</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-green-500" />
            <span className="text-sm text-slate-700">Luận văn tốt nghiệp</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchResource, fetchResourceById } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PageHero } from '../components/PageHero';

export const DepartmentDetail = () => {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [deptData, deptsData] = await Promise.all([
          fetchResourceById('departments', id),
          fetchResource('departments'),
        ]);
        
        setDepartment(deptData);
        setDepartments(deptsData);
      } catch (error) {
        console.error('Error loading department:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!department) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy bộ môn</p>
        <Link to="/departments" className="text-primary hover:underline mt-4 inline-block">
          Quay lại danh sách bộ môn
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <PageHero
          title="Bộ môn"
          description="Tìm hiểu về các bộ môn và đội ngũ giảng viên trong từng bộ môn."
        />
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar - Danh sách bộ môn */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
                Danh sách bộ môn
              </h3>
              <nav className="space-y-1">
                {departments.map((dept) => (
                  <Link
                    key={dept.id}
                    to={`/departments/${dept.id}`}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                      Number(id) === dept.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {dept.name}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              {/* Title */}
              <h1 className="text-3xl font-bold text-primary mb-8 uppercase">
                {department.name}
              </h1>

              {/* Section 1: Giới thiệu */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Giới thiệu</h2>
                <div className="prose prose-slate max-w-none">
                  {department.description && (
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {department.description}
                    </div>
                  )}

                  {/* Danh sách giảng viên */}
                  {department.lecturers && department.lecturers.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        2. Đội ngũ giảng viên ({department.lecturers.length})
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {department.lecturers.map((lecturer) => (
                          <div
                            key={lecturer.id}
                            className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">
                                  {lecturer.academic_rank || lecturer.academic_degree || 'Giảng viên'}
                                </p>
                                <h4 className="text-base font-semibold text-slate-900 mb-1">
                                  {lecturer.name}
                                </h4>
                                <p className="text-sm text-slate-600 mb-2">
                                  {lecturer.academic_degree || ''} {lecturer.academic_rank ? ` - ${lecturer.academic_rank}` : ' - '}
                                </p>
                                {lecturer.research_direction && (
                                  <p className="text-xs text-slate-600 mb-2">
                                    <span className="font-semibold">Hướng nghiên cứu:</span> {lecturer.research_direction}
                                  </p>
                                )}
                                <p className="text-xs text-slate-500">Email: {lecturer.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};


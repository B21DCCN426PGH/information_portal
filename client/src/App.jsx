import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { NewsEvents } from './pages/NewsEvents';
import { News } from './pages/News';
import { Events } from './pages/Events';
import { Recruitment } from './pages/Recruitment';
import { Enterprises } from './pages/Enterprises';
import { Departments } from './pages/Departments';
import { DepartmentDetail } from './pages/DepartmentDetail';
import { Research } from './pages/Research';
import { StudentDocuments } from './pages/StudentDocuments';
import { Admissions } from './pages/Admissions';
import { Majors } from './pages/Majors';
import { MajorDetail } from './pages/MajorDetail';
import { NotFound } from './pages/NotFound';
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { ProtectedRoute } from './admin/ProtectedRoute';
import { AdminDashboard } from './admin/AdminDashboard';
import { ResourceManager } from './admin/ResourceManager';
import { resourceConfigs } from './admin/resourceConfig';
import { MajorsManager } from './admin/MajorsManager';
import { EnterprisesManager } from './admin/EnterprisesManager';
import { StudentsManager } from './admin/StudentsManager';
import { DepartmentsManager } from './admin/DepartmentsManager';
import { InternshipPeriodsManager } from './admin/InternshipPeriodsManager';
import { InternshipEnterprisesManager } from './admin/InternshipEnterprisesManager';
import { InternshipLecturersManager } from './admin/InternshipLecturersManager';
import { InternshipPreferencesManager } from './admin/InternshipPreferencesManager';
import { InternshipResultsManager } from './admin/InternshipResultsManager';
import { AdminsManager } from './admin/AdminsManager';
import { ChatbotPopup } from './components/ChatbotPopup';
import { StudentLogin } from './pages/StudentLogin';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { StudentProtectedRoute } from './components/StudentProtectedRoute';
import { Navigate } from 'react-router-dom';
import { StudentLayout } from './student/StudentLayout';
import { ChangePassword } from './student/ChangePassword';
import { RegisterLecturer } from './student/RegisterLecturer';
import { RegisterPreferences } from './student/RegisterPreferences';

const publicRoutes = (
  <>
    <Route path="/" element={<Home />} />
    <Route path="/news-events" element={<NewsEvents />} />
    <Route path="/news" element={<News />} />
    <Route path="/events" element={<Events />} />
    <Route path="/recruitment" element={<Recruitment />} />
    <Route path="/enterprises" element={<Enterprises />} />
    <Route path="/departments" element={<Departments />} />
    <Route path="/departments/:id" element={<DepartmentDetail />} />
    <Route path="/research" element={<Research />} />
    <Route path="/documents" element={<StudentDocuments />} />
    <Route path="/student-documents" element={<StudentDocuments />} />
    <Route path="/admissions" element={<Admissions />} />
    <Route path="/majors" element={<Majors />} />
    <Route path="/majors/:id" element={<MajorDetail />} />
    <Route path="/student/login" element={<StudentLogin />} />
    <Route path="/student/forgot-password" element={<ForgotPassword />} />
    <Route path="/student/reset-password" element={<ResetPassword />} />
  </>
);

const adminRoutes = (
  <Route
    path="/admin"
    element={
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    <Route index element={<AdminDashboard />} />
    <Route path="banners" element={<ResourceManager config={resourceConfigs.banners} />} />
    <Route path="news" element={<ResourceManager config={resourceConfigs.news} />} />
    <Route path="events" element={<ResourceManager config={resourceConfigs.events} />} />
    <Route path="recruitment" element={<ResourceManager config={resourceConfigs.recruitment} />} />
    <Route path="enterprises" element={<EnterprisesManager />} />
    <Route path="lecturers" element={<ResourceManager config={resourceConfigs.lecturers} />} />
    <Route path="departments" element={<DepartmentsManager />} />
    <Route path="research" element={<ResourceManager config={resourceConfigs.research} />} />
    <Route path="documents" element={<ResourceManager config={resourceConfigs.documents} />} />
    <Route path="admissions" element={<ResourceManager config={resourceConfigs.admissions} />} />
    <Route path="majors" element={<MajorsManager />} />
    <Route path="students" element={<StudentsManager />} />
    <Route path="internship-periods" element={<InternshipPeriodsManager />} />
    <Route path="internship-enterprises" element={<InternshipEnterprisesManager />} />
    <Route path="internship-lecturers" element={<InternshipLecturersManager />} />
    <Route path="internship-preferences" element={<InternshipPreferencesManager />} />
    <Route path="internship-results" element={<InternshipResultsManager />} />
    <Route path="admins" element={<AdminsManager />} />
  </Route>
);

const studentRoutes = (
  <Route
    path="/student"
    element={
      <StudentProtectedRoute>
        <StudentLayout />
      </StudentProtectedRoute>
    }
  >
    <Route index element={<Navigate to="/student/change-password" replace />} />
    <Route path="change-password" element={<ChangePassword />} />
    <Route path="register-lecturer" element={<RegisterLecturer />} />
    <Route path="register-preferences" element={<RegisterPreferences />} />
  </Route>
);

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isStudentRoute = location.pathname.startsWith('/student') && 
    location.pathname !== '/student/login' && 
    location.pathname !== '/student/forgot-password' && 
    location.pathname !== '/student/reset-password';
  const isLoginPage = location.pathname === '/student/login' || 
    location.pathname === '/admin/login' ||
    location.pathname === '/student/forgot-password' ||
    location.pathname === '/student/reset-password';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {!isAdminRoute && !isStudentRoute && !isLoginPage && <Navbar />}
      <main className={isAdminRoute || isStudentRoute ? '' : ''}>
        <Routes>
          {publicRoutes}
          {adminRoutes}
          {studentRoutes}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && !isStudentRoute && !isLoginPage && <Footer />}
      {!isAdminRoute && !isStudentRoute && !isLoginPage && <ChatbotPopup />}
    </div>
  );
};

export default App;

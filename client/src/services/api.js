import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor request để thêm token từ localStorage
apiClient.interceptors.request.use(
  (config) => {
    // Thử token admin trước, sau đó token sinh viên
    const adminToken = localStorage.getItem('admin_token');
    const studentToken = localStorage.getItem('student_token');
    const token = adminToken || studentToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor response để xử lý lỗi 401 (token hết hạn/không hợp lệ)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi 401 Không được phép
    if (error.response?.status === 401) {
      // Xóa tất cả token khỏi localStorage
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_profile');
      localStorage.removeItem('student_token');
      localStorage.removeItem('student_profile');
      
      // Gửi sự kiện tùy chỉnh để kích hoạt logout trong AuthContext
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      // Chuyển hướng đến trang đăng nhập phù hợp dựa trên route hiện tại
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') && currentPath !== '/admin/login') {
        window.location.href = '/admin/login';
      } else if (currentPath.startsWith('/student') && currentPath !== '/student/login') {
        window.location.href = '/student/login';
      }
    }
    return Promise.reject(error);
  }
);

const withAuth = (token) => {
  // Nếu token được cung cấp, sử dụng nó; nếu không interceptor sẽ lấy từ localStorage
  if (!token) {
    // Không đặt header Authorization, để interceptor xử lý
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const request = async (config) => {
  try {
    // Nếu token được cung cấp trong headers, sử dụng nó; nếu không interceptor sẽ thêm từ localStorage
    const headers = {
      ...config.headers,
    };
    
    // Nếu header Authorization được cung cấp, đảm bảo nó được thiết lập
    if (config.headers?.Authorization) {
      headers.Authorization = config.headers.Authorization;
    }
    
    const response = await apiClient({
      ...config,
      headers,
    });
    return response.data;
  } catch (error) {
    let message = 'Unable to process the request';
    
    if (error.response?.data) {
      const data = error.response.data;
      // Nếu có message string, dùng nó
      if (typeof data.message === 'string') {
        message = data.message;
      } 
      // Nếu có errors array (lỗi validation), định dạng chúng
      else if (Array.isArray(data.errors) && data.errors.length > 0) {
        message = data.errors.map(err => err.msg || err).join('\n');
      }
      // Nếu data là object khác, thử lấy message hoặc stringify
      else if (typeof data === 'object') {
        message = data.message || JSON.stringify(data);
      }
      // Nếu data là string, dùng trực tiếp
      else if (typeof data === 'string') {
        message = data;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    throw new Error(message);
  }
};

export const fetchHomeData = () => request({ url: '/home' });
export const fetchDashboardStats = (token) =>
  request({ url: '/dashboard/stats', headers: withAuth(token) });

export const fetchResource = (resource, params = {}) =>
  request({ url: `/${resource}`, params });

export const fetchResourceById = (resource, id) =>
  request({ url: `/${resource}/${id}` });

export const createResource = (resource, data, token) =>
  request({
    method: 'POST',
    url: `/${resource}`,
    data,
    headers: withAuth(token),
  });

export const updateResource = (resource, id, data, token) =>
  request({
    method: 'PUT',
    url: `/${resource}/${id}`,
    data,
    headers: withAuth(token),
  });

export const deleteResource = (resource, id, token) =>
  request({
    method: 'DELETE',
    url: `/${resource}/${id}`,
    headers: withAuth(token),
  });

export const deleteStudentsBulk = (ids, token) => {
  // Sử dụng POST thay vì DELETE vì một số server không chấp nhận body trong DELETE
  return request({
    method: 'POST',
    url: '/students/bulk-delete',
    data: { ids },
    headers: withAuth(token),
  });
};

export const loginAdmin = (credentials) =>
  request({
    method: 'POST',
    url: '/auth/login',
    data: credentials,
  });

// API quản lý Admin (chỉ super-admin)
export const fetchAdmins = (token) =>
  request({ url: '/auth/admins', headers: withAuth(token) });

export const createAdmin = (adminData, token) =>
  request({
    method: 'POST',
    url: '/auth/create-admin',
    data: adminData,
    headers: withAuth(token),
  });

export const deleteAdmin = (adminId, token) =>
  request({
    method: 'DELETE',
    url: `/auth/admins/${adminId}`,
    headers: withAuth(token),
  });

export const fetchMajorWithCourses = (id) =>
  request({ url: `/majors/${id}` });

export const createCourse = (majorId, data, token) =>
  request({
    method: 'POST',
    url: `/majors/${majorId}/courses`,
    data,
    headers: withAuth(token),
  });

export const updateCourse = (majorId, courseId, data, token) =>
  request({
    method: 'PUT',
    url: `/majors/${majorId}/courses/${courseId}`,
    data,
    headers: withAuth(token),
  });

export const deleteCourse = (majorId, courseId, token) =>
  request({
    method: 'DELETE',
    url: `/majors/${majorId}/courses/${courseId}`,
    headers: withAuth(token),
  });

// Tải template Excel cho môn học
export const downloadCoursesTemplate = (majorId, token) => {
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'blob',
  });
  return apiClient.get(`/majors/${majorId}/courses/template`);
};

// Import môn học từ Excel
export const importCoursesFromExcel = async (file, majorId, token) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await apiClient.post(`/majors/${majorId}/courses/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data;
  } catch (error) {
    let message = 'Không thể xử lý yêu cầu';
    
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data.message === 'string') {
        message = data.message;
      } else if (typeof data.error === 'string') {
        message = data.error;
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        message = data.errors.map(err => err.msg || err).join('\n');
      } else if (typeof data === 'object') {
        message = data.message || JSON.stringify(data);
      } else if (typeof data === 'string') {
        message = data;
      }
    }
    
    throw new Error(message);
  }
};

// Xác thực sinh viên
export const registerStudent = (data) =>
  request({
    method: 'POST',
    url: '/students/register',
    data,
  });

export const loginStudent = (credentials) =>
  request({
    method: 'POST',
    url: '/students/login',
    data: credentials,
  });

export const getStudentProfile = () => request({ url: '/students/profile' });
export const changeStudentPassword = (data) =>
  request({
    method: 'PUT',
    url: '/students/change-password',
    data,
  });
export const forgotPassword = (data) =>
  request({
    method: 'POST',
    url: '/students/forgot-password',
    data,
  });
export const resetPassword = (data) =>
  request({
    method: 'POST',
    url: '/students/reset-password',
    data,
  });

// Import sinh viên từ Excel
export const downloadStudentsTemplate = (token) => {
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'blob',
  });
  return apiClient.get('/students/template');
};

export const importStudentsFromExcel = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await apiClient.post('/students/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data;
  } catch (error) {
    let message = 'Không thể xử lý yêu cầu';
    
    if (error.response?.data) {
      const data = error.response.data;
      // Nếu có message string, dùng nó
      if (typeof data.message === 'string') {
        message = data.message;
      } 
      // Nếu có errors array (lỗi validation), định dạng chúng
      else if (Array.isArray(data.errors) && data.errors.length > 0) {
        message = data.errors.map(err => err.msg || err).join('\n');
      }
      // Nếu data là object khác, thử lấy message hoặc stringify
      else if (typeof data === 'object') {
        message = data.message || JSON.stringify(data);
      }
      // Nếu data là string, dùng trực tiếp
      else if (typeof data === 'string') {
        message = data;
      }
    } else if (error.message) {
      message = error.message;
    }
    
    throw new Error(message);
  }
};

// API Đăng ký thực tập

// Đợt thực tập
export const getInternshipPeriods = () => request({ url: '/internship-periods' });
export const getActiveInternshipPeriod = () => request({ url: '/internship-periods/active' });
export const getInternshipPeriod = (id) => request({ url: `/internship-periods/${id}` });
export const createInternshipPeriod = (data, token) =>
  request({ method: 'POST', url: '/internship-periods', data, headers: withAuth(token) });
export const updateInternshipPeriod = (id, data, token) =>
  request({ method: 'PUT', url: `/internship-periods/${id}`, data, headers: withAuth(token) });
export const deleteInternshipPeriod = (id, token) =>
  request({ method: 'DELETE', url: `/internship-periods/${id}`, headers: withAuth(token) });

// Doanh nghiệp theo đợt
export const getPeriodEnterprises = (params = {}) =>
  request({ url: '/period-enterprises', params });
export const getPeriodEnterprise = (id) => request({ url: `/period-enterprises/${id}` });
export const createPeriodEnterprise = (data, token) =>
  request({ method: 'POST', url: '/period-enterprises', data, headers: withAuth(token) });
export const updatePeriodEnterprise = (id, data, token) =>
  request({ method: 'PUT', url: `/period-enterprises/${id}`, data, headers: withAuth(token) });
export const deletePeriodEnterprise = (id, token) =>
  request({ method: 'DELETE', url: `/period-enterprises/${id}`, headers: withAuth(token) });
export const bulkDeletePeriodEnterprises = (ids, token) =>
  request({ method: 'POST', url: '/period-enterprises/bulk-delete', data: { ids }, headers: withAuth(token) });
export const downloadPeriodEnterprisesTemplate = (token) => {
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: 'blob',
  });
  return apiClient.get('/period-enterprises/template');
};
export const importPeriodEnterprises = (file, period_id, token) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('period_id', period_id);
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return apiClient.post('/period-enterprises/import', formData);
};

// Giảng viên thực tập
export const getInternshipLecturers = (params) =>
  request({ url: '/internship-lecturers', params });
export const getAvailableInternshipLecturers = (period_id) =>
  request({ url: '/internship-lecturers/available', params: { period_id } });
export const updateLecturerPeriod = (data, token) =>
  request({ method: 'POST', url: '/internship-lecturers', data, headers: withAuth(token) });
export const batchUpdateLecturerPeriods = (data, token) =>
  request({ method: 'PUT', url: '/internship-lecturers/batch', data, headers: withAuth(token) });

// Đăng ký của sinh viên
export const getMyLecturerRegistration = (period_id) =>
  request({ url: '/internship-registrations/my-lecturer', params: { period_id } });
export const registerLecturer = (data) =>
  request({ method: 'POST', url: '/internship-registrations/lecturer', data });
export const getMyPreferences = (period_id) =>
  request({ url: '/internship-registrations/my-preferences', params: { period_id } });
export const registerPreferences = (data) =>
  request({ method: 'POST', url: '/internship-registrations/preferences', data });

export const approveStudentToAcademy = (data, token) =>
  request({ method: 'POST', url: '/internship-registrations/approve-to-academy', data, headers: withAuth(token) });

// Admin - Tất cả đăng ký
export const getAllRegistrations = (type, period_id, token) =>
  request({ url: '/internship-registrations/all', params: { type, period_id }, headers: withAuth(token) });
export const updateLecturerRegistrationStatus = (id, data, token) =>
  request({ method: 'PUT', url: `/internship-registrations/lecturer/${id}/status`, data, headers: withAuth(token) });
export const updatePreferenceStatus = (id, data, token) =>
  request({ method: 'PUT', url: `/internship-registrations/preference/${id}/status`, data, headers: withAuth(token) });

// Admin - Kết quả thực tập
export const getInternshipResults = (params, token) =>
  request({ url: '/internship-registrations/results', params, headers: withAuth(token) });

export const exportInternshipResults = async (params, token) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  const url = `${apiBaseUrl}/internship-registrations/results/export?${new URLSearchParams(params).toString()}`;
  
  const adminToken = localStorage.getItem('admin_token');
  const studentToken = localStorage.getItem('student_token');
  const authToken = token || adminToken || studentToken;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Lỗi khi xuất file Excel');
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  let fileName = 'Danh_sach_sinh_vien.xlsx';
  
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (fileNameMatch && fileNameMatch[1]) {
      fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''));
    }
  }

  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

export default apiClient;



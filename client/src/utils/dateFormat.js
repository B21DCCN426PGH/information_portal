/**
 * Định dạng ngày thành DD/MM/YYYY
 * @param {string|Date} date - Chuỗi ngày hoặc đối tượng Date
 * @returns {string} Chuỗi ngày đã định dạng (DD/MM/YYYY) hoặc '-' nếu không hợp lệ
 */
export const formatDate = (date) => {
  if (!date) return '-';
  
  try {
    // Nếu là chuỗi, thử phân tích trực tiếp mà không dùng đối tượng Date để tránh vấn đề múi giờ
    if (typeof date === 'string') {
      // Xử lý định dạng chuỗi ISO (ví dụ: "2001-07-23T17:00:00.000Z" hoặc "2001-07-23T17:00:00")
      if (date.includes('T')) {
        // Trích xuất chỉ phần ngày trước 'T' để tránh vấn đề múi giờ
        const datePart = date.split('T')[0];
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      }
      // Xử lý định dạng chuỗi ngày (ví dụ: "2001-07-23" hoặc "2003-05-12")
      else if (date.match(/^\d{4}-\d{2}-\d{2}/)) {
        // Trích xuất phần ngày (xử lý các trường hợp có thời gian như "2003-05-12 00:00:00")
        const datePart = date.split(' ')[0];
        const [year, month, day] = datePart.split('-');
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      }
      // Xử lý định dạng DD/MM/YYYY (đã đúng định dạng, chỉ cần trả về như vậy)
      else if (date.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/)) {
        return date.replace(/-/g, '/');
      }
    }
    
    // Nếu là đối tượng Date hoặc cần phân tích nó
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else {
      dateObj = new Date(date);
    }
    
    // Nếu có đối tượng Date hợp lệ, định dạng nó bằng các phương thức ngày địa phương
    if (dateObj && !isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    return '-';
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return '-';
  }
};


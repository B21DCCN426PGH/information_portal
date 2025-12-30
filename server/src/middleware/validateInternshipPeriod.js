// Middleware để validate đợt đăng ký thực tập
// Đảm bảo thời gian kết thúc phải sau thời gian bắt đầu

const validateInternshipPeriod = (req, res, next) => {
  const { start_date, end_date } = req.body;

  // Chỉ validate nếu có cả 2 trường
  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Ngày tháng không hợp lệ',
      });
    }

    if (end <= start) {
      return res.status(400).json({
        error: 'Thời gian kết thúc đăng ký phải sau thời gian bắt đầu',
      });
    }
  }

  next();
};

module.exports = validateInternshipPeriod;


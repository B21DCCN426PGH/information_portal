# Các cột được phép trả về cho từng bảng

TABLE_WHITELIST = {
    "lecturers": [ "research_direction, name, email, academic_degree,academic_rank, department_id"],
    "student_documents": ["title", "category", "description"],
    "news": ["title", "summary", "content"],
    "events": ["title", "description", "event_date","location"],
    "faq": ["question", "answer"],
    "period_enterprises": ["name", "job_description", "address"],
    "enterprises": ["name","industry", "description"],
    "majors": ["name", "description", "degree", "duration_years"],
    "courses": ["name", "description", "credits", "semester", "category"],
    "departments": ["name", "description"],
    "chatbot_courses": ["course_code", "course_name", "lecturers"]
}

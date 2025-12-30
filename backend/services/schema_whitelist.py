# Các cột được phép trả về cho từng bảng

TABLE_WHITELIST = {
    "lecturers": [ "research_direction, name, email, phone,academic_degree,academic_rank"],
    "student_documents": ["title", "category", "description"],
    "news": ["title", "summary", "content"],
    "events": ["title", "description", "event_date","location"],
    "faq": ["question", "answer"],
    "period_enterprises": ["name", "job_description", "address"],
    "enterprises": ["name","industry", "description"]
}

TABLE_KEYWORDS = {
    "lecturers": ["giảng viên"],
    "faq": ["hỏi", "là gì", "như thế nào"],
    "news": ["thông báo", "tin tức", "sự kiện"],
    "events": ["thông báo", "sự kiện"],
    "student_documents": ["tài liệu"],
    "period_enterprises": ["doanh nghiệp", "thực tập"],
    "enterprises": ["doanh nghiệp", "hợp tác"]
}

def detect_tables(message):
    tables = []

    if "như thế nào" in message:
        tables.append("faq")

    if "giảng viên" in message:
        tables.append("lecturers")

    if "tin tức" in message:
        tables.append("news")

    if "sự kiện" in message:
        tables.append("events")

    if "doanh nghiệp" in message:
        tables.append("period_enterprises")
        tables.append("enterprises")

    if "tài liệu" in message:
        tables.append("student_documents")

    return list(set(tables))


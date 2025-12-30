from services.schema_whitelist import TABLE_WHITELIST
from services.keyword_analyzer import detect_tables
from services.gemini_service import ask_gemini
from db import get_db

ROLE_ACCESS = {
    "admin": ["students", "lecturers", "news"],
    "student": ["students", "lecturers", "news"],
    "guest": ["lecturers", "news"]
}


def query_students(student_code):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT * FROM students WHERE student_code=%s",
        (student_code,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row


def query_table(table):
    if table not in TABLE_WHITELIST:
        return None

    cols = ", ".join(TABLE_WHITELIST[table])
    sql = f"SELECT {cols} FROM {table} LIMIT 5"

    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(sql)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return rows


def process_chat(message, user):
    try:
        student_code = user.get("student_code")  # guest vẫn có mã
        role = user.get("role", "guest")

        # 1. Phân tích bảng cần truy vấn (có thể nhiều bảng)
        tables = detect_tables(message)
        db_data = {}

        for table in tables:
            if table in ROLE_ACCESS.get(role, []):
                if table == "students" and role == "student":
                    db_data["students"] = query_students(student_code)
                else:
                    db_data[table] = query_table(table)

        # 2. Gọi Gemini (LUÔN GỌI)
        reply = ask_gemini(
            message=message,
            history=[],  # Không sử dụng lịch sử chat nữa
            db_data=db_data,
            role=role
        )

        return reply if reply else "Xin lỗi, tôi không thể tạo phản hồi. Vui lòng thử lại."
    except Exception as e:
        print(f"[process_chat] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return f"Xin lỗi, đã xảy ra lỗi khi xử lý: {str(e)}"

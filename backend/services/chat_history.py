# from db import get_db

# def save_history(student_code, message, response):
#     conn = get_db()
#     cur = conn.cursor()
#     cur.execute(
#         """
#         INSERT INTO history (student_code, message, response)
#         VALUES (%s, %s, %s)
#         """,
#         (student_code, message, response)
#     )
#     conn.commit()
#     cur.close()
#     conn.close()


# def get_history(student_code, limit=5):
#     conn = get_db()
#     cur = conn.cursor(dictionary=True)
#     cur.execute(
#         """
#         SELECT message, response
#         FROM chat_history
#         WHERE student_code = %s
#         ORDER BY id DESC
#         LIMIT %s
#         """,
#         (student_code, limit)
#     )
#     rows = cur.fetchall()
#     cur.close()
#     conn.close()

#     # đảo lại để đúng thứ tự hội thoại
#     return list(reversed(rows))

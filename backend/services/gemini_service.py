import google.generativeai as genai

genai.configure(api_key="API_KEY_HERE")

model = genai.GenerativeModel("gemini-2.5-flash")


def ask_gemini(message, history, db_data, role):
    prompt = f"""
Bạn là chatbot hỗ trợ sinh viên khoa.
Vai trò người hỏi: {role}

=== LỊCH SỬ HỘI THOẠI ===
"""

    for h in history:
        prompt += f"User: {h['message']}\nBot: {h['response']}\n"

    prompt += "\n=== DỮ LIỆU TỪ DATABASE ===\n"
    prompt += str(db_data)

    prompt += f"\n\n=== CÂU HỎI HIỆN TẠI ===\n{message}"

    response = model.generate_content(prompt)
    return response.text.strip()
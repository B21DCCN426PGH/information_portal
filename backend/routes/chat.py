from flask import Blueprint, request, jsonify
from services.chat_service import process_chat
from services.auth_service import verify_token
import traceback

chat_bp = Blueprint("chat", __name__)

@chat_bp.route("/chat", methods=["POST", "GET"])
def chat():
    if request.method == "GET":
        return {"status": "API OK"}
    
    try:
        token = request.headers.get("Authorization")
        user = verify_token(token) if token else {"role": "guest"}

        if not request.json or "message" not in request.json:
            return jsonify({"reply": "Xin lỗi, vui lòng nhập tin nhắn."}), 400

        message = request.json["message"]
        print(f"[Chat] Received message: {message}")
        print(f"[Chat] User: {user}")
        
        reply = process_chat(message, user)
        print(f"[Chat] Reply: {reply[:100] if reply else 'None'}...")
        
        if not reply:
            reply = "Xin lỗi, tôi không thể xử lý câu hỏi này. Vui lòng thử lại."

        return jsonify({"reply": reply})
    except Exception as e:
        print(f"[Chat] Error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            "reply": f"Xin lỗi, đã xảy ra lỗi: {str(e)}"
        }), 500

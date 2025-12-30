import { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';

// Hàm format text từ chatbot response
const formatChatbotResponse = (text) => {
  if (!text) return '';
  
  // Tách text thành các dòng
  const lines = text.split('\n');
  const formattedLines = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Bỏ qua dòng trống
    if (!trimmedLine) {
      formattedLines.push(<br key={`br-${index}`} />);
      return;
    }
    
    // Xử lý tiêu đề số (1., 2., 3., ...)
    if (/^\d+\.\s+/.test(trimmedLine)) {
      const content = trimmedLine.replace(/^\d+\.\s+/, '');
      // Format inline text trong tiêu đề
      const formattedContent = content.includes('**')
        ? content.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIndex} className="text-slate-900 font-semibold">{part.replace(/\*\*/g, '')}</strong>;
            }
            return <span key={partIndex}>{part}</span>;
          })
        : content;
      
      formattedLines.push(
        <div key={`heading-${index}`} className="mt-4 mb-2 first:mt-0">
          <strong className="text-slate-900 font-semibold text-base">{formattedContent}</strong>
        </div>
      );
      return;
    }
    
    // Xử lý tiêu đề in đậm standalone (**text**)
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
      const content = trimmedLine.replace(/\*\*/g, '');
      formattedLines.push(
        <div key={`bold-heading-${index}`} className="mt-3 mb-2">
          <strong className="text-slate-900 font-semibold">{content}</strong>
        </div>
      );
      return;
    }
    
    // Xử lý bullet points (-, •, *)
    if (/^[-•*]\s+/.test(trimmedLine)) {
      const content = trimmedLine.replace(/^[-•*]\s+/, '');
      // Format inline text trong bullet points
      const formattedContent = content.includes('**')
        ? content.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIndex} className="text-slate-900 font-semibold">{part.replace(/\*\*/g, '')}</strong>;
            }
            return <span key={partIndex}>{part}</span>;
          })
        : content;
      
      formattedLines.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 ml-1 mb-1">
          <span className="text-primary mt-1.5 flex-shrink-0">•</span>
          <span className="flex-1 leading-relaxed">{formattedContent}</span>
        </div>
      );
      return;
    }
    
    // Xử lý text in đậm (**text**)
    if (trimmedLine.includes('**')) {
      const parts = trimmedLine.split(/(\*\*.*?\*\*)/g);
      formattedLines.push(
        <p key={`bold-${index}`} className="mb-2">
          {parts.map((part, partIndex) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIndex} className="text-slate-900 font-semibold">{part.replace(/\*\*/g, '')}</strong>;
            }
            return <span key={partIndex}>{part}</span>;
          })}
        </p>
      );
      return;
    }
    
    // Xử lý đoạn văn thông thường
    formattedLines.push(
      <p key={`para-${index}`} className="mb-2 leading-relaxed">
        {trimmedLine}
      </p>
    );
  });
  
  return <div className="space-y-0">{formattedLines}</div>;
};

export const ChatbotPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // LẤY HOẶC TẠO student_code
  const getStudentCode = () => {
    let code = localStorage.getItem('student_code');
    if (!code) {
      code = 'guest_' + Date.now();
      localStorage.setItem('student_code', code);
    }
    return code;
  };

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  // GỬI TIN NHẮN
  const send = async () => {
    if (!message.trim() || isLoading) return;

    const msg = message.trim();
    const studentCode = getStudentCode();

    // Thêm tin nhắn của user vào chat
    setChat(prev => [...prev, { q: msg, a: null, isUser: true }]);
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          student_code: studentCode
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log('Chatbot response:', data);

      // Kiểm tra response có reply không
      const reply = data.reply || data.message || data.response || 'Không nhận được phản hồi từ chatbot.';

      // Cập nhật tin nhắn với câu trả lời
      setChat(prev => {
        const newChat = [...prev];
        const lastIndex = newChat.length - 1;
        if (newChat[lastIndex] && newChat[lastIndex].q === msg) {
          newChat[lastIndex] = { q: msg, a: reply, isUser: true };
        }
        return newChat;
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Hiển thị lỗi nếu không kết nối được
      setChat(prev => {
        const newChat = [...prev];
        const lastIndex = newChat.length - 1;
        if (newChat[lastIndex] && newChat[lastIndex].q === msg) {
          newChat[lastIndex] = { 
            q: msg, 
            a: `Xin lỗi, không thể kết nối với chatbot. ${error.message || 'Vui lòng thử lại sau.'}`, 
            isUser: true 
          };
        }
        return newChat;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:scale-110 hover:shadow-xl"
        aria-label="Mở chatbot"
      >
        <FaRobot className="text-2xl" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary-dark px-4 py-3 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <FaRobot className="text-xl text-white" />
          <div>
            <h3 className="text-base font-semibold text-white">Trợ lý ảo CNTT</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-white/80 transition"
          aria-label="Đóng chatbot"
        >
          <FaTimes className="text-lg" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="h-96 overflow-y-auto p-4 bg-slate-50">
        <div className="space-y-4">
          {/* Tin nhắn chào mừng */}
          {chat.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <FaRobot className="text-primary" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-white px-4 py-3 shadow-sm">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Xin chào! Tôi là trợ lý ảo của Khoa CNTT. Tôi có thể giúp gì cho bạn?
                </p>
              </div>
            </div>
          )}

          {/* Hiển thị các tin nhắn */}
          {chat.map((c, i) => (
            <div key={i} className="space-y-2">
              {/* Tin nhắn của user */}
              <div className="flex items-start gap-3 justify-end">
                <div className="rounded-2xl rounded-tr-none bg-primary px-4 py-2 shadow-sm max-w-[80%]">
                  <p className="text-sm text-white">{c.q}</p>
                </div>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Bạn</span>
                </div>
              </div>

              {/* Tin nhắn của bot */}
              {c.a && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FaRobot className="text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-white px-4 py-3 shadow-sm max-w-[80%]">
                    <div className="text-sm text-slate-700 leading-relaxed">
                      {formatChatbotResponse(c.a)}
                    </div>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {!c.a && c.isUser && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FaRobot className="text-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-white px-4 py-2 shadow-sm">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && message.trim() && !isLoading) {
                send();
              }
            }}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={send}
            disabled={!message.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Gửi tin nhắn"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  HelpCircle, 
  BookOpen, 
  Flame, 
  RotateCcw,
  MessageSquare,
  Copy,
  Check
} from 'lucide-react';
import { ClanInfo, ClanMember } from '../types';

interface AiClanAssistantProps {
  clanInfo: ClanInfo;
  members: ClanMember[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiClanAssistant: React.FC<AiClanAssistantProps> = ({
  clanInfo,
  members,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Kính chào quý bà con cô bác và con cháu dòng họ ${clanInfo.clanSurname}! Con là Trợ Lý Gia Tộc AI thông thái. Con có thể hỗ trợ tra cứu quan hệ xưng hô trong họ, giải thích tôn ti trật tự theo thế thứ, soạn thảo văn khấn giỗ chạp, lời hiệu triệu dòng tộc và phong tục thờ cúng gia tiên. Quý vị cần con hỗ trợ việc chi ạ?`,
      timestamp: 'Vừa xong'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sampleQuestions = [
    `Tôi là con ông Lê Khắc Tuấn (Đời 5), tôi gọi ông Lê Khắc Trí (Đời 3) bằng gì?`,
    `Soạn bài văn khấn cúng giỗ cụ Thủy Tổ ${clanInfo.ancestorName} trang trọng.`,
    `Ý nghĩa truyền thống của câu khẩu hiệu: "${clanInfo.subTitle}"`,
    `Hướng dẫn thứ tự thắp hương và dâng lễ tại Từ Đường họ ${clanInfo.clanSurname}.`
  ];

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/clan-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          clanName: clanInfo.name,
          contextData: {
            ancestor: clanInfo.ancestorName,
            leader: clanInfo.contactLeaderName,
            totalMembers: members.length,
            sampleMembers: members.slice(0, 10).map(m => ({
              name: m.fullName,
              gen: m.generation,
              branch: m.branch
            }))
          }
        })
      });

      if (!res.ok) {
        throw new Error('Lỗi máy chủ');
      }

      const data = await res.json();
      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.reply || 'Không có phản hồi từ máy chủ.',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (err: any) {
      // Fallback local smart response
      let fallbackText = `Chào bạn! Về câu hỏi "${textToSend}":\n\nTrong phong tục dòng họ Việt Nam:\n- Cách xưng hô căn cứ vào "Thế thứ" (số đời) chứ không căn cứ vào tuổi tác lớn hay nhỏ ("Bé bằng củ khoai, cứ vai mà gọi").\n- Bậc trên cùng thế hệ với ông nội thì gọi là "Ông Bá" (nếu là anh của ông nội), "Ông Chú" (nếu là em trai của ông nội), "Bà Cô" (nếu là chị em gái của ông nội).\n- Bậc trên hơn 2 thế hệ gọi là Cụ (Cố), hơn 3 thế hệ gọi là Cụ Tổ / Tiên linh.`;
      
      if (textToSend.toLowerCase().includes('văn khấn')) {
        fallbackText = `Nam mô A Di Đà Phật! (3 lần)\nKính lạy Tiên linh Cụ Thủy Tổ ${clanInfo.ancestorName} và Tiên nhân Liệt vị họ ${clanInfo.clanSurname}.\n\nHôm nay là ngày lành tháng tốt, con cháu dòng họ tụ hội trước linh sàng Từ Đường dâng nén tâm hương, mâm lễ bạc kính cẩn báo công và cầu xin tiên tổ độ trì cho toàn tộc an khang thịnh vượng, con cháu hiếu thảo đỗ đạt.`;
      }

      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-16">
      
      {/* Header */}
      <div className="bg-[#24140e] text-amber-50 border-b border-amber-900/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-red-800 text-amber-100 flex items-center justify-center shadow-lg border border-amber-400/50">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 font-serif-clan">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trợ Lý Thông Thái & Cố Vấn Tộc Ước</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-clan text-white mt-0.5">
              Trợ Lý AI Phả Hệ Gia Tộc
            </h1>
            <p className="text-xs text-stone-300">
              Giải đáp quan hệ họ hàng, vai vế xưng hô, văn khấn giỗ chạp và phong tục truyền thống.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Sample Questions Prompts */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>Câu hỏi gợi ý nhanh (Click để hỏi ngay):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-left p-2.5 rounded-xl bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-900 border border-stone-200 hover:border-amber-300 text-xs transition-colors flex items-center justify-between group"
              >
                <span className="truncate">{q}</span>
                <span className="text-stone-400 group-hover:text-amber-700 font-bold ml-2">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Box Container */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden flex flex-col h-[520px]">
          
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/50">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  {isAi && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-700 to-red-800 text-amber-100 flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm relative group ${
                    isAi
                      ? 'bg-white border border-stone-200 text-stone-800 font-serif-clan'
                      : 'bg-amber-800 text-white font-medium'
                  }`}>
                    <div className="whitespace-pre-wrap">
                      {msg.text}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                      <span>{msg.timestamp}</span>
                      {isAi && (
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          className="hover:text-amber-800 flex items-center gap-1"
                          title="Sao chép câu trả lời"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === msg.id ? 'Đã chép' : 'Sao chép'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {!isAi && (
                    <div className="w-9 h-9 rounded-xl bg-stone-800 text-amber-300 flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-9 h-9 rounded-xl bg-amber-700 text-amber-100 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 animate-spin" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl p-4 text-xs text-stone-500 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-600 animate-bounce"></span>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-600 animate-bounce [animation-delay:0.4s]"></span>
                  <span>Trợ lý đang suy nghĩ và tra cứu phả hệ...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Nhập câu hỏi về quan hệ họ hàng, văn khấn hoặc phong tục..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs sm:text-sm focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

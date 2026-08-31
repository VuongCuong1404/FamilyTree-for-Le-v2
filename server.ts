import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Gia Phả Dòng Họ - Lê Khắc Tộc" });
  });

  // AI Clan Genealogy Assistant endpoint
  app.post("/api/clan-ai", async (req, res) => {
    try {
      const { prompt, clanName, contextData } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Missing prompt" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback local smart response if API key is not configured
        return res.json({
          reply: `[Trợ Lý Gia Tộc]: Chào bạn! Bạn đang hỏi về "${prompt}".\n\nTheo phong tục dòng họ Việt Nam, gia phả và tôn ti trật tự gia tộc luôn đề cao đạo lý "Uống nước nhớ nguồn". Để tra cứu chi tiết thành viên hoặc ngày giỗ, bạn có thể dùng công cụ Tra cứu Danh bạ và Sơ đồ Cây Phả hệ trực tuyến.`,
          source: "offline_fallback"
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `Bạn là Trợ lý AI Gia Tộc thông thái, am hiểu sâu sắc về văn hóa gia phả, tôn ti trật tự họ hàng, phong tục thờ cúng tổ tiên, văn khấn giỗ chạp và văn hóa dòng họ Việt Nam. Dòng họ hiện tại là "${clanName || 'Lê Khắc Tộc'}".
Hãy trả lời với văn phong trang trọng, ấm cúng, chuẩn mực, lễ độ và súc tích.
Nếu người dùng hỏi về quan hệ xưng hô họ hàng, hãy giải thích rõ ràng dựa trên vai vế, thế hệ và ngôi thứ trong gia đình Việt Nam.
Nếu người dùng nhờ soạn bài văn khấn giỗ, hãy soạn bài văn khấn đầy đủ, trang nghiêm theo nghi thức cổ truyền Việt Nam.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemInstruction}\n\nDữ liệu ngữ cảnh dòng họ nếu có: ${JSON.stringify(contextData || {})}\n\nCâu hỏi của con cháu trong họ: ${prompt}` }] }
        ]
      });

      const replyText = response.text || "Không có phản hồi.";
      return res.json({ reply: replyText, source: "gemini" });
    } catch (err: any) {
      console.error("AI Clan error:", err);
      return res.status(500).json({
        error: "Lỗi xử lý AI",
        message: err.message || "Không thể kết nối đến dịch vụ AI."
      });
    }
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clan Genealogy Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

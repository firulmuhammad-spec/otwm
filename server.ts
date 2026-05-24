import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Parser for Overtime Notes
app.post("/api/parse-overtime", async (req, res) => {
  const { text, clientTime } = req.body;

  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Teks input tidak boleh kosong." });
    return;
  }

  try {
    const referenceTime = clientTime || new Date().toISOString();
    
    // Call Gemini to parse
    const prompt = `
Anda adalah asisten cerdas penganalisis catatan lembur kerja karyawan dalam Bahasa Indonesia.
Tugas Anda adalah membaca input teks kotor dari pengguna yang berisi deskripsi jam dan kegiatan lembur, lalu mengekstraknya menjadi JSON terstruktur.

Waktu saat ini (referensi untuk kata relatif seperti 'hari ini', 'kemarin', 'lusa', 'jumat lalu'): ${referenceTime}

Ekstrak informasi berikut:
1. "date": Tanggal lembur dalam format "YYYY-MM-DD". Selesaikan kata relatif (misal: "kemarin" dari referensi waktu, "selasa lalu", dll). Jika tidak ada info tanggal/hari sama sekali, asumsikan hari ini (sesuai referensi).
2. "startTime": Jam mulai lembur dalam format "HH:MM" (format 24 jam). Jika tidak disebutkan eksplisit tapi ada rentang (misal "habis maghrib", asumsikan "18:00"; "pulang kantor", asumsikan "17:00"). Kosongkan "" jika tidak bisa dideteksi.
3. "endTime": Jam selesai lembur dalam format "HH:MM" (format 24 jam). Kosongkan "" jika tidak bisa dideteksi.
4. "durationHours": Jumlah jam lembur sebagai angka desimal. Jika diberikan rentang jam (misal 17:00 ke 19:30), hitung durasinya (2.5 jam). Jika hanya diberi durasi (misal "lembur 3 jam"), isi dengan angka tersebut.
5. "activity": Ringkasan kegiatan lembur dalam Bahasa Indonesia yang rapi (kapitalisasi standar). Misal: "Penyusunan Laporan Bulanan", "Rapat Klien", "Berbagi Pengetahuan", "Debugging Bug CSS". Buat ringkas tapi jelas.

Input Pengguna: "${text}"

Berikan response eksklusif dalam bentuk JSON valid sesuai tipe schema yang ditentukan. Jangan tambahkan penjelasan lain di luar JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: {
              type: Type.BOOLEAN,
              description: "Apakah parsing berhasil menemukan rincian lembur yang bermakna."
            },
            date: {
              type: Type.STRING,
              description: "Format YYYY-MM-DD"
            },
            startTime: {
              type: Type.STRING,
              description: "Format HH:MM atau kosong"
            },
            endTime: {
              type: Type.STRING,
              description: "Format HH:MM atau kosong"
            },
            durationHours: {
              type: Type.NUMBER,
              description: "Total durasi jam lembur"
            },
            activity: {
              type: Type.STRING,
              description: "Deskripsi kegiatan"
            },
            explanation: {
              type: Type.STRING,
              description: "Catatan singkat jika ada penyesuaian asumsi waktu"
            }
          },
          required: ["success", "date", "durationHours", "activity"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Parse Error:", error);
    res.status(500).json({ 
      error: "Gagal memproses catatan dengan AI. Pastikan format input sesuai atau gunakan pengisian cepat.",
      details: error.message 
    });
  }
});

// Serve frontend build or mount Vite development server
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static build serving active.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupServer();

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

// Lazy initialization of Gemini Client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
      throw new Error(
        "Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi di secrets proyek Anda. " +
        "Silakan buka menu 'Settings > Secrets' di Google AI Studio Build dan masukkan GEMINI_API_KEY Anda yang valid."
      );
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

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
    const ai = getGeminiClient();
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
    console.warn("Gemini Parse failed, using intelligent rule-based backup parser:", error);
    try {
      const referenceTime = clientTime || new Date().toISOString();
      const parsedData = fallbackParse(text, referenceTime);
      res.json(parsedData);
    } catch (fallbackError: any) {
      console.error("Critical parse error:", fallbackError);
      res.status(500).json({ 
        error: "Gagal memproses catatan lembur.",
        details: fallbackError.message
      });
    }
  }
});

// Intelligent rule-based local backup parser for Indonesian text when Gemini is offline
function fallbackParse(text: string, referenceTime: string) {
  const cleanText = text.toLowerCase().trim();
  const refDate = new Date(referenceTime);
  let resolvedDate = refDate.toISOString().split("T")[0];

  // Parse relative days in Indonesian
  if (cleanText.includes("kemarin dulu") || cleanText.includes("kemarin lusa")) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - 2);
    resolvedDate = d.toISOString().split("T")[0];
  } else if (cleanText.includes("kemarin") || cleanText.includes("tadi malam")) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - 1);
    resolvedDate = d.toISOString().split("T")[0];
  } else if (cleanText.includes("lusa")) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 2);
    resolvedDate = d.toISOString().split("T")[0];
  } else if (cleanText.includes("besok")) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + 1);
    resolvedDate = d.toISOString().split("T")[0];
  } else {
    // Check days of week
    const daysIndo = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
    for (let i = 0; i < 7; i++) {
      if (cleanText.includes(daysIndo[i] + " lalu")) {
        const d = new Date(refDate);
        const currentDay = d.getDay();
        let diff = currentDay - i;
        if (diff <= 0) diff += 7;
        d.setDate(d.getDate() - diff);
        resolvedDate = d.toISOString().split("T")[0];
        break;
      } else if (cleanText.includes(daysIndo[i])) {
        const d = new Date(refDate);
        const currentDay = d.getDay();
        let diff = currentDay - i;
        if (diff < 0) diff += 7;
        d.setDate(d.getDate() - diff);
        resolvedDate = d.toISOString().split("T")[0];
        break;
      }
    }
  }

  // Parse duration
  let durationHours = 1.0;
  // Match things like: 2.5 jam, 3 jam, 1,5 jam, 4 jam, 8.5jam
  const durationRegex = /(\d+[.,]\d+|\d+)\s*(?:jam|hour)/i;
  const match = cleanText.match(durationRegex);
  if (match) {
    const numStr = match[1].replace(",", ".");
    const parsedNum = parseFloat(numStr);
    if (!isNaN(parsedNum)) {
      durationHours = parsedNum;
    }
  }

  // Parse time range: e.g., 18:00 - 21:00, 18.30 s/d 20.30
  let startTime = "";
  let endTime = "";
  const timeRangeRegex = /(\d{1,2})[:.](\d{2})\s*(?:-|sd|s\/d|sampai|ke)\s*(\d{1,2})[:.](\d{2})/i;
  const timeMatch = cleanText.match(timeRangeRegex);
  if (timeMatch) {
    startTime = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
    endTime = `${timeMatch[3].padStart(2, "0")}:${timeMatch[4]}`;
  } else {
    const singleTimeRegex = /(?:jam|pukul)\s*(\d{1,2})[:.](\d{2})/i;
    const singleMatch = cleanText.match(singleTimeRegex);
    if (singleMatch) {
      startTime = `${singleMatch[1].padStart(2, "0")}:${singleMatch[2]}`;
    }
  }

  // Extract a clean description of activity
  const stopWords = [
    "tadi", "malam", "kemarin", "lusa", "dulu", "hari", "ini", "besok", "pagi", "sore", "siang",
    "lembur", "jam", "pukul", "sd", "s/d", "sampai", "ke", "kerja",
    "senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu", "lalu"
  ];
  let words = text.split(/\s+/);
  words = words.filter(w => {
    const wClean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    return !stopWords.includes(wClean) && !/^\d+$/.test(wClean) && !/^\d+[:.]\d+$/.test(wClean);
  });
  
  let cleanActivity = words.join(" ").trim();
  if (cleanActivity) {
    cleanActivity = cleanActivity.charAt(0).toUpperCase() + cleanActivity.slice(1);
    if (cleanActivity.length > 50) {
      cleanActivity = cleanActivity.substring(0, 47) + "...";
    }
  } else {
    cleanActivity = "Pekerjaan Lembur Tambahan";
  }

  return {
    success: true,
    date: resolvedDate,
    startTime: startTime || "17:00",
    endTime: endTime || "",
    durationHours,
    activity: cleanActivity,
    explanation: "Dianalisis instan dengan algoritma pola kata lokal (AI Backup Active)."
  };
}

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

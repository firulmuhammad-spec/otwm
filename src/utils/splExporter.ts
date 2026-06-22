import { OvertimeLog, OvertimeSettings, Signer } from "../types";

// Helper to convert date to Indonesian Day Name
export function getIndonesianDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[date.getDay()];
}

// Helper to format date into Indonesian full date, e.g. "22 Juni 2026"
export function formatIndonesianDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Generates and downloads Word (.doc) File containing the official Surat Perintah Lembur
export function exportSPLToWord(log: OvertimeLog, settings: OvertimeSettings, signer: Signer) {
  const dayName = getIndonesianDayName(log.date);
  const formattedDate = formatIndonesianDate(log.date);
  const depUpper = (settings.department || "INSPEKSI TEKNIK ROTATING & KHUSUS").toUpperCase();

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>Surat Perintah Lembur</title>
      <style>
        @page {
          size: 21cm 29.7cm;
          margin: 2cm 2cm 2cm 2cm;
        }
        body {
          font-family: 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000000;
        }
        .header-title {
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .header-subtitle {
          text-align: center;
          font-size: 11pt;
          font-weight: bold;
          margin-top: 0px;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .header-department {
          text-align: center;
          font-size: 10pt;
          font-weight: bold;
          margin-top: 0px;
          margin-bottom: 15px;
          text-transform: uppercase;
          border-bottom: 3px double #000000;
          padding-bottom: 8px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        .info-table td {
          padding: 3px 0;
          font-size: 10pt;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 25px;
        }
        .data-table th {
          border: 1px solid #000000;
          padding: 8px;
          font-size: 9.5pt;
          font-weight: bold;
          text-align: center;
          background-color: #f2f2f2;
        }
        .data-table td {
          border: 1px solid #000000;
          padding: 8px;
          font-size: 9.5pt;
          vertical-align: top;
        }
        .footer-table {
          width: 100%;
          margin-top: 25px;
          border-collapse: collapse;
        }
        .notes-column {
          width: 55%;
          font-size: 8.5pt;
          vertical-align: top;
          padding-right: 20px;
          line-height: 1.35;
        }
        .signature-column {
          width: 45%;
          text-align: center;
          vertical-align: top;
          font-size: 10pt;
        }
        .signature-line {
          margin-top: 55px;
          text-decoration: underline;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="header-title">SURAT PERINTAH LEMBUR (SPL)</div>
        <div class="header-subtitle">TENAGA KERJA BANTUAN</div>
        <div class="header-department">DEP. ${depUpper}</div>

        <p style="font-size: 10pt; margin-top: 0; margin-bottom: 10px;">
          Kepada yang namanya tersebut dibawah ini, diperintahkan untuk bekerja lembur pada :
        </p>

        <table class="info-table">
          <tr>
            <td style="width: 15%;"><b>Hari</b></td>
            <td style="width: 2%;">:</td>
            <td style="width: 33%;">${dayName}</td>
            <td style="width: 15%;"><b>Tanggal</b></td>
            <td style="width: 2%;">:</td>
            <td style="width: 33%;">${formattedDate}</td>
          </tr>
          <tr>
            <td><b>Bagian</b></td>
            <td>:</td>
            <td colspan="4">${settings.department}</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 6%;">No</th>
              <th style="width: 32%;">Nama / Badge</th>
              <th style="width: 11%;">Jam Mulai</th>
              <th style="width: 11%;">Jam Selesai</th>
              <th style="width: 40%;">Uraian Tugas</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; height: 40px; line-height: 40px;">1</td>
              <td><b>${settings.employeeName.toUpperCase()}</b><br>Badge: ${settings.employeeBadge}</td>
              <td style="text-align: center; padding-top: 12px;">${log.startTime || "16:00"}</td>
              <td style="text-align: center; padding-top: 12px;">${log.endTime || "18:00"}</td>
              <td>${log.activity}${log.notes ? ` (${log.notes})` : ""}</td>
            </tr>
            <tr>
              <td style="text-align: center; height: 35px;">2</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <td style="text-align: center; height: 35px;">3</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <td style="text-align: center; height: 35px;">4</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <table class="footer-table">
          <tr>
            <td class="notes-column">
              <b>Catatan :</b><br>
              1. SPL dibuat rangkap 2, asli diserahkan ke Manager Inspeksi Teknik dan tembusan untuk arsip bagian yang memerintahkan tugas lembur.<br>
              2. Penyerahan SPL ke Manager Inspeksi Teknik 1 (satu) minggu setelah pelaksanaan kerja lembur atau diserahkan hari Senin.
            </td>
            <td class="signature-column">
              Gresik, ${formattedDate}<br>
              Yang memerintahkan,<br>
              <b>${signer.position}</b>
              <br><br><br><br><br>
              <div class="signature-line">${signer.name.toUpperCase()}</div>
              Badge : ${signer.badge}
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", htmlContent], {
    type: "application/msword",
  });

  const url = URL.createObjectURL(blob);
  const element = document.createElement("a");
  element.href = url;
  element.download = `SPL_${log.date}_${settings.employeeName.replace(/\s+/g, "_")}.doc`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Opens the direct print layout in a new frame or window to let users instantly "Save as PDF"
export function printSPLToPDF(log: OvertimeLog, settings: OvertimeSettings, signer: Signer) {
  const dayName = getIndonesianDayName(log.date);
  const formattedDate = formatIndonesianDate(log.date);
  const depUpper = (settings.department || "INSPEKSI TEKNIK ROTATING & KHUSUS").toUpperCase();

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Mohon ijinkan pop-up browser untuk mencetak/unduh PDF.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cetak SPL - ${log.date}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000000;
          margin: 0;
          padding: 20px;
          background: #ffffff;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
        }
        .header-title {
          text-align: center;
          font-size: 13pt;
          font-weight: bold;
          margin: 0 0 2px 0;
          text-transform: uppercase;
        }
        .header-subtitle {
          text-align: center;
          font-size: 11pt;
          font-weight: bold;
          margin: 0 0 2px 0;
          text-transform: uppercase;
        }
        .header-department {
          text-align: center;
          font-size: 9.5pt;
          font-weight: bold;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          border-bottom: 3px double #000000;
          padding-bottom: 10px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 9.5pt;
        }
        .info-table td {
          padding: 4px 0;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 25px;
        }
        .data-table th {
          border: 1px solid #000000;
          padding: 8px;
          font-size: 9pt;
          font-weight: bold;
          text-align: center;
          background-color: #f5f5f5 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .data-table td {
          border: 1px solid #000000;
          padding: 8px;
          font-size: 9pt;
          vertical-align: top;
        }
        .footer-table {
          width: 100%;
          margin-top: 25px;
          border-collapse: collapse;
          font-size: 9pt;
        }
        .notes-column {
          width: 55%;
          font-size: 8pt;
          vertical-align: top;
          padding-right: 20px;
          color: #333;
          line-height: 1.4;
        }
        .signature-column {
          width: 45%;
          text-align: center;
          vertical-align: top;
        }
        .signature-line {
          margin-top: 55px;
          text-decoration: underline;
          font-weight: bold;
          text-transform: uppercase;
        }
        /* Hide from print view */
        .controls {
          background: #f3f4f6;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 25px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          align-items: center;
          border: 1px solid #e5e7eb;
        }
        .btn {
          font-family: inherit;
          font-size: 11px;
          font-weight: bold;
          padding: 8px 14px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-primary {
          background: #4f46e5;
          color: #ffffff;
        }
        .btn-primary:hover {
          background: #4338ca;
        }
        .btn-secondary {
          background: #ffffff;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        .btn-secondary:hover {
          background: #f9fafb;
        }
        @media print {
          .controls {
            display: none !important;
          }
          body {
            padding: 0;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        
        <!-- Controls Header when viewed in new tab before print -->
        <div class="controls">
          <span style="font-size: 11px; color: #4b5563; margin-right: auto;">ℹ️ Klik 'Cetak Sekarang' untuk menyimpan Lembaran Resmi ini sebagai PDF.</span>
          <button class="btn btn-secondary" onclick="window.close()">Tutup Jendela</button>
          <button class="btn btn-primary" onclick="window.print()">Cetak / Simpan PDF</button>
        </div>

        <div class="header-title">SURAT PERINTAH LEMBUR (SPL)</div>
        <div class="header-subtitle">TENAGA KERJA BANTUAN</div>
        <div class="header-department">DEP. ${depUpper}</div>

        <p style="font-size: 9.5pt; margin-top: 0; margin-bottom: 12px;">
          Kepada yang namanya tersebut dibawah ini, diperintahkan untuk bekerja lembur pada :
        </p>

        <table class="info-table">
          <tr>
            <td style="width: 15%;"><b>Hari</b></td>
            <td style="width: 2%;">:</td>
            <td style="width: 33%;">${dayName}</td>
            <td style="width: 15%;"><b>Tanggal</b></td>
            <td style="width: 2%;">:</td>
            <td style="width: 33%;">${formattedDate}</td>
          </tr>
          <tr>
            <td><b>Bagian</b></td>
            <td>:</td>
            <td colspan="4">${settings.department}</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 6%;">No</th>
              <th style="width: 32%;">Nama / Badge</th>
              <th style="width: 11%;">Jam Mulai</th>
              <th style="width: 11%;">Jam Selesai</th>
              <th style="width: 40%;">Uraian Tugas</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; height: 35px; line-height: 35px;">1</td>
              <td><b>${settings.employeeName.toUpperCase()}</b><br>Badge: ${settings.employeeBadge}</td>
              <td style="text-align: center; padding-top: 10px;">${log.startTime || "16:00"}</td>
              <td style="text-align: center; padding-top: 10px;">${log.endTime || "18:00"}</td>
              <td>${log.activity}${log.notes ? ` (${log.notes})` : ""}</td>
            </tr>
            <tr>
              <td style="text-align: center; height: 30px;">2</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <td style="text-align: center; height: 30px;">3</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <td style="text-align: center; height: 30px;">4</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <table class="footer-table">
          <tr>
            <td class="notes-column">
              <b>Catatan :</b><br>
              1. SPL dibuat rangkap 2, asli diserahkan ke Manager Inspeksi Teknik dan tembusan untuk arsip bagian yang memerintahkan tugas lembur.<br>
              2. Penyerahan SPL ke Manager Inspeksi Teknik 1 (satu) minggu setelah pelaksanaan kerja lembur atau diserahkan hari Senin.
            </td>
            <td class="signature-column">
              Gresik, ${formattedDate}<br>
              Yang memerintahkan,<br>
              <b>${signer.position}</b>
              <br><br><br><br><br>
              <div class="signature-line">${signer.name}</div>
              Badge : ${signer.badge}
            </td>
          </tr>
        </table>
      </div>

      <script>
        // Trigger print immediately on load
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 300);
        });
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

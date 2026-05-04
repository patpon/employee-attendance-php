// ============================================
// PDF Generator - uses jsPDF + autoTable
// ============================================

let _sarabunFontBase64 = null;
let _fontLoading = false;

async function loadSarabunFont() {
    if (_sarabunFontBase64) return _sarabunFontBase64;
    if (_fontLoading) {
        while (_fontLoading) await new Promise(r => setTimeout(r, 100));
        return _sarabunFontBase64;
    }
    _fontLoading = true;
    try {
        // Load from local file first, then fallback to GitHub
        const urls = [
            'fonts/Sarabun-Regular.ttf',
            'https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Regular.ttf',
        ];
        let buf = null;
        for (const url of urls) {
            try {
                const res = await fetch(url);
                if (res.ok) { buf = await res.arrayBuffer(); break; }
            } catch (e) { continue; }
        }
        if (buf && buf.byteLength > 10000) {
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            _sarabunFontBase64 = btoa(binary);
        } else {
            console.warn('Sarabun font file too small or not found');
        }
    } catch (err) {
        console.error('Failed to load Sarabun font:', err);
        _sarabunFontBase64 = null;
    }
    _fontLoading = false;
    return _sarabunFontBase64;
}

async function generatePDF(records) {
    let fontData = null;
    try { fontData = await loadSarabunFont(); } catch (e) { console.warn('Font load failed:', e); }
    const fontName = fontData ? 'Sarabun' : 'helvetica';
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    if (fontData) {
        doc.addFileToVFS('Sarabun-Regular.ttf', fontData);
        doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
        doc.setFont('Sarabun');
    }

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (!record) continue;
        if (i > 0) doc.addPage();
        if (fontData) doc.setFont('Sarabun');

        const buddhistYear = ceToBuddhist(record.year);
        const pageWidth = doc.internal.pageSize.getWidth();

        // --- Header: compact to maximise table space ---
        doc.setFontSize(14);
        doc.text('ตารางสรุปการทำงานรายบุคคล', pageWidth / 2, 10, { align: 'center' });

        doc.setFontSize(10);
        doc.text(
            `ร้าน: ${record.shopName}  |  ประจำเดือน: ${THAI_MONTHS[record.month - 1]} ${buddhistYear}`,
            pageWidth / 2, 16, { align: 'center' }
        );

        doc.setFontSize(9);
        doc.text(`รหัส: ${record.empCode}    ชื่อ: ${record.empName}`, 8, 22);
        doc.text(
            `ทำงาน: ${record.workingDays}  หยุด: ${record.holidays}  ขาด: ${record.absent}  รวมหัก: ${record.totalDeduction} บาท`,
            8, 27
        );

        // Table
        const headers = [
            ['#', 'วันที่', 'วัน', 'หยุด', 'เข้า', 'พักออก', 'พักเข้า', 'เลิก',
                'เข้าสาย', 'หัก(บ.)', 'รอบพัก', 'สายพัก', 'หัก(บ.)'],
        ];

        const days = record.days || [];
        const body = days.map((day, idx) => {
            // Shorten "D (DL 16:30)" → "D/16:30" to prevent cell wrapping
            const roundShort = day.breakRound
                ? day.breakRound.replace(' (DL ', '/').replace(')', '')
                : '';
            return [
                (idx + 1).toString(),
                formatDate(day.date),
                day.dayOfWeek,
                day.isHoliday ? '✓' : '',
                day.isHoliday ? '-' : formatTime(day.scan1),
                day.isHoliday ? '-' : formatTime(day.scan2),
                day.isHoliday ? '-' : formatTime(day.scan3),
                day.isHoliday ? '-' : formatTime(day.scan4),
                day.late1Minutes > 0 ? minutesToTime(day.late1Minutes) : '',
                day.late1Baht > 0 ? day.late1Baht.toString() : '0',
                day.isHoliday ? '-' : roundShort,
                day.late2Minutes > 0 ? minutesToTime(day.late2Minutes) : '',
                day.late2Baht > 0 ? day.late2Baht.toString() : '0',
            ];
        });

        // Summary row
        body.push([
            '', '', '', '', '', '', '', 'รวม',
            minutesToTime(days.reduce((s, d) => s + d.late1Minutes, 0)),
            record.totalLate1Baht.toString(),
            '',
            minutesToTime(days.reduce((s, d) => s + d.late2Minutes, 0)),
            record.totalLate2Baht.toString(),
        ]);

        // Thai Sarabun font: actual row height = 2×cellPadding + fontSize×0.3528×1.5(Thai lineHeight)
        // fontSize=8, cellPadding=1.2 → 2.4 + 4.23 = 6.63mm per row
        // 33 rows (31days+summary+header) × 6.63mm = 218mm < 261mm available → 43mm safety buffer ✓
        doc.autoTable({
            head: headers,
            body: body,
            startY: 31,
            theme: 'grid',
            styles: {
                fontSize: 8, cellPadding: 1.2,
                halign: 'center', valign: 'middle',
                font: fontName, lineWidth: 0.1,
                overflow: 'linebreak',
            },
            headStyles: {
                fillColor: [37, 99, 235], textColor: [255, 255, 255],
                fontStyle: 'bold', fontSize: 8, font: fontName,
                cellPadding: 1.5,
            },
            columnStyles: {
                0:  { cellWidth: 7  },   // #
                1:  { cellWidth: 17 },   // วันที่  "30/04/2026" fits
                2:  { cellWidth: 13 },   // วัน    "พฤหัส" fits
                3:  { cellWidth: 8  },   // หยุด
                4:  { cellWidth: 13 },   // เข้า
                5:  { cellWidth: 14 },   // พักออก
                6:  { cellWidth: 14 },   // พักเข้า
                7:  { cellWidth: 13 },   // เลิก
                8:  { cellWidth: 14 },   // เข้าสาย
                9:  { cellWidth: 13 },   // หัก(บ.)
                10: { cellWidth: 15 },   // รอบพัก "D/16:30" = 7 chars, fits in 15mm
                11: { cellWidth: 13 },   // สายพัก
                12: { cellWidth: 13 },   // หัก(บ.)
            },
            margin: { left: 8, right: 8, bottom: 5 },
            didParseCell: function (data) {
                if (data.section === 'body') {
                    const day = days[data.row.index];
                    if (day) {
                        if (day.isHoliday) data.cell.styles.fillColor = [254, 243, 199];
                        else if (day.isAbsent) data.cell.styles.fillColor = [254, 226, 226];
                    }
                    if (data.row.index === days.length) {
                        data.cell.styles.fillColor = [243, 244, 246];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
        });

        // Footer
        doc.setFontSize(6);
        doc.text(`พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}`, 8, doc.internal.pageSize.getHeight() - 3);
    }

    // Download
    const fileName = records.length === 1
        ? `รายงาน_${records[0].empName}_${THAI_MONTHS[records[0].month - 1]}_${ceToBuddhist(records[0].year)}.pdf`
        : `รายงาน_${THAI_MONTHS[records[0].month - 1]}_${ceToBuddhist(records[0].year)}.pdf`;

    doc.save(fileName);
}

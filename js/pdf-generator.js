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

        // Title
        doc.setFontSize(14);
        doc.text('ตารางสรุปการทำงานรายบุคคล', pageWidth / 2, 10, { align: 'center' });

        doc.setFontSize(9);
        doc.text(
            `ร้าน: ${record.shopName}  |  ประจำเดือน: ${THAI_MONTHS[record.month - 1]} ${buddhistYear}`,
            pageWidth / 2, 16, { align: 'center' }
        );

        // Info
        doc.setFontSize(8);
        doc.text(`รหัส: ${record.empCode}`, 8, 22);
        doc.text(`ชื่อ: ${record.empName}`, 50, 22);
        doc.text(
            `ทำงาน: ${record.workingDays}  หยุด: ${record.holidays}  ขาด: ${record.absent}  รวมหัก: ${record.totalDeduction} บาท`,
            8, 27
        );

        // Table
        const headers = [
            ['#', 'วันที่', 'วัน', 'หยุด', 'เข้า', 'พักออก', 'พักเข้า', 'เลิก',
                'เข้าสาย', 'หัก(บาท)', 'รอบพัก', 'สายพัก', 'หัก(บาท)'],
        ];

        const days = record.days || [];
        const body = days.map((day, idx) => {
            return [
                (idx + 1).toString(),
                formatDate(day.date),
                day.dayOfWeek,
                day.isHoliday ? 'YES' : '',
                day.isHoliday ? '-' : formatTime(day.scan1),
                day.isHoliday ? '-' : formatTime(day.scan2),
                day.isHoliday ? '-' : formatTime(day.scan3),
                day.isHoliday ? '-' : formatTime(day.scan4),
                day.late1Minutes > 0 ? minutesToTime(day.late1Minutes) : '',
                day.late1Baht > 0 ? day.late1Baht.toString() : '0',
                day.isHoliday ? '-' : (day.breakRound || ''),
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

        doc.autoTable({
            head: headers,
            body: body,
            startY: 30,
            theme: 'grid',
            styles: { fontSize: 6.5, cellPadding: 1.2, halign: 'center', valign: 'middle', font: fontName, lineWidth: 0.2 },
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6.5, font: fontName },
            columnStyles: {
                0: { cellWidth: 7 }, 1: { cellWidth: 16 }, 2: { cellWidth: 11 }, 3: { cellWidth: 9 },
                4: { cellWidth: 12 }, 5: { cellWidth: 12 }, 6: { cellWidth: 12 }, 7: { cellWidth: 12 },
                8: { cellWidth: 14 }, 9: { cellWidth: 12 }, 10: { cellWidth: 17 },
                11: { cellWidth: 14 }, 12: { cellWidth: 12 },
            },
            margin: { left: 8, right: 8 },
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
        doc.text(`พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}`, 8, doc.internal.pageSize.getHeight() - 4);
    }

    // Download
    const fileName = records.length === 1
        ? `รายงาน_${records[0].empName}_${THAI_MONTHS[records[0].month - 1]}_${ceToBuddhist(records[0].year)}.pdf`
        : `รายงาน_${THAI_MONTHS[records[0].month - 1]}_${ceToBuddhist(records[0].year)}.pdf`;

    doc.save(fileName);
}

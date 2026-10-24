'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ZERO_REPEAT_CHALLENGES_TOOLS = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  const challengeNames = Object.freeze({ 1: 'دیگه کپی‌پیست نکن!', 2: 'هیچ کاری رو فراموش نکن!' });
  const normalize = value => String(value ?? '').normalize('NFKC').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

  function filterEntries(entries, { query = '', challenge = '', department = '', jobTitle = '' } = {}) {
    const terms = normalize(query).split(' ').filter(Boolean);
    return entries.filter(entry => {
      const haystack = normalize([entry.full_name, entry.username].join(' '));
      return terms.every(term => haystack.includes(term)) &&
        (!challenge || String(entry.challenge_id) === String(challenge)) &&
        (!department || entry.department === department) &&
        (!jobTitle || (jobTitle === '__empty__' ? !entry.job_title : entry.job_title === jobTitle));
    });
  }

  const xml = value => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
  const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  function excelDate(value) {
    if (value === null || value === undefined || value === '') return '';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    const parts = Object.fromEntries(dateFormat.formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) / 86400000 + 25569;
  }
  function zip(files) {
    const encoder = new TextEncoder();
    const local = [], central = [];
    let offset = 0;
    const crc32 = data => {
      let crc = 0xffffffff;
      for (const byte of data) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
      }
      return (crc ^ 0xffffffff) >>> 0;
    };
    for (const [filename, content] of Object.entries(files)) {
      const name = encoder.encode(filename), data = encoder.encode(content), crc = crc32(data);
      const header = new Uint8Array(30 + name.length), h = new DataView(header.buffer);
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x800, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); header.set(name, 30);
      local.push(header, data);
      const directory = new Uint8Array(46 + name.length), d = new DataView(directory.buffer);
      d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x800, true);
      d.setUint32(16, crc, true); d.setUint32(20, data.length, true); d.setUint32(24, data.length, true); d.setUint16(28, name.length, true); d.setUint32(42, offset, true); directory.set(name, 46);
      central.push(directory); offset += header.length + data.length;
    }
    const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
    const end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, central.length, true); e.setUint16(10, central.length, true); e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
    const output = new Uint8Array(offset + centralSize + end.length);
    let cursor = 0;
    for (const chunk of [...local, ...central, end]) { output.set(chunk, cursor); cursor += chunk.length; }
    return output;
  }

  function buildXlsx(entries, { createdAt = new Date(), scope = 'همهٔ ثبت‌نام‌ها' } = {}) {
    if (!Array.isArray(entries) || entries.length > 1048570) throw new Error('تعداد ردیف‌های خروجی بیش از ظرفیت اکسل است.');
    const headers = ['شناسهٔ ثبت', 'نام و نام خانوادگی', 'نام سازمانی', 'واحد سازمانی', 'سمت شغلی', 'شمارهٔ چالش', 'عنوان چالش', 'زمان ثبت (تهران)'];
    const rows = entries.map(entry => [entry.id, entry.full_name, entry.username, entry.department, entry.job_title || '', Number(entry.challenge_id), challengeNames[entry.challenge_id] || '', excelDate(entry.created_at)]);
    const cell = (value, ref, style = 0) => typeof value === 'number' && Number.isFinite(value)
      ? `<c r="${ref}" s="${style}"><v>${value}</v></c>`
      : `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    const created = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' }).format(createdAt);
    const titleRows = `<row r="1" ht="34" customHeight="1">${cell('ZERO REPEAT | ثبت‌نام چالش‌ها', 'B1', 1)}</row><row r="2" ht="28" customHeight="1">${cell('زمان تهیهٔ خروجی: ' + created + ' — به وقت تهران', 'B2', 2)}</row><row r="3" ht="28" customHeight="1">${cell(scope + ' · ' + entries.length.toLocaleString('fa-IR') + ' ثبت‌نام', 'B3', 2)}</row>`;
    const headerRow = `<row r="5" ht="30" customHeight="1">${headers.map((header, i) => cell(header, String.fromCharCode(65 + i) + '5', 3)).join('')}</row>`;
    const dataRows = rows.map((row, i) => `<row r="${i + 6}" ht="33" customHeight="1">${row.map((value, j) => cell(value, String.fromCharCode(65 + j) + (i + 6), j === 7 && typeof value === 'number' ? 5 : i % 2 ? 4 : 0)).join('')}</row>`).join('');
    const widths = [38, 29, 24, 27, 27, 17, 38, 25];
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"><pane xSplit="2" ySplit="5" topLeftCell="C6" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="30"/><cols>${widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"${i === 0 ? ' hidden="1"' : ''}/>`).join('')}</cols><sheetData>${titleRows}${headerRow}${dataRows}</sheetData><autoFilter ref="B5:H${Math.max(5, rows.length + 5)}"/><mergeCells count="3"><mergeCell ref="B1:H1"/><mergeCell ref="B2:H2"/><mergeCell ref="B3:H3"/></mergeCells><pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/></worksheet>`;
    const xf = (font, fill, num = 0) => `<xf numFmtId="${num}" fontId="${font}" fillId="${fill}" borderId="0" xfId="0" applyAlignment="1"${num ? ' applyNumberFormat="1"' : ''}><alignment horizontal="right" vertical="center" wrapText="1" readingOrder="2"/></xf>`;
    const styles = `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy/mm/dd hh:mm"/></numFmts><fonts count="4"><font><sz val="11"/><color rgb="FF17353B"/><name val="Tahoma"/></font><font><b/><sz val="18"/><color rgb="FF007C70"/><name val="Tahoma"/></font><font><sz val="10"/><color rgb="FF657B7D"/><name val="Tahoma"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Tahoma"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF007C70"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0F7F4"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6">${xf(0, 0) + xf(1, 0) + xf(2, 0) + xf(3, 2) + xf(0, 3) + xf(0, 0, 164)}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    return zip({
      '[Content_Types].xml': '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="ثبت‌نام چالش‌ها" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      'xl/styles.xml': styles,
      'xl/worksheets/sheet1.xml': sheet
    });
  }
  return { challengeNames, normalize, filterEntries, buildXlsx, excelDate };
});

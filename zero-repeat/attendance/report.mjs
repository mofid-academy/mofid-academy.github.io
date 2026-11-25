import {zipStored} from '../../Instructor-Survey/zip.mjs?v=20261031.3-instructor';
import {requestLabel, assignmentLabels} from './api.mjs?v=20261125.1';

function normalize(value) {
  return String(value ?? '').normalize('NFKC').replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function filterEntries(entries, {query = '', request = '', assignment = ''} = {}) {
  const terms = normalize(query).split(' ').filter(Boolean);
  return entries.filter(row => {
    if (request && row.wants_mentor !== (request === 'yes')) return false;
    if (assignment && (!row.wants_mentor || Boolean(row.mentor_name) !== (assignment === 'assigned'))) return false;
    const searchText = normalize([row.full_name, row.username, row.mentor_name].join(' '));
    return terms.every(term => searchText.includes(term));
  });
}

export function summarizeEntries(entries) {
  const counts = {total: entries.length, yes: 0, no: 0, pending: 0, assigned: 0};
  for (const row of entries) {
    if (row.wants_mentor) {
      counts.yes++;
      counts[row.mentor_name ? 'assigned' : 'pending']++;
    } else {
      counts.no++;
    }
  }
  return counts;
}

const date = new Intl.DateTimeFormat('fa-IR', {dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Tehran'});
export function formatDate(value) {
  return value && Number.isFinite(new Date(value).getTime()) ? date.format(new Date(value)) : '';
}

function xml(value) {
  const escapes = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'};
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/[&<>"']/g, character => escapes[character]);
}

function cell(value, row, col) {
  const prefix = '<c r="' + String.fromCharCode(65 + col) + row + '" s="' + (row === 1 ? 1 : 0) + '"';
  if (typeof value === 'number') return prefix + '><v>' + value + '</v></c>';
  return prefix + ' t="inlineStr"><is><t xml:space="preserve">' + xml(value) + '</t></is></c>';
}

function sheetRows(rows) {
  return rows.map((row, index) => '<row r="' + (index + 1) + '">' +
    row.map((value, column) => cell(value, index + 1, column)).join('') + '</row>').join('');
}

export function buildXlsx(entries, {scope = 'همهٔ پاسخ‌ها', createdAt = new Date()} = {}) {
  const headers = ['ردیف', 'نام و نام خانوادگی', 'نام سازمانی', 'درخواست منتور', 'وضعیت تخصیص',
    'نام منتور', 'زمان ثبت (تهران)', 'زمان تخصیص (تهران)', 'شناسهٔ پاسخ'];
  const rows = [headers, ...entries.map((row, index) => [
    index + 1, row.full_name, row.username, requestLabel(row),
    row.wants_mentor ? assignmentLabels[row.mentor_name ? 'assigned' : 'pending'] : 'بدون درخواست',
    row.mentor_name, formatDate(row.created_at), formatDate(row.assigned_at), row.id
  ])];
  const worksheet = '<?xml version="1.0" encoding="UTF-8"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0" rightToLeft="1"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    '<sheetFormatPr defaultRowHeight="27"/><cols>' +
    [9, 34, 23, 24, 25, 32, 26, 26, 43].map((width, index) =>
      '<col min="' + (index + 1) + '" max="' + (index + 1) + '" width="' + width + '" customWidth="1"/>'
    ).join('') +
    '</cols><sheetData>' + sheetRows(rows) + '</sheetData><autoFilter ref="A1:I' + rows.length + '"/></worksheet>';
  const counts = summarizeEntries(entries);
  const summary = [
    ['گزارش', 'درخواست منتور ZERO REPEAT'],
    ['محدوده', scope],
    ['زمان خروجی (تهران)', formatDate(createdAt)],
    ['کل پاسخ‌ها', counts.total],
    ['منتور می‌خواهند', counts.yes],
    ['منتور نمی‌خواهند', counts.no],
    ['در انتظار تخصیص', counts.pending],
    ['تخصیص‌یافته', counts.assigned]
  ];
  const files={
    '[Content_Types].xml':'<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':'<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="درخواست‌ها" sheetId="1" r:id="rId1"/><sheet name="خلاصه" sheetId="2" r:id="rId2"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':'<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml':'<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Vazirmatn"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Vazirmatn"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF137A68"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" readingOrder="2"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" readingOrder="2"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    'xl/worksheets/sheet1.xml':worksheet,
    'xl/worksheets/sheet2.xml':'<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"/></sheetViews><cols><col min="1" max="1" width="25" customWidth="1"/><col min="2" max="2" width="90" customWidth="1"/></cols><sheetData>'+sheetRows(summary)+'</sheetData></worksheet>'
  };
  return zipStored(files);
}

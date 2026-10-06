/* Self-contained OOXML export. Participant strings are literal cells, never formulas. */
(function(global){
  'use strict';
  const enc=new TextEncoder();
  const xml=value=>String(value??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'').slice(0,32767).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  function column(index){let s='';for(let n=index+1;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
  function sheet(rows,widths){
    const data=rows.map((row,i)=>'<row r="'+(i+1)+'"'+(i===0?' ht="30" customHeight="1"':'')+'>'+row.map((v,j)=>{
      const a=' r="'+column(j)+(i+1)+'" s="'+(i===0?1:2)+'"';
      return typeof v==='number'&&Number.isFinite(v)?'<c'+a+' t="n"><v>'+v+'</v></c>':'<c'+a+' t="inlineStr"><is><t xml:space="preserve">'+xml(v)+'</t></is></c>';
    }).join('')+'</row>').join('');
    const end=column(rows[0].length-1)+rows.length;
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+widths.map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols><sheetData>'+data+'</sheetData><autoFilter ref="A1:'+end+'"/></worksheet>';
  }
  const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  function crc(bytes){let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
  function zip(files){
    const locals=[],central=[];let offset=0;
    const make=(size)=>{const b=new Uint8Array(size);return [b,new DataView(b.buffer)];};
    for(const [name,text]of Object.entries(files)){
      const n=enc.encode(name),data=enc.encode(text),checksum=crc(data),[h,v]=make(30+n.length);
      v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,0x21,true);v.setUint32(14,checksum,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,n.length,true);h.set(n,30);
      locals.push(h,data);
      const [ch,cv]=make(46+n.length);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,0x21,true);cv.setUint32(16,checksum,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,n.length,true);cv.setUint32(42,offset,true);ch.set(n,46);central.push(ch);offset+=h.length+data.length;
    }
    const centralSize=central.reduce((s,a)=>s+a.length,0),[end,v]=make(22);v.setUint32(0,0x06054b50,true);v.setUint16(8,central.length,true);v.setUint16(10,central.length,true);v.setUint32(12,centralSize,true);v.setUint32(16,offset,true);
    const all=[...locals,...central,end],out=new Uint8Array(offset+centralSize+22);let pos=0;for(const a of all){out.set(a,pos);pos+=a.length;}return out;
  }
  const status={correct:'صحیح',wrong:'غلط',partial:'بخشی صحیح',unanswered:'بدون پاسخ',pending:'در انتظار بررسی'};
  function rows(results){
    const summary=[['نام واردشده','عنوان آزمون','نوبت آزمون','شناسه ارسال','زمان دریافت','وضعیت تصحیح','نمره','حداکثر','درصد','صحیح','غلط','بدون پاسخ','ثبت در شیت']];
    const detail=[['نام واردشده','شناسه ارسال','نوبت آزمون','شماره سؤال','متن سؤال','نوع','پاسخ شرکت‌کننده','پاسخ صحیح / نمونه','وضعیت','نمره','بارم']];
    for(const r of results){const g=r.grading||{},s=r.submission||{};
      summary.push([r.username,s.exam_title,r.run_id,r.submission_id,r.received,g.status==='graded'?'تصحیح شده':'در انتظار بررسی',g.total_score??'',g.total_max??'',g.percent??'',g.correct??'',g.wrong??'',g.unanswered??'',r.sheet_synced?'ثبت شده':'در انتظار همگام‌سازی']);
      if(g.details?.length)for(const d of g.details)detail.push([r.username,r.submission_id,r.run_id,d.position,d.question,d.type==='mcq'?'تستی':'تشریحی',d.answer,d.type==='mcq'?d.correct_answer:d.sample_answer,status[d.status]||status.pending,d.score??'',d.max_score]);
      else for(const [i,a]of(s.answers||[]).entries())detail.push([r.username,r.submission_id,r.run_id,i+1,a.question_id,'',a.answer,'',status.pending,'','']);
    }
    return {summary,detail};
  }
  function create(results){
    const data=rows(results);
    const types='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
    const rels='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    const workbook='<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="خلاصه نتایج" sheetId="1" r:id="rId1"/><sheet name="جزئیات پاسخ‌ها" sheetId="2" r:id="rId2"/></sheets></workbook>';
    const wr='<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    const styles='<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Tahoma"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Tahoma"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B6E6A"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    return zip({'[Content_Types].xml':types,'_rels/.rels':rels,'xl/workbook.xml':workbook,'xl/_rels/workbook.xml.rels':wr,'xl/styles.xml':styles,'xl/worksheets/sheet1.xml':sheet(data.summary,[26,35,28,30,24,24,12,12,12,12,12,12,24]),'xl/worksheets/sheet2.xml':sheet(data.detail,[26,30,28,12,65,14,65,65,22,12,12])});
  }
  global.AcademyExcel={create,rows};
})(typeof window==='object'?window:globalThis);

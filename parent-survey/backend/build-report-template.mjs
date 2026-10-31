import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
import {pathToFileURL} from 'node:url';
const [sourceDir,outputDir]=process.argv.slice(2);
if(!sourceDir||!outputDir)throw Error('Usage: build-report-template.mjs SOURCE_DIR OUTPUT_DIR');
const {ACTIVE_QUESTIONS:questions}=await import(pathToFileURL(sourceDir+'/questions.mjs').href);
const {HEADERS:headers,col}=await import(pathToFileURL(sourceDir+'/excel-export.mjs').href);
const endCol=col(headers.length-1),questionCol=code=>col(7+questions.findIndex(q=>q.code===code));
const wb=Workbook.create();
const summary=wb.worksheets.add('خلاصه'),data=wb.worksheets.add('پاسخ‌ها'),guide=wb.worksheets.add('راهنمای سؤال‌ها'),quotes=wb.worksheets.add('نقل‌قول‌های مجاز');
const green='#00695E',ink='#173E36',muted='#63786F';
for(const s of [summary,data,guide,quotes]){s.showGridLines=false;s.getRange('A1:Y30').format.font={name:'Arial',size:11,color:ink};s.getRange('A1:Y30').format.verticalAlignment='center';s.getRange('A1:Y30').format.rowHeight=27;}
const title=(s,t)=>{s.getRange('A2').values=[[t]];s.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:green};s.getRange('A2').format.rowHeight=34;};
const head=(s,range)=>{s.getRange(range).format={fill:green,font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},wrapText:true,horizontalAlignment:'center',verticalAlignment:'center',rowHeight:48};};
title(summary,'نظرسنجی اولیا — ده سال جلوتر');
summary.tabColor=green;summary.getRange('A:A').format.columnWidth=43;summary.getRange('B:B').format.columnWidth=24;summary.getRange('C:C').format.columnWidth=4;summary.getRange('D:D').format.columnWidth=90;
for(const row of [4,5,6,7])summary.mergeCells('B'+row+':D'+row);
summary.getRange('A4:B7').values=[['نوع گزارش','__MODE__'],['زمان خروجی (تهران)','__EXPORTED__'],['فیلترهای سایت','__FILTERS__'],['مبنای خلاصه','ردیف‌های قابل مشاهده در شیت پاسخ‌ها']];
summary.getRange('A4:A7').format.font={name:'Arial',size:10,color:muted};summary.getRange('B4:B7').format.font={name:'Arial',size:10,color:ink};summary.getRange('B6').format.wrapText=true;summary.getRange('B6').format.rowHeight=60;summary.getRange('B7').format.wrapText=true;summary.getRange('B7').format.rowHeight=45;
summary.getRange('A9:B9').values=[['شاخص','نتیجه']];head(summary,'A9:B9');
const labels=['تعداد پاسخ‌ها','میانگین رضایت کلی (از ۵)','رضایت زیاد و بسیار زیاد','شاخص خالص توصیه (NPS)','تغییر مشاهده‌شده (تا حدی یا واضح)','گفت‌وگو در خانه (چندبار یا مرتب)','حمایت از تداوم (میانگین از ۱۰)','حمایت قوی از تداوم (۹ و ۱۰)','تعداد مجوز استفاده از نظر'];
summary.getRange('A10:A18').values=labels.map(x=>[x]);
const r=c=>"'پاسخ‌ها'!"+c+'6:'+c+'6',vis=r(endCol);
const formulas=[
 '=SUBTOTAL(103,'+r('A')+')',
 '=IF(B10=0,"",SUBTOTAL(101,'+r('H')+'))',
 '=IF(B10=0,"",SUMPRODUCT('+vis+',--('+r('H')+'>=4))/B10)',
 '=IF(B10=0,"",100*(SUMPRODUCT('+vis+',--('+r('Q')+'>=9))-SUMPRODUCT('+vis+',--('+r('Q')+'<=6)))/B10)',
 '=IF(B10=0,"",SUMPRODUCT('+vis+',--('+r('L')+'>=2))/B10)',
 '=IF(B10=0,"",SUMPRODUCT('+vis+',--('+r('K')+'>=3))/B10)',
 '=IF(B10=0,"",SUBTOTAL(101,'+r('P')+'))',
 '=IF(B10=0,"",SUMPRODUCT('+vis+',--('+r('P')+'>=9))/B10)',
 '=IF(B10=0,0,SUMPRODUCT('+vis+',--('+r(questionCol('P14'))+'="بله")))'
];
summary.getRange('B10:B18').formulas=formulas.map(f=>[f]);summary.getRange('B10:B18').setNumberFormat('0.00');
for(const row of [10,18])summary.getRange('B'+row).setNumberFormat('0');for(const row of [12,14,15,17])summary.getRange('B'+row).setNumberFormat('0.0%');summary.getRange('B13').setNumberFormat('0.0');
summary.getRange('A10:B18').format.rowHeight=34;summary.getRange('B10:B18').format.font={name:'Arial',size:12,bold:true,color:green};
summary.getRange('D9:D13').values=[['خواندن گزارش'],['فیلترهای شیت پاسخ‌ها، خلاصه را به‌روز می‌کنند.'],['NPS: درصد مروجان ۹ و ۱۰ منهای درصد منتقدان ۰ تا ۶.'],['متن نظرهای بدون مجوز صرفاً برای بررسی داخلی است.'],['پیش از انتشار نقل‌قول‌های مجاز، اطلاعات شخصی احتمالی را حذف کنید.']];summary.getRange('D9').format.font={name:'Arial',size:11,bold:true,color:green};summary.getRange('D10:D13').format.font={name:'Arial',size:10,color:muted};
title(data,'پاسخ‌های نظرسنجی اولیا');data.getRange('A3').values=[['مقادیر عددی با راهنمای سؤال‌ها تفسیر شوند. متن نظرها برای بررسی داخلی است.']];data.getRange('A3').format.font={name:'Arial',size:10,color:muted};
data.getRange('A5:'+endCol+'5').values=[headers];head(data,'A5:'+endCol+'5');data.getRange('A6:'+endCol+'6').values=[Array(headers.length).fill('')];data.getRange('A6:'+endCol+'6').format.wrapText=true;data.getRange('A6:'+endCol+'6').format.rowHeight=34;
data.getRange('A:A').format.columnWidth=39;data.getRange('B:C').format.columnWidth=24;data.getRange('D:G').format.columnWidth=23;data.getRange('H:Q').format.columnWidth=17;data.getRange('R:S').format.columnWidth=55;data.getRange('T:T').format.columnWidth=20;data.getRange('U:U').format.columnWidth=60;data.getRange('V:W').format.columnWidth=23;data.getRange('X:Y').format.columnWidth=26;data.getRange(endCol+':'+endCol).format.columnWidth=15;data.getRange('A6:'+endCol+'6').format.font={name:'Arial',size:11,color:ink};
data.getRange('B6').setNumberFormat('yyyy-mm-dd hh:mm');data.getRange('H6:Q6').setNumberFormat('0');data.getRange('W6').setNumberFormat('0');data.getRange(endCol+'6').setNumberFormat('0');data.getRange(endCol+'6').formulas=[['=SUBTOTAL(103,A6)']];data.freezePanes.freezeRows(5);
const table=data.tables.add('A5:'+endCol+'6',true,'ParentResponses');table.style='TableStyleMedium4';table.showFilterButton=true;
title(guide,'راهنمای سؤال‌ها و کدگذاری');guide.getRange('A3').values=[['منبع: FFFL68-Parent-Survey-Questions(2).xlsx، شیت سوالات اولیا و کدگذاری تحلیل']];guide.getRange('A3').format.font={name:'Arial',size:10,color:muted};
guide.getRange('A5:G5').values=[['کد','محور','متن کامل سؤال','نوع پاسخ','گزینه‌ها و مقیاس','الزام','روش تحلیل']];head(guide,'A5:G5');
guide.getRange('A6:G'+(5+questions.length)).values=questions.map(q=>[q.code,q.axis,q.text,q.kind==='text'?'متن آزاد':q.kind==='scale10'?'۰ تا ۱۰':'گزینه‌ای',q.scale,q.required?'الزامی':'اختیاری',q.analysis]);
guide.getRange('A:A').format.columnWidth=10;guide.getRange('B:B').format.columnWidth=22;guide.getRange('C:C').format.columnWidth=78;guide.getRange('D:D').format.columnWidth=17;guide.getRange('E:E').format.columnWidth=70;guide.getRange('F:F').format.columnWidth=14;guide.getRange('G:G').format.columnWidth=60;guide.getRange('A6:G'+(5+questions.length)).format.wrapText=true;guide.getRange('A6:G'+(5+questions.length)).format.rowHeight=85;guide.freezePanes.freezeRows(5);
title(quotes,'نقل‌قول‌های دارای اجازه');quotes.getRange('A3').values=[['فقط پاسخ‌های P14=بله؛ پیش از انتشار، اطلاعات شخصی احتمالی را از متن حذف کنید.']];quotes.getRange('A3').format.font={name:'Arial',size:10,color:muted};quotes.getRange('A5:E5').values=[['شناسه پاسخ','ارزش اصلی دوره (P11)','پیشنهاد بهبود (P12)','معرفی دوره (P15)','اجازه انتشار']];head(quotes,'A5:E5');quotes.getRange('A6:E6').values=[['','','','','']];quotes.getRange('A6:E6').format.wrapText=true;quotes.getRange('A6:E6').format.rowHeight=75;quotes.getRange('A:A').format.columnWidth=39;quotes.getRange('B:D').format.columnWidth=64;quotes.getRange('E:E').format.columnWidth=18;quotes.freezePanes.freezeRows(5);const qt=quotes.tables.add('A5:E6',true,'ApprovedQuotes');qt.style='TableStyleMedium4';qt.showFilterButton=true;
wb.recalculate();await fs.mkdir(outputDir,{recursive:true});
console.log((await wb.inspect({kind:'region',sheetId:'خلاصه',range:'A9:B18',maxChars:2200,tableMaxRows:10,tableMaxCols:2})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!',options:{useRegex:true,maxResults:10},maxChars:800})).ndjson);
for(const [s,range,file] of [['خلاصه','A1:D19','summary'],['پاسخ‌ها','V4:Z7','responses'],['راهنمای سؤال‌ها','A16:C19','guide'],['نقل‌قول‌های مجاز','A1:B7','quotes']]){
 const image=await wb.render({sheetName:s,range,scale:1.4,format:'png'});await fs.writeFile(outputDir+'/'+file+'.png',new Uint8Array(await image.arrayBuffer()));
}
const output=await SpreadsheetFile.exportXlsx(wb);await output.save(outputDir+'/report-template.xlsx');
console.log('Exported report-template.xlsx');

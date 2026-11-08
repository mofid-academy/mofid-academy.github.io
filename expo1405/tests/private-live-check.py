"""Read-only verification of the deployed owner/moderator/display boundaries."""
import getpass,io,json,pathlib,re,urllib.request,urllib.error,zipfile,xml.etree.ElementTree as ET
base='https://siwmzffadbbhcyyppwzn.supabase.co/functions/v1/expo1405-api'
project='https://siwmzffadbbhcyyppwzn.supabase.co'
host=getpass.getpass('Moderator code (hidden): ')
owner=getpass.getpass('Owner code (hidden): ')
def call(path,headers=None,method='GET',expected=200):
 h={'Origin':'https://mofid-academy.github.io',**(headers or {})}
 req=urllib.request.Request(base+path,headers=h,method=method,data=b'{}' if method=='POST' else None)
 try:
  r=urllib.request.urlopen(req,timeout=30);code=r.status;body=r.read();meta=r.headers
 except urllib.error.HTTPError as e:code=e.code;body=e.read();meta=e.headers
 assert code==expected,(path,code,body[:160])
 return body,meta
public=json.loads(call('/state')[0])['payload']
assert not any(k in public for k in ['total','participants','credits'])
assert all('count' not in o for o in (public.get('question') or {}).get('options',[]))
moderator=json.loads(call('/host',{'X-Host-Key':host})[0]);assert moderator['role']=='host' and 'total' not in moderator['payload']
for path in ['/admin/summary','/admin/responses','/admin/export','/host/export']:call(path,{'X-Host-Key':host},expected=403)
call('/display/state',expected=401)
display=json.loads(call('/host/display-token',{'X-Host-Key':host},method='POST')[0])['token']
shown=json.loads(call('/display/state',{'X-Display-Key':display})[0])['payload'];assert 'total' in shown and 'credits' in shown
summary=json.loads(call('/admin/summary?round=all',{'X-Admin-Key':owner})[0]);assert 'questions' in summary
call('/admin/responses?round=all',{'X-Admin-Key':owner})
book,meta=call('/admin/export?round=all',{'X-Admin-Key':owner});assert 'spreadsheetml' in meta['Content-Type'] and 'no-store' in meta['Cache-Control']
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(io.BytesIO(book)) as z:
 for n in z.namelist():
  if n.endswith('.xml') or n.endswith('.rels'):ET.fromstring(z.read(n))
 sheets=ET.fromstring(z.read('xl/workbook.xml')).findall('s:sheets/s:sheet',ns);assert len(sheets)==len(summary['questions'])+1
 total=0
 for i in range(2,len(sheets)+1):
  xml=ET.fromstring(z.read(f'xl/worksheets/sheet{i}.xml'))
  assert xml.find('s:sheetViews/s:sheetView',ns).attrib['rightToLeft']=='1'
  assert not xml.findall('.//s:f',ns)
  total+=len([r for r in xml.findall('s:sheetData/s:row',ns) if int(r.attrib['r'])>=6])
try:
 import openpyxl
 wb=openpyxl.load_workbook(io.BytesIO(book),data_only=False)
 assert len(wb.worksheets)==len(sheets)
 assert all(s.sheet_view.rightToLeft for s in wb.worksheets)
 native_reader='openpyxl'
except ImportError:native_reader='OOXML XML/ZIP validation'
cfg=(pathlib.Path(__file__).parent.parent/'config.mjs').read_text();key=json.loads(re.search(r'PUBLIC_KEY=(.*);',cfg).group(1))
for table in ['expo1405_rooms','expo1405_votes','expo1405_participants','expo1405_display']:
 req=urllib.request.Request(project+'/rest/v1/'+table+'?select=*&limit=1',headers={'apikey':key})
 try:
  r=urllib.request.urlopen(req,timeout=15);assert json.loads(r.read())==[],table
 except urllib.error.HTTPError as e:assert e.code>=400
print(json.dumps({'ok':True,'questionSheets':len(sheets)-1,'exportedResponses':total,'reader':native_reader,'participantResultsHidden':True,'moderatorArchiveDenied':True,'displayTokenRequired':True,'ownerExportValid':True},ensure_ascii=False))

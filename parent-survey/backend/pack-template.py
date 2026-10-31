"""Normalize Artifact Tool OOXML for the dependency-free browser exporter."""
import re
import sys
from zipfile import ZipFile, ZIP_STORED
import xml.etree.ElementTree as ET

source, destination = sys.argv[1:3]
with ZipFile(source) as archive, ZipFile(destination, 'w', compression=ZIP_STORED) as output:
    for name in archive.namelist():
        content = archive.read(name)
        if name.endswith('.xml'):
            text = content.decode()
            ns = 'xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
            if ns in text:
                text = text.replace('<x:', '<').replace('</x:', '</').replace(ns, ns.replace('xmlns:x', 'xmlns'))
            if name.startswith('xl/worksheets/'):
                text = re.sub(r'<sheetView\b', '<sheetView rightToLeft="1"', text)
                if name == 'xl/worksheets/sheet2.xml':
                    text = re.sub(r'<col\b(?=[^>]*min="25")([^>]*?)/>', lambda m: '<col' + re.sub(r'\s+hidden="[^"]*"', '', m[1]) + ' hidden="1"/>', text)
            ET.fromstring(text)
            content = text.encode()
        output.writestr(name, content)
print('Packed and XML-validated XLSX template.')

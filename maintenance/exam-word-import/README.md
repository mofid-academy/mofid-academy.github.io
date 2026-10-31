# Local DOCX question import

The server-backed `exam-import-file` path returned `Response body is not valid JSON` for the supplied Word document. DOCX imports now read `word/document.xml` directly in the admin browser and create a new managed draft. No file POST, automatic retry, live exam activation or publication is performed by this path. PDF retains the existing server-backed import behavior.

The reader supports the document's explicit numbered question format (`1. Question`, `1) Option`, `پاسخ صحیح: 2) Option`) with Persian and Arabic digits. Question/option wording is preserved. Only explicit answer keys are accepted; missing keys remain unset, and contradictions stop the import before adoption. Every import gets a fresh exam namespace and ordered question IDs. The admin's normal adoption API validates the bank, and a local-import event marks the questions dirty for the existing save flow. Archive and publication continue through their existing authenticated actions.

ZIP extraction is limited to the main Word XML, checks file/XML sizes and CRC32, rejects encryption/unsupported archive structures and uses the native Compression Streams API. No parser dependency or external document conversion service is added. The secure loader loads the reader before the import UI.

Validation:

- Nine Node tests cover stored/deflated ZIP entries, malformed input, size/checksum/encryption failures, Persian and Arabic numbering, independent exam IDs, explicit/missing/conflicting keys, public serialization without answer-key fields, local adoption without server POST and preservation of the current bank on failure.
- The supplied private DOCX was checked locally: 35 questions, 140 options, 35 explicit keys, 35 unique question IDs and no missing keys. Neither the document nor its question/answer content is included in this repository.
- The existing candidate form, timer, transport and authentication are unchanged.

Run from the repository root:

```sh
node --test maintenance/exam-word-import/word-import.test.cjs
```

Primary API references:

- https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream/DecompressionStream
- https://compression.spec.whatwg.org/

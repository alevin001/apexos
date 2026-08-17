# Build 19 Checkpoint D — controlled synthetic fixtures

Not Andrew’s real architecture library. Do not ingest real-library files here.

```json
{
  "checkpoint": "D",
  "processVersion": "build19-vision-1.0",
  "promptVersion": "build19-vision-schema-1.0",
  "note": "Controlled synthetic fixtures only — not Andrew’s architecture library.",
  "fixtures": [
    {
      "path": "pdf/native-text-multi.pdf",
      "expect": "vision not invoked; pageCoverage all native; locators PDF page 1..3",
      "tokens": [
        "TOKEN-NATIVE-P1",
        "TOKEN-NATIVE-P2",
        "TOKEN-NATIVE-P3"
      ]
    },
    {
      "path": "pdf/scanned-multipage.pdf",
      "expect": "vision for pages 1-2; locators PDF page N vision_transcription",
      "tokens": [
        "TOKEN-SCAN-P1",
        "TOKEN-SCAN-P2"
      ]
    },
    {
      "path": "pdf/hybrid-native-scan.pdf",
      "expect": "page1 native; page2 vision; page3 both_separate or vision; methods reported per page",
      "tokens": [
        "TOKEN-HYBRID-NATIVE",
        "TOKEN-HYBRID-SCAN"
      ]
    },
    {
      "path": "image/diagram-with-labels.png",
      "expect": "transcription distinct from visual description; Image locator",
      "tokens": [
        "TOKEN-DIAGRAM-LABEL"
      ]
    },
    {
      "path": "image/partial-obscured.png",
      "expect": "partial/review — [unreadable] allowed; no invented content",
      "tokens": [
        "TOKEN-PARTIAL-EDGE"
      ]
    }
  ]
}
```

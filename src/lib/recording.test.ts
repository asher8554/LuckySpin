// 녹화 파일 이름과 MediaRecorder MIME 선택을 검증한다.
import { describe, expect, it } from "vitest";

import { createRecordingFileName, getSupportedRecordingMimeType } from "./recording";

describe("createRecordingFileName", () => {
  it("uses a stable LuckySpin webm file name", () => {
    expect(createRecordingFileName(new Date("2026-06-04T13:05:09Z"))).toBe("luckyspin-20260604-130509.webm");
  });
});

describe("getSupportedRecordingMimeType", () => {
  it("chooses the first supported webm type", () => {
    const recorder = {
      isTypeSupported: (mimeType: string) => mimeType === "video/webm;codecs=vp8",
    };

    expect(getSupportedRecordingMimeType(recorder)).toBe("video/webm;codecs=vp8");
  });

  it("returns an empty string when no candidate is supported", () => {
    const recorder = {
      isTypeSupported: () => false,
    };

    expect(getSupportedRecordingMimeType(recorder)).toBe("");
  });
});

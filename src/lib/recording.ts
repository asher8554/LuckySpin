// 캔버스 녹화 파일 이름과 MediaRecorder 옵션을 계산한다.
export const recordingMimeTypeCandidates = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
] as const;

type MediaRecorderSupport = {
  isTypeSupported: (mimeType: string) => boolean;
};

export function getSupportedRecordingMimeType(mediaRecorder: MediaRecorderSupport | undefined) {
  if (!mediaRecorder) {
    return "";
  }

  return recordingMimeTypeCandidates.find((mimeType) => mediaRecorder.isTypeSupported(mimeType)) ?? "";
}

export function createRecordingFileName(date = new Date()) {
  const timestamp = [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    "-",
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
  ].join("");

  return `luckyspin-${timestamp}.webm`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

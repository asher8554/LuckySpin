// 룰렛 캔버스를 MediaRecorder로 녹화하고 다운로드한다.
import { useCallback, useRef, useState } from "react";
import { createRecordingFileName, getSupportedRecordingMimeType } from "../lib/recording";

interface UseCanvasRecorderOptions {
  getCanvas: () => HTMLCanvasElement | null;
  onMessage: (message: string) => void;
}

export function useCanvasRecorder({ getCanvas, onMessage }: UseCanvasRecorderOptions) {
  const [recordingEnabled, setRecordingEnabledState] = useState(false);
  const [recordingActive, setRecordingActive] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const saveRecording = useCallback(
    (chunks: Blob[], mimeType: string) => {
      if (chunks.length === 0) {
        onMessage("저장할 녹화 데이터가 없습니다.");
        return;
      }

      const blob = new Blob(chunks, { type: mimeType || "video/webm" });
      if (blob.size === 0) {
        onMessage("저장할 녹화 데이터가 없습니다.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = createRecordingFileName();
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onMessage("녹화 파일을 다운로드했습니다.");
    },
    [onMessage],
  );

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
  }, []);

  const startRecording = useCallback(() => {
    if (!recordingEnabled) {
      return false;
    }

    if (recorderRef.current?.state === "recording") {
      return true;
    }

    if (typeof MediaRecorder === "undefined") {
      onMessage("이 브라우저는 녹화를 지원하지 않습니다.");
      setRecordingEnabledState(false);
      return false;
    }

    const canvas = getCanvas();
    if (!canvas || typeof canvas.captureStream !== "function") {
      onMessage("룰렛 화면을 아직 녹화할 수 없습니다.");
      setRecordingEnabledState(false);
      return false;
    }

    const stream = canvas.captureStream(60);
    const mimeType = getSupportedRecordingMimeType(MediaRecorder);
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      setRecordingActive(false);
      saveRecording(chunksRef.current, mimeType);
      chunksRef.current = [];
    };
    recorder.onerror = () => {
      stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      chunksRef.current = [];
      setRecordingActive(false);
      setRecordingEnabledState(false);
      onMessage("녹화 중 오류가 발생했습니다.");
    };

    recorder.start();
    setRecordingActive(true);
    onMessage("녹화를 시작했습니다.");
    return true;
  }, [getCanvas, onMessage, recordingEnabled, saveRecording]);

  const setRecordingEnabled = useCallback(
    (enabled: boolean) => {
      if (!enabled) {
        setRecordingEnabledState(false);
        stopRecording();
        onMessage(recordingActive ? "녹화를 저장합니다." : "녹화를 껐습니다.");
        return;
      }

      if (typeof MediaRecorder === "undefined") {
        onMessage("이 브라우저는 녹화를 지원하지 않습니다.");
        setRecordingEnabledState(false);
        return;
      }

      setRecordingEnabledState(true);
      onMessage("녹화가 켜졌습니다. 시작하면 자동으로 저장됩니다.");
    },
    [onMessage, recordingActive, stopRecording],
  );

  return {
    recordingActive,
    recordingEnabled,
    setRecordingEnabled,
    startRecording,
    stopRecording,
  };
}

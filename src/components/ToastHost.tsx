// 짧은 상태 메시지를 화면 하단에 표시한다.
import type { ToastMessage } from "../types";

interface ToastHostProps {
  messages: ToastMessage[];
}

export function ToastHost({ messages }: ToastHostProps) {
  return (
    <div className="toast-host" aria-live="polite" aria-atomic="true">
      {messages.map((toast) => (
        <div className="toast" key={toast.id}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

// 첫 버전 안내와 원본 대체 정책을 보여주는 공지 모달이다.
interface NoticeModalProps {
  open: boolean;
  onClose: () => void;
}

export function NoticeModal({ open, onClose }: NoticeModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="notice-backdrop" role="presentation">
      <section className="notice-modal" role="dialog" aria-modal="true" aria-labelledby="notice-title">
        <h2 id="notice-title">공지</h2>
        <div className="notice-body">
          <h3>LuckySpin 첫 버전</h3>
          <p>
            이 페이지는 새 코드로 구현한 룰렛 클론입니다. 녹화, 상점, 외부 이미지 연동은 첫
            버전에서 지원하지 않습니다.
          </p>
        </div>
        <div className="notice-actions">
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>
      </section>
    </div>
  );
}

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
        <h2 id="notice-title">NOTICE</h2>
        <div className="notice-body">
          <h3>50% 할인 행사</h3>
          <div className="notice-banner" aria-hidden="true">
            <span className="banner-orbit banner-orbit-a" />
            <span className="banner-orbit banner-orbit-b" />
            <p>마블룰렛</p>
            <strong>저작권 등록 기념</strong>
            <b>50%</b>
            <small>할인 이벤트</small>
          </div>
          <p>저작권 등록을 기념하여 전 상품 50% 할인 행사를 진행합니다.</p>
          <p>감사합니다!</p>
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

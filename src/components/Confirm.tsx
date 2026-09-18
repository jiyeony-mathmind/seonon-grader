'use client';
export function Confirm({ msg, yes = '확인', onYes, onNo }: { msg: string; yes?: string; onYes: () => void; onNo: () => void }) {
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,20,.45)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 16 }} onClick={onNo}>
      <div className="card" style={{ maxWidth: 420, width: '100%' }} onClick={e => e.stopPropagation()}>
        <p>{msg}</p>
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}><button className="btn" onClick={onNo}>취소</button><button className="btn danger" onClick={onYes} autoFocus>{yes}</button></div>
      </div>
    </div>
  );
}

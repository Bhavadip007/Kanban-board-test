import { useConfirmStore } from '@/store/confirmStore';

export const ConfirmDialog = () => {
  const { isOpen, title, message, confirmLabel, cancelLabel, close } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => close(false)}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => close(false)}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger" onClick={() => close(true)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

import {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    type PropsWithChildren,
    type ReactNode,
} from "react";

type ModalProps = PropsWithChildren<{
  isOpen: boolean;
  title: string;
  onRequestClose: () => void;
  footer?: ReactNode;
  isDirty?: boolean;
  initialFocusId?: string;
}>;

const FOCUSABLE_SELECTORS =
  "a[href], button, textarea, input, select, [tabindex]:not([tabindex='-1'])";

export function Modal({
  isOpen,
  title,
  onRequestClose,
  footer,
  isDirty,
  initialFocusId,
  children,
}: ModalProps) {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to close?",
      );
      if (!confirmed) return;
    }
    onRequestClose();
  }, [isDirty, onRequestClose]);

  const focusables = useMemo(() => {
    const root = modalRef.current;
    if (!root) return [] as HTMLElement[];
    return Array.from(root.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
      (node) => !node.hasAttribute("disabled"),
    ) as HTMLElement[];
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTarget = initialFocusId
      ? document.getElementById(initialFocusId)
      : null;
    if (focusTarget) {
      focusTarget.focus();
      return;
    }
    const first = focusables[0];
    first?.focus();
  }, [focusables, initialFocusId, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = focusables;
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusables, handleClose, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal__backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={modalRef}
      >
        <div className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" onClick={handleClose}>
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

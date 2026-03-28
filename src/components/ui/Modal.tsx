import type { ReactNode } from 'react';

type ModalProps = {
  title: string;
  children: ReactNode;
};

const Modal = ({ title, children }: ModalProps) => (
  <div className="modal-veil">
    <div className="modal-content">
      <header className="modal-content__header">
        <h2>{title}</h2>
      </header>
      <div className="modal-content__body">{children}</div>
    </div>
  </div>
);

export default Modal;

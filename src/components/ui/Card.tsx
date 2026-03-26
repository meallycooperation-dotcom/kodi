import type { ReactNode } from 'react';

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

const Card = ({ title, children, className = '' }: CardProps) => (
  <section className={`card ${className}`}>
    {title && <header className="card__title">{title}</header>}
    <div className="card__body">{children}</div>
  </section>
);

export default Card;

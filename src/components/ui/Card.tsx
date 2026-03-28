import type { ReactNode, HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  children: ReactNode;
  className?: string;
};

const Card = ({ title, children, className = '', ...props }: CardProps) => (
  <section className={`card ${className}`} {...props}>
    {title && <header className="card__title">{title}</header>}
    <div className="card__body">{children}</div>
  </section>
);

export default Card;

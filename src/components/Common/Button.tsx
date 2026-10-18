import type React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  const baseClasses =
    'px-4 py-2 rounded-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary:
      'bg-vscode-button text-white hover:bg-vscode-button-hover focus:ring-vscode-accent disabled:opacity-50 disabled:cursor-not-allowed',
    secondary:
      'bg-vscode-sidebar text-vscode-text hover:bg-vscode-hover focus:ring-vscode-accent disabled:opacity-50 disabled:cursor-not-allowed',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

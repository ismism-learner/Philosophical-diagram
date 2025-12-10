
import React from 'react';
import { AppMode } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'modern-primary' | 'modern-secondary';
  isLoading?: boolean;
  mode?: AppMode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  mode = AppMode.CLASSIC,
  disabled,
  ...props 
}) => {
  
  const isModern = mode === AppMode.MODERN;

  // Base Styles
  const baseStyles = isModern 
    ? "relative px-6 py-2 font-modern transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold rounded-sm"
    : "relative px-6 py-2 font-serif transition-all duration-300 flex items-center justify-center gap-2 text-sm tracking-widest border";
  
  const variants = {
    // CLASSIC
    primary: "bg-cinnabar-700 text-paper-50 border-cinnabar-900 hover:bg-cinnabar-900 shadow-md hover:shadow-lg disabled:opacity-70 disabled:grayscale",
    secondary: "bg-paper-50 text-ink-800 border-ink-800 hover:bg-ink-800 hover:text-paper-50 shadow-sm disabled:opacity-50",
    ghost: "bg-transparent border-transparent text-ink-600 hover:text-cinnabar-700 hover:bg-paper-200/50",
    
    // MODERN
    'modern-primary': "bg-modern-accent text-white border border-transparent hover:bg-modern-hover shadow-sm hover:shadow disabled:opacity-50 disabled:shadow-none",
    'modern-secondary': "bg-white text-modern-text border border-modern-border hover:border-modern-accent hover:text-modern-accent shadow-sm disabled:opacity-50",
  };

  // Map generic variants to specific based on mode if not explicitly set
  let effectiveVariant = variant;
  if (isModern) {
    if (variant === 'primary') effectiveVariant = 'modern-primary';
    if (variant === 'secondary') effectiveVariant = 'modern-secondary';
    if (variant === 'ghost') effectiveVariant = 'modern-secondary'; // Map ghost to secondary for now or add specific ghost
  }

  return (
    <button 
      className={`${baseStyles} ${variants[effectiveVariant as keyof typeof variants]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
      
      {/* Classic Decorations */}
      {!isModern && variant === 'primary' && !isLoading && (
        <>
          <span className="absolute top-0.5 left-0.5 w-1 h-1 border-t border-l border-white/50"></span>
          <span className="absolute bottom-0.5 right-0.5 w-1 h-1 border-b border-r border-white/50"></span>
        </>
      )}
    </button>
  );
};

export default Button;
import React, { createContext, useContext, useState, ReactNode, ButtonHTMLAttributes, HTMLAttributes, ReactElement, JSX } from "react";

//alert-dialog reimplementation, functions identical to radix-ui

// manage open state
interface AlertDialogContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType>({
  isOpen: false,
  setIsOpen: () => {},
});

interface AlertDialogProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// subcomponent interaces
interface AlertDialogTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  asChild?: boolean;
}

interface AlertDialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface AlertDialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface AlertDialogFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface AlertDialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

interface AlertDialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

interface AlertDialogActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  asChild?: boolean;
}

interface AlertDialogCancelProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  asChild?: boolean;
}

interface AlertDialogOverlayProps extends HTMLAttributes<HTMLDivElement> {}

// Utility function for class names
const cn = (...classes: (string | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Main AlertDialog component with controlled or uncontrolled state
export function AlertDialog({ children, open, onOpenChange }: AlertDialogProps): JSX.Element {
  const [internalOpen, setInternalOpen] = useState<boolean>(false);
  
  // Use controlled or uncontrolled state based on props
  const isOpen = open !== undefined ? open : internalOpen;
  
  // Create a setter function that respects the controlled/uncontrolled pattern
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };
  
  const contextValue: AlertDialogContextType = {
    isOpen,
    setIsOpen
  };
  
  return (
    <AlertDialogContext.Provider value={contextValue}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// trigger button to open dialog
export function AlertDialogTrigger({ children, asChild, className, ...props }: AlertDialogTriggerProps): JSX.Element {
  const { setIsOpen } = useContext(AlertDialogContext);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as ReactElement<any>, {
      ...props,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        setIsOpen(true);
        if (children.props && typeof children.props === 'object' && 'onClick' in children.props && typeof children.props.onClick === 'function') {
          children.props.onClick(e);
        }
      }
    });
  }
  
  return (
    <button 
      type="button"
      onClick={() => setIsOpen(true)}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
}

// portal simulation
export function AlertDialogPortal({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}

// overlay component
export function AlertDialogOverlay({ className, ...props }: AlertDialogOverlayProps): JSX.Element | null {
  const { isOpen } = useContext(AlertDialogContext);
  
  if (!isOpen) return null;
  
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/60 transition-opacity duration-200",
        isOpen ? "opacity-100" : "opacity-0",
        className
      )}
      {...props}
    />
  );
}

// content component
export function AlertDialogContent({ className, children, ...props }: AlertDialogContentProps): JSX.Element | null {
  const { isOpen, setIsOpen } = useContext(AlertDialogContext);
  
  if (!isOpen) return null;
  
  // handle ESC key press to close dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };
  
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay onClick={() => setIsOpen(false)} />
      <div
        role="alertdialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg bg-[#1A202C] p-6 text-white shadow-lg duration-200 border border-gray-800",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </AlertDialogPortal>
  );
}

// header component
export function AlertDialogHeader({ className, children, ...props }: AlertDialogHeaderProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// footer component
export function AlertDialogFooter({ className, children, ...props }: AlertDialogFooterProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex flex-row justify-end space-x-2 mt-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// title component
export function AlertDialogTitle({ className, children, ...props }: AlertDialogTitleProps): JSX.Element {
  return (
    <h2
      className={cn("text-lg font-semibold text-white", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

//dDescription component
export function AlertDialogDescription({ className, children, ...props }: AlertDialogDescriptionProps): JSX.Element {
  return (
    <p
      className={cn("text-sm text-gray-300", className)}
      {...props}
    >
      {children}
    </p>
  );
}

// action button component
export function AlertDialogAction({ className, children, asChild, onClick, ...props }: AlertDialogActionProps): JSX.Element {
  const { setIsOpen } = useContext(AlertDialogContext);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsOpen(false);
    if (onClick) {
      onClick(e);
    }
  };
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as ReactElement<any>, {
      ...props,
      onClick: handleClick
    });
  }
  
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "px-4 py-2 font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// cancel button component
export function AlertDialogCancel({ className, children, asChild, onClick, ...props }: AlertDialogCancelProps): JSX.Element {
  const { setIsOpen } = useContext(AlertDialogContext);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsOpen(false);
    if (onClick) {
      onClick(e);
    }
  };
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as ReactElement<any>, {
      ...props,
      onClick: handleClick
    });
  }
  
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "px-4 py-2 font-medium rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/50 backdrop-blur-sm">
      <div className="bg-background rounded-xl p-6 shadow-soft w-full max-w-md animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="font-headline font-semibold text-lg md:text-xl">{title}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-background text-xl md:text-2xl leading-none">
            &times;
          </button>
        </div>
        <div className="overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}

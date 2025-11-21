
import React, { createContext, useState, useCallback, ReactNode, useRef } from 'react';

export interface ModalProps {
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'info' | 'success' | 'warning' | 'danger';
    hideCancelButton?: boolean;
}

interface ModalContextType {
    isOpen: boolean;
    modalProps: ModalProps | null;
    showModal: (props: ModalProps) => void;
    hideModal: () => void;
    alert: (props: Pick<ModalProps, 'title' | 'message' | 'confirmVariant'>) => void;
    confirm: (props: Omit<ModalProps, 'onConfirm' | 'onCancel'>) => Promise<boolean>;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [modalProps, setModalProps] = useState<ModalProps | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const showModal = useCallback((props: ModalProps) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setModalProps(props);
        setIsOpen(true);
    }, []);

    const hideModal = useCallback(() => {
        setIsOpen(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // Delay hiding props to allow for fade-out animations
        timeoutRef.current = window.setTimeout(() => {
            setModalProps(null);
            timeoutRef.current = null;
        }, 300);
    }, []);

    const alert = useCallback((props: Pick<ModalProps, 'title' | 'message' | 'confirmVariant'>) => {
        showModal({
            ...props,
            hideCancelButton: true,
        });
    }, [showModal]);

    const confirm = useCallback((props: Omit<ModalProps, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
        return new Promise((resolve) => {
            showModal({
                ...props,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
            });
        });
    }, [showModal]);
    
    return (
        <ModalContext.Provider value={{ isOpen, modalProps, showModal, hideModal, alert, confirm }}>
            {children}
        </ModalContext.Provider>
    );
};

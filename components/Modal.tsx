

import React from 'react';
import { useModal } from '../hooks/useModal';
import CheckCircleIcon from './icons/CheckCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import WarningTriangleIcon from './icons/WarningTriangleIcon';
import XCircleIcon from './icons/XCircleIcon';

const getVariantStyles = (variant: 'info' | 'success' | 'warning' | 'danger') => {
    switch (variant) {
        case 'success':
            return {
                icon: <CheckCircleIcon className="h-6 w-6 text-success" />,
                buttonClass: 'bg-success hover:bg-success-hover focus:ring-success',
            };
        case 'danger':
            return {
                icon: <XCircleIcon className="h-6 w-6 text-danger" />,
                buttonClass: 'bg-danger hover:bg-danger-hover focus:ring-danger',
            };
        case 'warning':
            return {
                icon: <WarningTriangleIcon className="h-6 w-6 text-warning-dark" />,
                buttonClass: 'bg-warning hover:bg-warning-hover focus:ring-warning',
            };
        case 'info':
        default:
            return {
                icon: <InformationCircleIcon className="h-6 w-6 text-info" />,
                buttonClass: 'bg-primary hover:bg-blue-600 focus:ring-blue-500',
            };
    }
};


const Modal: React.FC = () => {
    const { isOpen, modalProps, hideModal } = useModal();

    if (!isOpen || !modalProps) return null;

    const { 
        title, 
        message, 
        onConfirm, 
        onCancel, 
        confirmText, 
        cancelText,
        confirmVariant = 'info',
        hideCancelButton = false,
    } = modalProps;

    const variantStyles = getVariantStyles(confirmVariant);

    const handleConfirm = () => {
        onConfirm?.();
        hideModal();
    };

    const handleCancel = () => {
        onCancel?.();
        hideModal();
    };

    return (
        <div 
            className="fixed inset-0 bg-slate-800 bg-opacity-75 transition-opacity flex items-center justify-center z-50"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-${confirmVariant}-light sm:mx-0 sm:h-10 sm:w-10`}>
                            {variantStyles.icon}
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                            <h3 className="text-base font-semibold leading-6 text-slate-900" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-slate-500">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                        type="button"
                        className={`inline-flex w-full justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors sm:ml-3 sm:w-auto ${variantStyles.buttonClass} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                        onClick={handleConfirm}
                    >
                        {confirmText || (onCancel || onConfirm ? 'Confirmar' : 'OK')}
                    </button>
                    {!hideCancelButton && (onConfirm || onCancel) && (
                         <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto"
                            onClick={handleCancel}
                        >
                            {cancelText || 'Cancelar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;
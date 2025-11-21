

import React, { useState, useRef, useEffect } from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';
import XMarkIcon from './icons/XMarkIcon';

interface MultiSelectProps {
    label: string;
    options: (string | { value: string, label: string })[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(item => item !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    const getDisplayValue = () => {
        if (selected.length === 0) return `Todos`;
        if (selected.length === 1) {
            const selectedOption = options.find(opt => (typeof opt === 'string' ? opt : opt.value) === selected[0]);
            return typeof selectedOption === 'string' ? selectedOption : selectedOption?.label;
        }
        return `${selected.length} selecionados`;
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white relative w-full border border-gray-300 rounded-lg shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
                <span className="block truncate">{getDisplayValue()}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                     <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                </span>
                 {selected.length > 0 && (
                    <span 
                        className="absolute inset-y-0 right-8 flex items-center"
                        onClick={clearSelection}
                    >
                        <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {options.map((option, index) => {
                        const value = typeof option === 'string' ? option : option.value;
                        const label = typeof option === 'string' ? option : option.label;
                        const isSelected = selected.includes(value);

                        return (
                            <div
                                key={index}
                                onClick={() => handleSelect(value)}
                                className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-slate-100 flex items-center"
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                                />
                                <span className={`${isSelected ? 'font-semibold' : 'font-normal'} block truncate`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
'use client';
import { useState, useEffect, useRef } from 'react';
import useDebounce from '@/hooks/useDebounce';
interface EditableProps {
    value: string;
    onChange: (newValue: string) => void;
    disabled?: boolean;
}

export default function EditableTitle({ value, onChange, disabled = false }: EditableProps) {
    // 1. Fast, local state for the input
    const [currentValue, setCurrentValue] = useState(value);
    // 2. Debounced version of the local state
    const debouncedValue = useDebounce(currentValue, 500); // <-- Use the hook
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync prop to local state if prop changes
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // 3. EFFECT: Save to global store *only when debounced value changes*
    useEffect(() => {
        // Only call onChange if the debounced value is different from the original prop
        if (debouncedValue !== value) {
            onChange(debouncedValue); // This calls updateSessionDetails
        }
    }, [debouncedValue, value, onChange]);

    const handleBlur = () => {
        setIsEditing(false);
        // Only call onChange if the value actually changed or is not empty & Save immediately on blur
        if (currentValue.trim() !== value.trim() && currentValue.trim() !== '') {
            onChange(currentValue.trim());
        } else {
            // Reset to original value if input is empty
            setCurrentValue(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setCurrentValue(value); // Revert changes
            setIsEditing(false);
        }
    };

    return (
        <div className="w-full">
            {isEditing && !disabled ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={currentValue}
                    onChange={((e) => setCurrentValue(e.target.value))}
                    placeholder="What are you focusing on?"
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-[#2a2a2a] text-white placeholder-gray-400 rounded-lg px-4 py-3 border border-transparent focus:border-[#8A2BE2] focus:ring-0 outline-none"
                />
            ) : (
                <span
                    onClick={() => !disabled && setIsEditing(true)}
                    className={`block w-full text-white px-4 py-3 rounded-lg cursor-pointer transition hover:bg-[#2a2a2a]/50 ${disabled ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                >
                    {value || 'Focus Session'}
                </span>
            )}
        </div>
    );
}
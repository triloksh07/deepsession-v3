import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import type { Session } from '@/types';

const AutocompleteInput = ({
    value,
    onChange,
    options,
    placeholder
}: {
    value: string,
    onChange: (val: string) => void,
    options: string[],
    placeholder: string
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mouseup", handleClickOutside);
        return () => document.removeEventListener("mouseup", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(value.toLowerCase()) && opt !== value
    );

    return (
        <div className="relative w-full col-span-3" ref={wrapperRef}>
            <Input
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
            />

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                    {filteredOptions.map((opt) => (
                        <div
                            key={opt}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AutocompleteInput;
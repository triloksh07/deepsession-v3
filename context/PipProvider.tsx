"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { TimerDisplay } from "@/app/(authed)/dashboard/_components/TimerDisplay";
import logger from "@/lib/utils/logger";
import { toast } from "sonner";
import { useSessionController } from '@/hooks/controllers/useSessionController';

interface PipContextType {
    isPipActive: boolean;
    togglePip: () => Promise<void>;
}

const PipContext = createContext<PipContextType | undefined>(undefined);

export function PipProvider({ children }: { children: React.ReactNode }) {
    const [pipWindow, setPipWindow] = useState<Window | null>(null);

    // Get Logic from Controller
    const {
        status, isActive, isOnBreak, currentSession,
        startSession, toggleBreak, endSession
    } = useSessionController();

    // Local Form State
    // const [formTitle, setFormTitle] = useState('');
    // const [formType, setFormType] = useState('');

    // const handleStart = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     startSession({
    //         title: formTitle.trim(),
    //         type: formType || 'Other',
    //         notes: ''
    //     } as any);
    // };

    // Helper: Copy CSS to new winddow
    const copyStyles = (win: Window) => {
        [...document.styleSheets].forEach((sheet) => {
            try {
                if (sheet.href) {
                    const link = win.document.createElement("link");
                    link.rel = "stylesheet";
                    link.href = sheet.href;
                    win.document.head.appendChild(link);
                } else {
                    const css = [...sheet.cssRules].map(r => r.cssText).join("");
                    const style = win.document.createElement("style");
                    style.textContent = css;
                    win.document.head.appendChild(style);
                }
            } catch (e) {
                logger.error("Could not copy style:", e);
            }
        });
    };

    // Logic: PiP Toggle
    const togglePip = useCallback(async () => {
        // A: Close if already open
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
            return;
        }

        // B: Check support
        if (!window.documentPictureInPicture) {
            alert("PiP not supported in this browser.");
            return;
        }

        try {
            //  @ts-ignore - Types might be missing for newer API

            // C: Open New Window
            const pip = await window.documentPictureInPicture.requestWindow({
                width: 250,
                height: 120,
            });

            // ⚡ FIX: Force 100% Scale (Disable Virtual Viewport shrinking)
            const meta = pip.document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
            pip.document.head.appendChild(meta);

            // D: Clean Styling
            pip.document.body.style.margin = "0";
            // pip.document.body.style.overflow = "hidden";
            pip.document.body.style.backgroundColor = "black";

            // E: Copy App Styles
            copyStyles(pip);

            // F: Handle Close Event
            pip.addEventListener("pagehide", () => setPipWindow(null));
            setPipWindow(pip);
        } catch (err) {
            toast.error("PiP failed to open!");
            logger.error("PiP failed to open", err);
        }
    }, [pipWindow]);

    // Auto-close if session becomes idle (optional)
    useEffect(() => {
        if (status === "idle" && pipWindow) {
            pipWindow.close();
            setPipWindow(null);
        }
    }, [status, pipWindow]);

    return (
        <PipContext.Provider value={{ isPipActive: !!pipWindow, togglePip }}>
            {children}
            {/* THE GLOBAL PORTAL: Renders Timer into PiP Window if active */}
            {pipWindow && createPortal(
                <TimerDisplay
                    isActive={isActive}
                    isOnBreak={isOnBreak}
                    currentPhase={currentSession.phase}
                    status={status}
                    // Pass Controls
                    onToggleBreak={toggleBreak}
                    onEndSession={endSession}
                    isPipActive={true} // 👈 Triggers "HUD" mode
                />,
                pipWindow.document.body
            )}
        </PipContext.Provider>
    );
}

export const usePip = () => {
    const context = useContext(PipContext);
    if (!context) throw new Error("usePip must be used within PipProvider");
    return context;
}
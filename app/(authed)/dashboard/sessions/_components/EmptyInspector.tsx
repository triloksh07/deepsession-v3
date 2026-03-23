// _components/EmptyInspector.tsx
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export function EmptyInspectorState() {

    return (
        <Card className="h-full flex flex-col overflow-hidden border-border/50 shadow-md transition-all">
            <div className="h-full border border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm">Select a session to view or edit details</p>
            </div>
        </Card>
    );

}
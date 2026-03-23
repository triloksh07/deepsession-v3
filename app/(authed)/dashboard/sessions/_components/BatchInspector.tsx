// _components/BatchInspector.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layers } from 'lucide-react';
import { toast } from 'sonner';
import AutocompleteInput from '@/app/(authed)/dashboard/_components/AutoCompleteInput';
import { BatchUpdateIntent } from '@/hooks/CRUD/useSessionMutations';

interface BatchEditorPanelProps {
    selectedCount: number;
    filterOptions: {
        activities: string[];
        sources: string[];
        topics: string[];
    };
    onCancel: () => void;
    onApply: (intent: BatchUpdateIntent) => void;
}

export function BatchEditorPanel({ selectedCount, filterOptions, onCancel, onApply }: BatchEditorPanelProps) {
    // ISOLATED BATCH FORM STATE
    const [batchActivity, setBatchActivity] = useState('');
    const [batchSource, setBatchSource] = useState('');
    const [batchTopics, setBatchTopics] = useState('');
    const [isAppendingTopics, setIsAppendingTopics] = useState(true);

    const handleApply = () => {
        const parsedTopics = batchTopics.split(',').map(t => t.trim()).filter(Boolean);
        const intent: BatchUpdateIntent = {
            appendTopics: isAppendingTopics,
        };

        // Only attach fields if the user actually typed something
        if (parsedTopics.length > 0) intent.topics = parsedTopics;
        if (batchActivity.trim() !== '') intent.activity = batchActivity.trim();
        if (batchSource.trim() !== '') intent.source = batchSource.trim();

        // Prevent empty batches
        if (Object.keys(intent).length === 1) { // Only appendTopics is there
            toast.error("Nothing to update", { description: "All fields are blank." });
            return;
        }

        // Fire the update to the parent
        onApply(intent);

        // Reset the form for next time
        setBatchActivity('');
        setBatchSource('');
        setBatchTopics('');
        setIsAppendingTopics(true);
    };

    return (
        <Card className="h-full flex flex-col border-[#8A2BE2]/50 shadow-md bg-[#8A2BE2]/5 overflow-hidden transition-all">
            <CardHeader className="border-b pb-4 shrink-0 bg-background/50">
                <CardTitle className="text-xl flex items-center gap-2 text-[#8A2BE2]">
                    <Layers className="w-5 h-5" />
                    Batch Editing {selectedCount} Sessions
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                    Apply taxonomy updates to all selected items simultaneously.
                </p>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-6 py-2">
                    {/* TOPICS ZONE */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="batch-topics" className="text-right mt-3">Topics</Label>
                        <div className="col-span-3 space-y-3">
                            <Input
                                id="batch-topics"
                                value={batchTopics}
                                onChange={(e) => setBatchTopics(e.target.value)}
                                placeholder="Leave blank to keep existing topics..."
                                className="bg-background"
                            />
                            
                            {/* QUICK ADD PILLS */}
                            {filterOptions.topics.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {filterOptions.topics.map(topic => (
                                        <Badge
                                            key={topic}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-[#8A2BE2] hover:text-white transition-colors bg-background"
                                            onClick={() => {
                                                const current = batchTopics.split(',').map(t => t.trim()).filter(Boolean);
                                                if (!current.includes(topic)) {
                                                    setBatchTopics(current.length ? `${batchTopics}, ${topic}` : topic);
                                                }
                                            }}
                                        >
                                            + {topic}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* THE MERGE CONTROLLER */}
                            {batchTopics.trim() !== '' && (
                                <div className="flex items-center space-x-2 bg-background p-3 rounded-md border text-sm shadow-sm">
                                    <input
                                        type="checkbox"
                                        id="append-toggle"
                                        checked={isAppendingTopics}
                                        onChange={(e) => setIsAppendingTopics(e.target.checked)}
                                        className="accent-[#8A2BE2] w-4 h-4 cursor-pointer"
                                    />
                                    <label htmlFor="append-toggle" className="cursor-pointer font-medium select-none">
                                        {isAppendingTopics
                                            ? "Keep existing topics and append these"
                                            : <span className="text-destructive font-bold">Overwrite all existing topics</span>}
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ACTIVITY ZONE */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Activity</Label>
                        <div className="col-span-3">
                            <AutocompleteInput
                                value={batchActivity}
                                onChange={setBatchActivity}
                                options={filterOptions.activities}
                                placeholder="Leave blank to keep existing..."
                            />
                        </div>
                    </div>

                    {/* SOURCE ZONE */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Source</Label>
                        <div className="col-span-3">
                            <AutocompleteInput
                                value={batchSource}
                                onChange={setBatchSource}
                                options={filterOptions.sources}
                                placeholder="Leave blank to keep existing..."
                            />
                        </div>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 border-t shrink-0 flex justify-between bg-background/50">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button className="bg-[#8A2BE2] hover:bg-[#5D3FD3]" onClick={handleApply}>
                    Apply to {selectedCount} Sessions
                </Button>
            </CardFooter>
        </Card>
    );
}
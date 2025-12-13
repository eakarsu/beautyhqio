"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Edit, Trash2, Pin } from "lucide-react";

interface Note {
  id: string;
  content: string;
  isPinned?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

interface NotesPanelProps {
  notes: Note[];
  onAdd: (content: string) => Promise<void>;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePin?: (id: string) => Promise<void>;
}

export function NotesPanel({ notes, onAdd, onEdit, onDelete, onTogglePin }: NotesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    setIsLoading(true);
    try {
      await onAdd(newNote);
      setNewNote("");
      setIsAdding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    setIsLoading(true);
    try {
      await onEdit(id, editContent);
      setEditingId(null);
      setEditContent("");
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Notes</CardTitle>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="mb-4 space-y-2">
            <Textarea
              placeholder="Write a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewNote("");
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd} disabled={isLoading || !newNote.trim()}>
                {isLoading ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          {sortedNotes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No notes yet</p>
          ) : (
            <div className="space-y-4">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className={`border rounded-lg p-4 ${note.isPinned ? "border-primary bg-primary/5" : ""}`}
                >
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingId(null);
                            setEditContent("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleEdit(note.id)}
                          disabled={isLoading || !editContent.trim()}
                        >
                          {isLoading ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          {note.createdBy && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {note.createdBy.firstName?.[0]}{note.createdBy.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            {note.createdBy && (
                              <p className="text-sm font-medium">
                                {note.createdBy.firstName} {note.createdBy.lastName}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(note.createdAt)}
                              {note.updatedAt && note.updatedAt !== note.createdAt && " (edited)"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {note.isPinned && (
                            <Pin className="h-4 w-4 text-primary" />
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEdit(note)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {onTogglePin && (
                                <DropdownMenuItem onClick={() => onTogglePin(note.id)}>
                                  <Pin className="h-4 w-4 mr-2" />
                                  {note.isPinned ? "Unpin" : "Pin"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDelete(note.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="mt-2 text-sm whitespace-pre-wrap">{note.content}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

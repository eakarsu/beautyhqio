"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Paperclip,
  Upload,
  Image,
  FileText,
  File,
  Trash2,
  Download,
  Eye,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface Attachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  category?: string;
  description?: string;
  uploadedAt: string;
}

interface AttachmentsPanelProps {
  clientId: string;
}

const FILE_CATEGORIES = [
  { value: "photo", label: "Photo" },
  { value: "consent", label: "Consent Form" },
  { value: "medical", label: "Medical History" },
  { value: "before_after", label: "Before/After" },
  { value: "reference", label: "Reference Image" },
  { value: "other", label: "Other" },
];

export function AttachmentsPanel({ clientId }: AttachmentsPanelProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
  }, [clientId]);

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/attachments`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`/api/clients/${clientId}/attachments`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          fetchAttachments();
        }
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/attachments/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return Image;
    if (fileType.includes("pdf")) return FileText;
    return File;
  };

  const isImage = (fileType: string) => fileType.startsWith("image/");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Attachments
        </CardTitle>
        <CardDescription>Photos, documents, and files for this client</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center mb-6 transition-colors ${
            dragActive ? "border-rose-500 bg-rose-50" : "border-gray-200"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
            accept="image/*,.pdf,.doc,.docx"
          />
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop files here, or
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Browse Files"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supports images, PDFs, and documents up to 10MB
          </p>
        </div>

        {/* Attachments Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading attachments...
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No attachments yet</p>
            <p className="text-sm">Upload photos, consent forms, or reference images</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.fileType);
              return (
                <div
                  key={attachment.id}
                  className="border rounded-lg overflow-hidden hover:border-rose-500 transition-colors group"
                >
                  {isImage(attachment.fileType) ? (
                    <div
                      className="aspect-square bg-muted relative cursor-pointer"
                      onClick={() => setPreviewAttachment(attachment)}
                    >
                      <img
                        src={attachment.url}
                        alt={attachment.fileName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="aspect-square bg-muted flex items-center justify-center cursor-pointer"
                      onClick={() => window.open(attachment.url, "_blank")}
                    >
                      <FileIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.fileSize)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => window.open(attachment.url, "_blank")}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600"
                          onClick={() => handleDelete(attachment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {attachment.category && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {FILE_CATEGORIES.find((c) => c.value === attachment.category)?.label}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewAttachment} onOpenChange={() => setPreviewAttachment(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{previewAttachment?.fileName}</DialogTitle>
              <DialogDescription>
                Uploaded {previewAttachment && format(new Date(previewAttachment.uploadedAt), "MMM d, yyyy")}
              </DialogDescription>
            </DialogHeader>
            {previewAttachment && (
              <div className="flex justify-center">
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.fileName}
                  className="max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewAttachment(null)}>
                Close
              </Button>
              <Button onClick={() => window.open(previewAttachment?.url, "_blank")}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

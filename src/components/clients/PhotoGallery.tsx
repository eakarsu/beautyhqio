"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Camera, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  type: string;
  description?: string | null;
  takenAt?: Date | string | null;
  createdAt: Date | string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onUpload: (file: File, type: string, description?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PhotoGallery({ photos, onUpload, onDelete }: PhotoGalleryProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState("BEFORE");
  const [description, setDescription] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUpload(file, uploadType, description);
      setDescription("");
    } finally {
      setIsUploading(false);
    }
  };

  const openLightbox = (photo: Photo) => {
    setSelectedPhoto(photo);
    setLightboxOpen(true);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (!selectedPhoto) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhoto.id);
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < photos.length) {
      setSelectedPhoto(photos[newIndex]);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const typeColors: Record<string, string> = {
    BEFORE: "bg-orange-100 text-orange-800",
    AFTER: "bg-green-100 text-green-800",
    PROGRESS: "bg-blue-100 text-blue-800",
    INSPIRATION: "bg-purple-100 text-purple-800",
  };

  const beforePhotos = photos.filter((p) => p.type === "BEFORE");
  const afterPhotos = photos.filter((p) => p.type === "AFTER");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Photo Gallery</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Photo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Photo Type</Label>
                <div className="flex gap-2">
                  {["BEFORE", "AFTER", "PROGRESS", "INSPIRATION"].map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={uploadType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUploadType(type)}
                    >
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes about this photo..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Select Photo</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="photo"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isUploading ? "Uploading..." : "Click to upload"}
                      </p>
                    </div>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No photos yet</p>
        ) : (
          <div className="space-y-6">
            {/* Before/After Comparison */}
            {beforePhotos.length > 0 && afterPhotos.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Before & After</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Badge className={typeColors.BEFORE + " mb-2"}>Before</Badge>
                    <img
                      src={beforePhotos[0].url}
                      alt="Before"
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => openLightbox(beforePhotos[0])}
                    />
                  </div>
                  <div>
                    <Badge className={typeColors.AFTER + " mb-2"}>After</Badge>
                    <img
                      src={afterPhotos[0].url}
                      alt="After"
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => openLightbox(afterPhotos[0])}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* All Photos Grid */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">All Photos ({photos.length})</h4>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.description || "Client photo"}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => openLightbox(photo)}
                    />
                    <Badge
                      className={`absolute top-1 left-1 text-xs ${typeColors[photo.type] || "bg-gray-100"}`}
                    >
                      {photo.type}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(photo.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl">
            {selectedPhoto && (
              <div className="relative">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.description || "Photo"}
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 bg-black/20 hover:bg-black/40 text-white"
                    onClick={() => navigatePhoto("prev")}
                    disabled={photos.findIndex((p) => p.id === selectedPhoto.id) === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 bg-black/20 hover:bg-black/40 text-white"
                    onClick={() => navigatePhoto("next")}
                    disabled={photos.findIndex((p) => p.id === selectedPhoto.id) === photos.length - 1}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={typeColors[selectedPhoto.type] || "bg-gray-100"}>
                      {selectedPhoto.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(selectedPhoto.createdAt)}
                    </span>
                  </div>
                  {selectedPhoto.description && (
                    <p className="text-sm">{selectedPhoto.description}</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

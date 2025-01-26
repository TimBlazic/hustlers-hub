"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Alert } from "@/components/ui/alert";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import { Database } from "@/types/database.types";

interface GigFormData {
  title: string;
  description: string;
  price: number;
  category: string;
  images: File[]; // Spremenimo v File[] namesto string[]
  imageUrls: string[]; // Dodamo za prikaz
}

interface ImageUploadProps {
  images: File[];
  imageUrls: string[];
  onImagesChange: (images: File[], imageUrls: string[]) => void;
  isUploading: boolean;
}

function ImageUpload({
  images,
  imageUrls,
  onImagesChange,
  isUploading,
}: ImageUploadProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const MAX_IMAGES = 5;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > MAX_IMAGES) {
      alert(`You can only upload up to ${MAX_IMAGES} images`);
      return;
    }

    const newFiles: File[] = [];
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 5MB`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        alert(`File ${file.name} is not an image`);
        continue;
      }

      // Create local URL for preview
      const url = URL.createObjectURL(file);
      newFiles.push(file);
      newUrls.push(url);
    }

    onImagesChange([...images, ...newFiles], [...imageUrls, ...newUrls]);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newFiles = [...images];
    const newUrls = [...imageUrls];

    const draggedFile = newFiles[draggedIndex];
    const draggedUrl = newUrls[draggedIndex];

    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);

    newUrls.splice(draggedIndex, 1);
    newUrls.splice(index, 0, draggedUrl);

    onImagesChange(newFiles, newUrls);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRemove = (index: number) => {
    const newFiles = images.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    URL.revokeObjectURL(imageUrls[index]); // Cleanup URL
    onImagesChange(newFiles, newUrls);
  };

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      imageUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {imageUrls.map((url, index) => (
          <div
            key={url}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className="relative group aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
          >
            <Image
              src={url}
              alt={`Image ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
                  />
                </svg>
              </button>
              <div className="absolute bottom-2 left-2 text-white text-sm">
                Drag to reorder
              </div>
            </div>
          </div>
        ))}

        {/* Upload Button */}
        {images.length < MAX_IMAGES && (
          <label className="relative aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <svg
                className="w-8 h-8 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="text-sm">
                {isUploading ? "Uploading..." : "Add Images"}
              </span>
            </div>
          </label>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Drag images to reorder. Click the X to remove. Maximum 5 images.
      </p>
    </div>
  );
}

const CATEGORIES = [
  "Development",
  "Marketing",
  "Design",
  "Video",
  "Writing",
  "Consulting",
  "Other",
];

export function GigForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<GigFormData>({
    title: "",
    description: "",
    price: 0,
    category: CATEGORIES[0],
    images: [],
    imageUrls: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Najprej naložimo slike v Supabase
      const uploadedUrls: string[] = [];
      const supabase = createClientComponentClient<Database>();

      // Pridobi trenutnega uporabnika
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      for (const file of formData.images) {
        const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
        // Uporabi user.id kot ime datoteke
        const fileName = `${session.user.id}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("gigs-images")
          .upload(`${session.user.id}/${Date.now()}.${fileExt}`, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("gigs-images").getPublicUrl(data?.path || "");

        uploadedUrls.push(publicUrl);
      }

      // Nato pošljemo podatke na API
      const response = await fetch("/api/gigs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          images: uploadedUrls,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error creating gig");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/marketplace");
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}
      {success && (
        <Alert
          type="success"
          message="Gig created successfully! Redirecting..."
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-8">
          {/* Title Section */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Be clear and descriptive about what you're offering
                </p>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-2 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Professional Web Development with React"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Provide detailed information about your service
                </p>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={6}
                  className="mt-2 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent transition-colors"
                  placeholder="Describe what you'll deliver, your process, timeline, etc."
                />
              </div>
            </div>
          </div>

          {/* Pricing & Category Section */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Pricing & Category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Price (SOL)
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Set a competitive price for your service
                </p>
                <div className="mt-2 relative">
                  <input
                    type="number"
                    required
                    min="0,0004"
                    step="0,01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 pl-4 pr-12 py-2.5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent transition-colors"
                    placeholder="0,00"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      SOL
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose the most relevant category
                </p>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="mt-2 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent transition-colors"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
              Images
            </h2>
            <ImageUpload
              images={formData.images}
              imageUrls={formData.imageUrls}
              onImagesChange={(images, imageUrls) =>
                setFormData({ ...formData, images, imageUrls })
              }
              isUploading={isLoading}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => router.push("/marketplace")}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center px-6 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2" />
                Creating...
              </>
            ) : (
              "Create Gig"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  pfp_url: string | null;
}

interface AccountSettingsProps {
  user: DbUser;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.pfp_url);
  const [name, setName] = useState<string | null>(user.name);

  const supabase = createClientComponentClient();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsLoading(true);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, {
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      // Update user metadata in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { pfp_url: data.publicUrl },
      });

      if (updateError) {
        throw updateError;
      }

      // Update user in database
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pfp_url: data.publicUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user in database");
      }

      setAvatarUrl(data.publicUrl);
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error updating avatar"
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Update user metadata in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: name },
      });

      if (updateError) {
        throw updateError;
      }

      // Update user in database
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user in database");
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error updating profile"
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 bg-white rounded-lg p-8 max-w-2xl"
    >
      <div className="flex flex-col items-center">
        <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name || "Profile picture"}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <UserIcon className="h-8 w-8 m-4 text-gray-400" />
          )}
        </div>
        <button
          type="button"
          onClick={() => document.getElementById("avatar-input")?.click()}
          className="mt-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Change Photo
        </button>
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          disabled={isLoading}
          className="hidden"
        />
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-600"
          >
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={name || ""}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            className="mt-1 block w-full rounded-md border-gray-200
              bg-white text-gray-900 px-3 py-2
              focus:border-gray-300 focus:ring-0
              disabled:opacity-50 disabled:cursor-not-allowed
              text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-600"
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={user.email || ""}
            disabled
            className="mt-1 block w-full rounded-md border-gray-200
              bg-gray-50 text-gray-500 px-3 py-2
              cursor-not-allowed text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md
            hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}

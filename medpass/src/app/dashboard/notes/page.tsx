"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/navbar";

interface UploadedFile {
  file: File;
  name: string;
}

interface S3File {
  key: string;
  size_kb: number;
  last_modified: string;
}

export default function NotesPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => redirect("/auth/login"),
  });
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<S3File[]>([]);
  const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notes`;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        name: file.name,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFilenameChange = (index: number, newName: string) => {
    setFiles((prev) => {
      const updated = [...prev];
      updated[index].name = newName;
      return updated;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchUploadedFiles = async () => {
    if (!session?.accessToken) return;
    const res = await fetch(`${API_BASE}/list/`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUploadedFiles(data);
    }
  };

  const handleUpload = async () => {
    if (!session?.accessToken) return;
    const formData = new FormData();
    files.forEach((f) => formData.append("file", f.file, f.name));
    const res = await fetch(`${API_BASE}/upload/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: formData,
    });
    if (res.ok) {
      setFiles([]);
      fetchUploadedFiles();
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUploadedFiles();
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-900 text-foreground flex">
      <Sidebar />
      <div className="w-full max-w-3xl mx-auto p-4">
        <Card className="bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white">Upload Notes</CardTitle>
            <CardDescription className="text-gray-400">
              Select files and edit filenames before uploading.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 hover:border-blue-400 transition-colors duration-200"
            >
              <p className="text-gray-400">Click or drag files here</p>
              <input
                id="dropzone-file"
                type="file"
                multiple
                className="hidden"
                onChange={handleFilesChange}
              />
            </label>

            {files.length > 0 && (
              <div className="space-y-4">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Input
                      value={f.name}
                      onChange={(e) => handleFilenameChange(idx, e.target.value)}
                      className="text-white flex-1 bg-gray-800 border-gray-600"
                    />
                    <Button variant="destructive" onClick={() => removeFile(idx)}>
                      X
                    </Button>
                  </div>
                ))}
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleUpload}>
                  Upload Files
                </Button>
              </div>
            )}

            <div className="pt-8">
              <h2 className="text-lg font-semibold text-white">Uploaded Notes</h2>
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="text-gray-300 border-b border-gray-700 pb-2">
                    <p className="text-white font-medium">{file.key.split("/").pop()}</p>
                    <p className="text-sm">Size: {file.size_kb} KB</p>
                    <p className="text-sm">
                      Uploaded: {new Date(file.last_modified).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, FileText, ImageIcon } from "lucide-react"
import { uploadClientDocument, getPublicUrl } from "@/lib/supabase/storage"

interface FileUploadProps {
  onFileUploaded: (url: string) => void
  currentUrl?: string
  clientId?: string
  disabled?: boolean
}

export function FileUpload({ onFileUploaded, currentUrl, clientId, disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      alert("Solo se permiten archivos JPG, PNG o PDF")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo no puede ser mayor a 5MB")
      return
    }

    try {
      setUploading(true)

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => setPreviewUrl(e.target?.result as string)
        reader.readAsDataURL(file)
      }

      // Upload file
      const tempClientId = clientId || `temp-${Date.now()}`
      const data = await uploadClientDocument(file, tempClientId)
      const publicUrl = getPublicUrl(data.path)

      onFileUploaded(publicUrl)
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("Error al subir el archivo")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const clearFile = () => {
    setPreviewUrl(null)
    onFileUploaded("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const isImage =
    previewUrl &&
    (previewUrl.includes(".jpg") ||
      previewUrl.includes(".jpeg") ||
      previewUrl.includes(".png") ||
      previewUrl.startsWith("data:image"))
  const isPdf = previewUrl && previewUrl.includes(".pdf")

  return (
    <div className="space-y-4">
      <Label>Foto del Documento</Label>

      {!previewUrl ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">Arrastra y suelta un archivo aquí, o haz clic para seleccionar</p>
          <p className="text-xs text-gray-500">JPG, PNG o PDF (máximo 5MB)</p>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative border rounded-lg p-4 bg-gray-50">
            {isImage ? (
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="max-w-full h-32 object-contain mx-auto rounded"
              />
            ) : isPdf ? (
              <div className="flex items-center justify-center h-32">
                <FileText className="h-16 w-16 text-red-500" />
                <span className="ml-2 text-sm text-gray-600">Documento PDF</span>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <ImageIcon className="h-16 w-16 text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">Documento subido</span>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 bg-transparent"
              onClick={clearFile}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              Cambiar archivo
            </Button>
            {previewUrl && (
              <Button type="button" variant="outline" size="sm" onClick={() => window.open(previewUrl, "_blank")}>
                Ver archivo
              </Button>
            )}
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      )}

      {uploading && (
        <div className="text-sm text-blue-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Subiendo archivo...
        </div>
      )}
    </div>
  )
}

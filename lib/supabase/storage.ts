import { createClient } from "@/lib/supabase/client"

export async function uploadClientDocument(file: File, clientId: string) {
  const supabase = createClient()

  // Generate unique filename
  const fileExt = file.name.split(".").pop()
  const fileName = `${clientId}-${Date.now()}.${fileExt}`
  const filePath = `documents/${fileName}`

  const { data, error } = await supabase.storage.from("client-documents").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    throw error
  }

  return data
}

export function getPublicUrl(path: string) {
  const supabase = createClient()

  const { data } = supabase.storage.from("client-documents").getPublicUrl(path)

  return data.publicUrl
}

export async function deleteFile(path: string) {
  const supabase = createClient()

  const { error } = await supabase.storage.from("client-documents").remove([path])

  if (error) {
    throw error
  }
}

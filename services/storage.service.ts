import { createClient } from '@/lib/supabase-client'

/**
 * uploadReceipt
 * Uploads a receipt file to Supabase Storage
 * @param file - The file to upload
 * @param agentId - The agent ID (used for folder path)
 * @returns Public URL of the uploaded file, or null if upload fails
 */
export async function uploadReceipt(file: File, agentId: string): Promise<string | null> {
  try {
    const supabase = createClient()

    // Create a unique filename with timestamp
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${agentId}/${timestamp}.${ext}`

    // Read file content
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // If the bucket doesn't exist, return null (receipt is optional)
      if (uploadError.message.includes('bucket') || uploadError.message.includes('54001')) {
        console.warn('Receipt bucket not found - receipts are optional. Expense will be saved without receipt.')
        return null
      }
      return null
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName)

    return urlData?.publicUrl ?? null
  } catch (err) {
    console.error('Error uploading receipt:', err)
    return null
  }
}

/**
 * deleteReceipt
 * Deletes a receipt file from Supabase Storage
 * @param receiptUrl - The public URL of the file to delete
 * @returns Success status
 */
export async function deleteReceipt(receiptUrl: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Extract the path from the public URL
    // URL format: https://zyazywhjqcbcmupjdxob.supabase.co/storage/v1/object/public/receipts/agentId/timestamp.ext
    const urlParts = receiptUrl.split('/receipts/')
    if (urlParts.length < 2) {
      console.error('Invalid receipt URL format')
      return false
    }

    const filePath = urlParts[1]
    
    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from('receipts')
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error deleting receipt:', err)
    return false
  }
}

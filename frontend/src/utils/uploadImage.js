import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../config/firebase'

/**
 * Upload an image file to Firebase Storage and return its public URL
 * @param {File} file - The image file to upload
 * @param {string} folder - Folder path (e.g. 'events', 'passes')
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export async function uploadBannerImage(file, folder = 'banners') {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPG, PNG, GIF, WebP)')
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `banners/${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const storageRef = ref(storage, filename)

  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

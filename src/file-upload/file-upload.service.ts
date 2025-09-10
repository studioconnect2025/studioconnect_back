import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class FileUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  /**
   * Sube un archivo a Cloudinary.
   * @param file Archivo de multer
   * @param folder Carpeta opcional en Cloudinary
   * @returns Promise con la info del archivo subido
   */
  uploadFile(file: Express.Multer.File, folder: string = 'studios'): Promise<UploadApiResponse> {
    // Validar tipo de archivo
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Solo se permiten imágenes o PDF.');
    }

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary returned an empty result.'));
          }
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Elimina un archivo de Cloudinary usando su public_id
   * @param publicId El public_id del archivo en Cloudinary
   * @returns Promise con el resultado de la eliminación
   */
  async deleteFile(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new BadRequestException(`Error al eliminar archivo: ${error.message}`);
    }
  }

  /**
   * Elimina múltiples archivos de Cloudinary
   * @param publicIds Array de public_ids de los archivos
   * @returns Promise con los resultados de las eliminaciones
   */
  async deleteFiles(publicIds: string[]): Promise<any[]> {
    try {
      const deletePromises = publicIds.map(publicId => this.deleteFile(publicId));
      return await Promise.all(deletePromises);
    } catch (error) {
      throw new BadRequestException(`Error al eliminar archivos: ${error.message}`);
    }
  }
}
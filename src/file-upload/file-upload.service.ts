import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class FileUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      if (folder === 'pdfs') {
        const isPdf = file.mimetype === 'application/pdf' || 
                     file.originalname.toLowerCase().endsWith('.pdf');
        
        if (!isPdf) {
          return reject(new BadRequestException(
            `Solo se permiten archivos PDF. Recibido: ${file.mimetype}`
          ));
        }
      }

      const uploadOptions: any = {
        resource_type: folder === 'pdfs' ? 'raw' : 'image',
        folder,
        // --- 🔥 SOLUCIÓN DEFINITIVA ---
        // Forzamos a Cloudinary a usar el preset que configuramos como público.
        // Asegúrate de que el nombre 'ml_default' coincida exactamente con tu preset.
        upload_preset: 'ml_default',
      };

      if (folder === 'pdfs') {
        const filename = file.originalname.replace(/\.[^/.]+$/, '');
        uploadOptions.public_id = `${filename}_${Date.now()}`;
        uploadOptions.format = 'pdf';
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Error uploading to Cloudinary:', error);
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Upload failed, result is undefined'));
          }
          console.log('✅ Upload successful with preset "ml_default":', {
            public_id: result.public_id,
            secure_url: result.secure_url,
          });
          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async getPublicPdfUrl(publicId: string): Promise<{ inline: string; download: string }> {
    try {
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: 'raw'
      });
      
      console.log('📄 PDF Resource found:', { public_id: resource.public_id });

      const inlineUrl = cloudinary.utils.url(publicId, {
        resource_type: 'raw',
        secure: true,
      });

      const downloadUrl = cloudinary.utils.url(publicId, {
        resource_type: 'raw',
        secure: true,
        flags: 'attachment'
      });

      console.log('🔗 Generated URLs:', { inline: inlineUrl, download: downloadUrl });

      return { inline: inlineUrl, download: downloadUrl };

    } catch (error) {
      console.error('❌ Error getting PDF URLs:', error);
      
      if (error.error?.http_code === 404) {
        throw new NotFoundException(
          `PDF no encontrado en Cloudinary con Public ID: ${publicId}.`
        );
      }
      
      throw new InternalServerErrorException(`Error al obtener URLs del PDF: ${error.message}`);
    }
  }

  // ... (El resto de los métodos no cambian)
  async getPublicImageUrl(publicId: string): Promise<string> {
    return cloudinary.utils.url(publicId, {
      resource_type: 'image',
      secure: true,
    });
  }

  async checkFileExists(publicId: string, resourceType: 'image' | 'raw' = 'raw'): Promise<boolean> {
    try {
      await cloudinary.api.resource(publicId, { resource_type: resourceType });
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'raw' | 'auto' = 'auto'): Promise<any> {
    try {
      return await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType as any,
      });
    } catch (error) {
      throw new BadRequestException(`Error al eliminar archivo: ${error.message}`);
    }
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private lastRequestAt = 0;
  private readonly minInterval = 1100; // ms: >=1s para Nominatim
  private readonly cache = new Map<string, { lat: number; lng: number; ts: number }>();
  private readonly cacheTTL = 1000 * 60 * 60 * 24; // 24h

  private userAgent: string;
  private email?: string;

  constructor(private configService: ConfigService) {
    this.userAgent = this.configService.get<string>('NOMINATIM_USER_AGENT') || 'mi-app/1.0';
    this.email = this.configService.get<string>('NOMINATIM_EMAIL');
  }

  private sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  private async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestAt;
    if (elapsed < this.minInterval) await this.sleep(this.minInterval - elapsed);
    this.lastRequestAt = Date.now();
  }

  private cacheKey(address: string) {
    return address.trim().toLowerCase();
  }

  // 🔹 Método 1: Query completa con q=
  async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!address || !address.trim()) return null;

    const key = this.cacheKey(address);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.ts < this.cacheTTL) {
      return { lat: cached.lat, lng: cached.lng };
    }

    await this.throttle();

    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 0,
          email: this.email,
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'es',
        },
        timeout: 8000,
      });

      const body = res.data;
      if (!Array.isArray(body) || body.length === 0) return null;

      const lat = parseFloat(body[0].lat);
      const lng = parseFloat(body[0].lon);

      this.cache.set(key, { lat, lng, ts: Date.now() });
      return { lat, lng };
    } catch (err) {
      this.logger.warn(`Geocoding (q) failed for "${address}": ${err?.message ?? err}`);
      return null;
    }
  }

  // 🔹 Método 2: Query estructurada con street/city/state/country/postalcode
  async geocodeStructured(profile: {
    calle?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    codigoPostal?: string;
  }): Promise<{ lat: number; lng: number } | null> {
    await this.throttle();

    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          street: profile.calle,
          city: profile.ciudad,
          state: profile.provincia,
          country: profile.pais,
          postalcode: profile.codigoPostal,
          format: 'json',
          limit: 1,
          addressdetails: 0,
          email: this.email,
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'es',
        },
        timeout: 8000,
      });

      const body = res.data;
      if (!Array.isArray(body) || body.length === 0) return null;

      return {
        lat: parseFloat(body[0].lat),
        lng: parseFloat(body[0].lon),
      };
    } catch (err) {
      this.logger.warn(`Geocoding (structured) failed: ${err?.message ?? err}`);
      return null;
    }
  }

  // 🔹 Método 3: Wrapper que prueba primero structured y luego q
  async geocodeProfile(profile: {
    calle?: string;
    ciudad?: string;
    provincia?: string;
    pais?: string;
    codigoPostal?: string;
  }): Promise<{ lat: number; lng: number } | null> {
    // Intento structured
    const structured = await this.geocodeStructured(profile);
    if (structured) {
      this.logger.debug(`Geocoding structured OK: ${JSON.stringify(structured)}`);
      return structured;
    }

    // Fallback a q
    const query = [profile.calle, profile.ciudad, profile.provincia, profile.pais, profile.codigoPostal]
      .filter(Boolean)
      .join(', ');

    const fallback = await this.geocode(query);
    if (fallback) {
      this.logger.debug(`Geocoding fallback OK: ${JSON.stringify(fallback)}`);
    }
    return fallback;
  }

  async geocodeWithFallback(address: string): Promise<{ lat: number; lng: number } | null> {
  const attempts = [
    address,
    // Quita código postal si existe al final
    address.replace(/, [A-Z0-9]+$/i, ''),
    // Quita último elemento
    address.split(',').slice(0, -1).join(','),
  ];

  for (const q of attempts) {
    const res = await this.geocode(q);
    if (res) return res;
  }

  this.logger.warn(`No se pudo geocodificar ninguna versión de "${address}"`);
  return null;
}
}

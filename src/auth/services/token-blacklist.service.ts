import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Agrega un token a la lista negra.
   * @param token El token JWT a invalidar.
   * @param exp La fecha de expiración del token (en segundos desde epoch).
   */
  async blacklist(token: string, exp: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const ttl = exp - now; // Time-to-live en segundos

    if (ttl > 0) {
      // Guardamos el token en Redis con un TTL igual al tiempo que le queda de vida.
      // El valor 'blacklisted' es solo un placeholder.
      await this.cacheManager.set(token, 'blacklisted', ttl * 1000); // ttl en milisegundos
    }
  }

  /**
   * Verifica si un token está en la lista negra.
   * @param token El token JWT a verificar.
   * @returns true si el token está en la lista, false en caso contrario.
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get(token);
    return !!result; // Devuelve true si encuentra algo, false si no.
  }
}

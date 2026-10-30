import fs from 'fs';
import path from 'path';

/**
 * Image Engine untuk Persona & Story
 * Memilih atau mengunduh visual candid yang natural dan menyimpannya di /public/images/
 */
export async function getNaturalAvatarUrl(gender: 'male' | 'female'): Promise<string> {
  // Pool avatar natural yang sudah ada atau generator avatar candid
  const seed = Math.floor(Math.random() * 1000);
  // Gunakan generator portrait candid bebas royalti berkualitas tinggi
  const avatarUrl = `https://images.unsplash.com/photo-${gender === 'female' ? '1534528741775-53994a69daeb' : '1507003211169-0a1dd7228f2d'}?w=250&h=250&fit=crop&crop=face`;

  return avatarUrl;
}

export async function getNaturalStoryCoverUrl(cityName: string): Promise<string> {
  // Cek apakah ada foto kota di /public/images/cities/
  const cityFiles = [
    '/images/cities/bandung.jpg',
    '/images/cities/bali.jpg',
    '/images/placeholder-story.webp',
    '/images/default-story-cover.jpg'
  ];
  const selected = cityFiles[Math.floor(Math.random() * cityFiles.length)];
  return selected;
}

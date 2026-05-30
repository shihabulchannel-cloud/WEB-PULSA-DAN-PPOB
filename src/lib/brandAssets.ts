
export interface BrandAsset {
  logoUrl: string;
  gradient: string;
  bgColor: string;
}

export const brandAssets: Record<string, BrandAsset> = {
  // E-Wallets
  'DANA': { logoUrl: 'https://logo.clearbit.com/dana.id', gradient: 'from-blue-400 to-sky-500', bgColor: '#0091FF' },
  'OVO': { logoUrl: 'https://logo.clearbit.com/ovo.id', gradient: 'from-violet-600 to-purple-700', bgColor: '#4C3494' },
  'GoPay': { logoUrl: 'https://logo.clearbit.com/gopay.co.id', gradient: 'from-teal-400 to-green-500', bgColor: '#00AED6' },
  'ShopeePay': { logoUrl: 'https://logo.clearbit.com/shopee.co.id', gradient: 'from-orange-400 to-red-500', bgColor: '#EE4D2D' },
  'LinkAja': { logoUrl: 'https://logo.clearbit.com/linkaja.id', gradient: 'from-red-500 to-red-700', bgColor: '#CB3A31' },

  // Games
  'Mobile Legends': { logoUrl: 'https://logo.clearbit.com/mobilelegends.net', gradient: 'from-blue-600 to-indigo-800', bgColor: '#1B3C72' },
  'Free Fire': { logoUrl: 'https://logo.clearbit.com/garena.com', gradient: 'from-orange-500 to-red-600', bgColor: '#FF5722' },
  'PUBG Mobile': { logoUrl: 'https://logo.clearbit.com/pubg.com', gradient: 'from-yellow-400 to-orange-500', bgColor: '#F8A01B' },
  'Genshin Impact': { logoUrl: 'https://logo.clearbit.com/hoyoverse.com', gradient: 'from-indigo-400 to-purple-600', bgColor: '#3F51B5' },
  'Valorant': { logoUrl: 'https://logo.clearbit.com/playvalorant.com', gradient: 'from-red-500 to-rose-700', bgColor: '#FF4655' },
  'Roblox': { logoUrl: 'https://logo.clearbit.com/roblox.com', gradient: 'from-red-400 to-rose-600', bgColor: '#E2231A' },
  'Steam': { logoUrl: 'https://logo.clearbit.com/steampowered.com', gradient: 'from-blue-600 to-slate-800', bgColor: '#1B2838' },
  'Minecraft': { logoUrl: 'https://logo.clearbit.com/minecraft.net', gradient: 'from-green-500 to-emerald-700', bgColor: '#5E9732' },
  'MLBB': { logoUrl: 'https://logo.clearbit.com/mobilelegends.net', gradient: 'from-blue-600 to-indigo-800', bgColor: '#1B3C72' },
  'Honkai': { logoUrl: 'https://logo.clearbit.com/hoyoverse.com', gradient: 'from-blue-500 to-purple-700', bgColor: '#3563E9' },
  'Point Blank': { logoUrl: 'https://logo.clearbit.com/garena.com', gradient: 'from-green-500 to-green-700', bgColor: '#2E7D32' },
  'Clash of Clans': { logoUrl: 'https://logo.clearbit.com/supercell.com', gradient: 'from-blue-400 to-blue-600', bgColor: '#1565C0' },
  'Call of Duty': { logoUrl: 'https://logo.clearbit.com/callofduty.com', gradient: 'from-yellow-500 to-yellow-700', bgColor: '#F9A825' },
  'Arena of Valor': { logoUrl: 'https://logo.clearbit.com/tencent.com', gradient: 'from-teal-500 to-cyan-600', bgColor: '#0097A7' },

  // Telecom
  'Telkomsel': { logoUrl: 'https://logo.clearbit.com/telkomsel.com', gradient: 'from-red-500 to-red-700', bgColor: '#CC0000' },
  'XL': { logoUrl: 'https://logo.clearbit.com/xl.co.id', gradient: 'from-blue-500 to-blue-700', bgColor: '#0D5EAF' },
  'Indosat': { logoUrl: 'https://logo.clearbit.com/indosat.com', gradient: 'from-yellow-500 to-yellow-600', bgColor: '#F5A623' },
  'AXIS': { logoUrl: 'https://logo.clearbit.com/axis.co.id', gradient: 'from-pink-500 to-rose-600', bgColor: '#E91E8C' },
  'Smartfren': { logoUrl: 'https://logo.clearbit.com/smartfren.com', gradient: 'from-green-400 to-teal-600', bgColor: '#00897B' },
  'Tri': { logoUrl: 'https://logo.clearbit.com/tri.co.id', gradient: 'from-orange-400 to-orange-600', bgColor: '#FF6600' },
  'By.U': { logoUrl: 'https://logo.clearbit.com/telkomsel.com', gradient: 'from-purple-500 to-purple-700', bgColor: '#7B1FA2' },

  // PPOB
  'PLN': { logoUrl: 'https://logo.clearbit.com/pln.co.id', gradient: 'from-sky-400 to-blue-600', bgColor: '#1565C0' },
  'BPJS': { logoUrl: 'https://logo.clearbit.com/bpjs-kesehatan.go.id', gradient: 'from-blue-500 to-blue-700', bgColor: '#1565C0' },
  'PDAM': { logoUrl: 'https://logo.clearbit.com/pln.co.id', gradient: 'from-cyan-400 to-blue-500', bgColor: '#0288D1' },

  // Streaming
  'Netflix': { logoUrl: 'https://logo.clearbit.com/netflix.com', gradient: 'from-red-600 to-gray-900', bgColor: '#E50914' },
  'Spotify': { logoUrl: 'https://logo.clearbit.com/spotify.com', gradient: 'from-green-500 to-green-700', bgColor: '#1DB954' },
  'YouTube': { logoUrl: 'https://logo.clearbit.com/youtube.com', gradient: 'from-red-500 to-red-700', bgColor: '#FF0000' },
  'Disney': { logoUrl: 'https://logo.clearbit.com/disneyplus.com', gradient: 'from-blue-600 to-blue-900', bgColor: '#113CCF' },
  'VIU': { logoUrl: 'https://logo.clearbit.com/viu.com', gradient: 'from-yellow-400 to-orange-500', bgColor: '#F5C518' },
  'Vidio': { logoUrl: 'https://logo.clearbit.com/vidio.com', gradient: 'from-blue-500 to-blue-700', bgColor: '#006DC6' },
  'WeTV': { logoUrl: 'https://logo.clearbit.com/wetv.vip', gradient: 'from-teal-400 to-cyan-600', bgColor: '#00BCD4' },
};

export function getBrandAsset(brand: string): BrandAsset | null {
  if (!brand) return null;
  // Exact match
  if (brandAssets[brand]) return brandAssets[brand];
  // Partial match (case-insensitive)
  const brandLower = brand.toLowerCase();
  for (const [key, asset] of Object.entries(brandAssets)) {
    if (brandLower.includes(key.toLowerCase()) || key.toLowerCase().includes(brandLower)) {
      return asset;
    }
  }
  return null;
}

export function getBrandInitials(brand: string): string {
  if (!brand) return '??';
  return brand.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Generate a deterministic gradient from brand name for unknown brands
export function getBrandFallbackColor(brand: string): string {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-pink-600',
  ];
  const hash = brand.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

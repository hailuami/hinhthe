export enum PhotoSize {
  SIZE_3X4 = '3x4',
  SIZE_4X6 = '4x6'
}

export enum Outfit {
  ORIGINAL = 'Giữ nguyên',
  WHITE_SHIRT = 'Áo sơ mi trắng',
  AO_DAI = 'Áo dài',
  VEST = 'Áo vest',
  MILITARY = 'Quân nhân',
  POLICE = 'Công an'
}

export enum OutfitColor {
  DEFAULT = 'Mặc định',
  BLACK = 'Đen',
  WHITE = 'Trắng',
  NAVY = 'Xanh đậm',
  LIGHT_BLUE = 'Xanh nhạt',
  RED = 'Đỏ'
}

export enum BackgroundColor {
  DARK_BLUE = 'Xanh đậm',
  LIGHT_BLUE = 'Xanh nhạt',
  WHITE = 'Trắng'
}

export interface ProcessingOptions {
  size: PhotoSize;
  outfit: Outfit;
  outfitColor: OutfitColor;
  bgColor: BackgroundColor;
  smoothSkin: boolean;
  removeBlemishes: boolean;
  whitening: boolean;
  strictIdentity: boolean;
}

export interface ImageState {
  original: string | null;
  processed: string | null;
  isProcessing: boolean;
  error: string | null;
}
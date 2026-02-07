export enum PhotoSize {
  SIZE_3X4 = '3x4',
  SIZE_4X6 = '4x6'
}

export enum Outfit {
  AO_DAI = 'Áo dài',
  WHITE_SHIRT = 'Áo sơ mi',
  VEST = 'Áo vest',
  SCHOOL_GIRL = 'Đồng phục nữ sinh',
  SCHOOL_BOY = 'Đồng phục nam sinh'
}

export enum VestColor {
  BLACK = 'Đen',
  NAVY = 'Xanh navy',
  GREY = 'Xám'
}

export enum ShirtColor {
  WHITE = 'Trắng',
  LIGHT_BLUE = 'Xanh nhạt',
  WHITE_STRIPE = 'Trắng sọc'
}

export enum AoDaiColor {
  WHITE = 'Trắng',
  RED = 'Đỏ',
  LIGHT_BLUE = 'Xanh nhạt',
  PURPLE = 'Tím'
}

export enum BackgroundColor {
  BLUE = 'Xanh dương',
  WHITE = 'Trắng'
}

export interface ProcessingOptions {
  size: PhotoSize;
  outfit: Outfit;
  vestColor?: VestColor;
  shirtColor?: ShirtColor;
  aoDaiColor?: AoDaiColor;
  bgColor: BackgroundColor;
  smoothSkin: boolean;
  removeBlemishes: boolean;
  whitening: boolean;
}

export interface ImageState {
  original: string | null;
  processed: string | null;
  isProcessing: boolean;
  error: string | null;
}

export type IconType = 'image' | 'video';

export interface GeneratedIcon {
  id: string;
  url: string;
  type: IconType;
  prompt: string;
  timestamp: number;
  config: {
    aspectRatio: string;
    imageSize?: string;
    resolution?: string;
  };
}

export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT_SHORT = "3:4",
  LANDSCAPE_SHORT = "4:3",
  PORTRAIT_TALL = "9:16",
  LANDSCAPE_WIDE = "16:9"
}

export enum ImageSize {
  K1 = "1K",
  K2 = "2K",
  K4 = "4K"
}

export enum VideoResolution {
  HD = "720p",
  FHD = "1080p"
}

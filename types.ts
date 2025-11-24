
export enum SlideLayout {
  TITLE = 'TITLE',
  AGENDA = 'AGENDA',
  SECTION_HEADER = 'SECTION_HEADER',
  CONTENT_BULLETS = 'CONTENT_BULLETS',
  TWO_COLUMN = 'TWO_COLUMN', // Used for Text + Text or Text + Image
  CLOSING = 'CLOSING',
  QUOTE = 'QUOTE',
  BIG_NUMBER = 'BIG_NUMBER',
  THREE_COLUMN = 'THREE_COLUMN'
}

export interface SlideVisual {
  type: 'icon' | 'image' | 'illustration' | 'none';
  prompt?: string; // Description for the image/illustration
  iconName?: string; // Lucide icon name suggestion
  contentUrl?: string; // Base64 image data or SVG string
  // Style overrides
  width?: number; // Percentage 10-100
  height?: number; // Aspect ratio placeholder (not strictly used yet but good for future)
  scale?: number; // 1-3
  verticalPos?: number; // 0-100
  horizontalPos?: number; // 0-100
  verticalOffset?: number; // Legacy, map to verticalPos
}

export interface Slide {
  id: string;
  title: string;
  layout: SlideLayout;
  content: string[]; // Bullet points or paragraphs
  visual?: SlideVisual;
  speakerNotes?: string;
  duration?: string;
}

export type ContentBackgroundStyle = 'minimal' | 'subtle-card' | 'tinted' | 'gradient' | 'dots';

export type IllustrationStyle = 'minimalist' | 'flat' | '3d-render' | 'watercolor' | 'photorealistic' | 'line-art';

export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl: string | null;
  companyName: string;
  borderRadius: 'rounded-xl' | 'rounded-none';
  backgroundStyle: ContentBackgroundStyle;
  illustrationStyle: IllustrationStyle;
  mode: 'light' | 'dark';
}

export interface GenerationStatus {
  isGenerating: boolean;
  isStreaming: boolean; // New state for the visual effect
  error: string | null;
  success: boolean;
}

export type DetailLevel = 'brief' | 'standard' | 'detailed';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

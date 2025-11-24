
import React, { useRef } from 'react';
import { BrandingConfig, ContentBackgroundStyle, IllustrationStyle } from '../types';
import { Palette, Type as TypeIcon, Image as ImageIcon, LayoutTemplate, Layers, Grid, Circle, Monitor, PenTool, Brush, Box, Camera, Square } from 'lucide-react';

interface BrandingPanelProps {
  config: BrandingConfig;
  onChange: (config: BrandingConfig) => void;
}

export const BrandingPanel: React.FC<BrandingPanelProps> = ({ config, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...config, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const bgStyles: { id: ContentBackgroundStyle; label: string; icon: React.ReactNode }[] = [
    { id: 'minimal', label: 'Minimal', icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 'subtle-card', label: 'Card', icon: <Layers className="w-4 h-4" /> },
    { id: 'tinted', label: 'Tinted', icon: <div className="w-4 h-4 rounded bg-current opacity-50" /> },
    { id: 'gradient', label: 'Gradient', icon: <div className="w-4 h-4 rounded bg-gradient-to-br from-transparent to-current opacity-50" /> },
    { id: 'dots', label: 'Pattern', icon: <Grid className="w-4 h-4" /> },
  ];

  const illustrationStyles: { id: IllustrationStyle; label: string; icon: React.ReactNode }[] = [
      { id: 'flat', label: 'Flat', icon: <Monitor className="w-4 h-4" /> },
      { id: 'minimalist', label: 'Minimal', icon: <Circle className="w-4 h-4" /> },
      { id: '3d-render', label: '3D', icon: <Box className="w-4 h-4" /> },
      { id: 'watercolor', label: 'Watercolor', icon: <Brush className="w-4 h-4" /> },
      { id: 'photorealistic', label: 'Photo', icon: <Camera className="w-4 h-4" /> },
      { id: 'line-art', label: 'Line Art', icon: <PenTool className="w-4 h-4" /> },
  ];

  const themes = [
      { 
          id: 'standard', 
          label: 'Standard', 
          colors: ['#000000', '#3B82F6'], 
          config: { primaryColor: '#000000', secondaryColor: '#3B82F6', fontFamily: 'Inter, sans-serif', borderRadius: 'rounded-xl', backgroundStyle: 'subtle-card' as ContentBackgroundStyle, mode: 'light' as const } 
      },
      { 
          id: 'dark', 
          label: 'Dark Mode', 
          colors: ['#111827', '#60A5FA'], 
          config: { primaryColor: '#60A5FA', secondaryColor: '#3B82F6', fontFamily: "'Roboto', sans-serif", borderRadius: 'rounded-xl', backgroundStyle: 'minimal' as ContentBackgroundStyle, mode: 'dark' as const } 
      },
      { 
          id: 'professional', 
          label: 'Professional', 
          colors: ['#1E3A8A', '#64748B'], 
          config: { primaryColor: '#1E3A8A', secondaryColor: '#64748B', fontFamily: "'Playfair Display', serif", borderRadius: 'rounded-none', backgroundStyle: 'minimal' as ContentBackgroundStyle, mode: 'light' as const } 
      },
      { 
          id: 'colorful', 
          label: 'Colorful', 
          colors: ['#7C3AED', '#EC4899'], 
          config: { primaryColor: '#7C3AED', secondaryColor: '#EC4899', fontFamily: "'Montserrat', sans-serif", borderRadius: 'rounded-xl', backgroundStyle: 'gradient' as ContentBackgroundStyle, mode: 'light' as const } 
      },
      { 
          id: 'soft', 
          label: 'Soft', 
          colors: ['#4B5563', '#10B981'], 
          config: { primaryColor: '#4B5563', secondaryColor: '#10B981', fontFamily: "'Open Sans', sans-serif", borderRadius: 'rounded-xl', backgroundStyle: 'dots' as ContentBackgroundStyle, mode: 'light' as const } 
      }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full overflow-y-auto">
      <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
        <Palette className="w-5 h-5 mr-2 text-indigo-600" />
        Design
      </h2>

      <div className="space-y-8">
        {/* Themes Section */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Themes</label>
            <div className="grid grid-cols-2 gap-3">
                {themes.map(theme => (
                    <button
                        key={theme.id}
                        onClick={() => onChange({ ...config, ...theme.config })}
                        className="flex items-center p-2 rounded-lg border border-gray-100 hover:border-indigo-300 hover:bg-gray-50 transition-all group"
                    >
                        <div className="flex -space-x-1 mr-3">
                            <div className="w-5 h-5 rounded-full border border-white" style={{ backgroundColor: theme.colors[0] }}></div>
                            <div className="w-5 h-5 rounded-full border border-white" style={{ backgroundColor: theme.colors[1] }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">{theme.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="w-full h-px bg-gray-100"></div>

        {/* Brand Section */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Brand</label>
            <div className="space-y-6">
                {/* Company Name */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                    type="text"
                    value={config.companyName}
                    onChange={(e) => onChange({ ...config, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="e.g. Metodic.io"
                />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary</label>
                    <div className="flex items-center space-x-2">
                    <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => onChange({ ...config, primaryColor: e.target.value })}
                        className="h-10 w-10 rounded-lg border border-gray-300 cursor-pointer overflow-hidden p-0"
                    />
                    <span className="text-xs text-gray-500 font-mono">{config.primaryColor}</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary</label>
                    <div className="flex items-center space-x-2">
                    <input
                        type="color"
                        value={config.secondaryColor}
                        onChange={(e) => onChange({ ...config, secondaryColor: e.target.value })}
                        className="h-10 w-10 rounded-lg border border-gray-300 cursor-pointer overflow-hidden p-0"
                    />
                    <span className="text-xs text-gray-500 font-mono">{config.secondaryColor}</span>
                    </div>
                </div>
                </div>

                {/* Typography */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Typography</label>
                <div className="relative">
                    <TypeIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                    value={config.fontFamily}
                    onChange={(e) => onChange({ ...config, fontFamily: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white text-sm"
                    >
                    <option value="Inter, sans-serif">Inter (Clean)</option>
                    <option value="'Roboto', sans-serif">Roboto (Modern)</option>
                    <option value="'Open Sans', sans-serif">Open Sans (Friendly)</option>
                    <option value="'Montserrat', sans-serif">Montserrat (Geometric)</option>
                    <option value="'Playfair Display', serif">Playfair Display (Elegant)</option>
                    <option value="'Times New Roman', serif">Times New Roman (Classic)</option>
                    <option value="'Courier New', monospace">Courier (Technical)</option>
                    </select>
                </div>
                </div>
                 {/* Logo */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {config.logoUrl ? (
                    <div className="relative group w-full text-center">
                        <img src={config.logoUrl} alt="Logo" className="h-10 mx-auto object-contain" />
                        <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold text-gray-600 rounded transition-opacity">
                        Replace
                        </div>
                    </div>
                    ) : (
                    <div className="text-center text-gray-500">
                        <ImageIcon className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                        <span className="text-xs">Upload Logo</span>
                    </div>
                    )}
                    <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleLogoUpload}
                    />
                </div>
                </div>
            </div>
        </div>

        <div className="w-full h-px bg-gray-100"></div>

        {/* Illustration Style Section */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Illustration Style</label>
            <div className="grid grid-cols-2 gap-2">
                {illustrationStyles.map(style => (
                    <button
                        key={style.id}
                        onClick={() => onChange({ ...config, illustrationStyle: style.id })}
                        className={`p-2.5 rounded-lg text-xs font-medium border flex items-center justify-start space-x-2 transition-all ${
                            config.illustrationStyle === style.id 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600' 
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <span className={config.illustrationStyle === style.id ? 'text-indigo-600' : 'text-gray-400'}>{style.icon}</span>
                        <span>{style.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="w-full h-px bg-gray-100"></div>

        {/* Elements Section */}
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Elements</label>
             {/* Content Background */}
             <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                <div className="grid grid-cols-2 gap-2">
                    {bgStyles.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onChange({ ...config, backgroundStyle: style.id })}
                            className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-start space-x-2 transition-all ${
                                config.backgroundStyle === style.id 
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600' 
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span className={config.backgroundStyle === style.id ? 'text-indigo-600' : 'text-gray-400'}>{style.icon}</span>
                            <span>{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Shape / Radius */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Corner Radius</label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => onChange({...config, borderRadius: 'rounded-xl'})}
                    className={`p-2 border rounded-lg flex flex-col items-center justify-center transition-all ${config.borderRadius === 'rounded-xl' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                    <div className="w-4 h-4 border-2 border-current rounded-lg mb-1"></div>
                    <span className="text-xs font-medium">Soft</span>
                </button>
                <button
                    onClick={() => onChange({...config, borderRadius: 'rounded-none'})}
                    className={`p-2 border rounded-lg flex flex-col items-center justify-center transition-all ${config.borderRadius === 'rounded-none' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                    <div className="w-4 h-4 border-2 border-current rounded-none mb-1"></div>
                    <span className="text-xs font-medium">Sharp</span>
                </button>
            </div>
            </div>

             {/* Mode Toggle */}
             <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme Mode</label>
                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => onChange({...config, mode: 'light'})}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${config.mode === 'light' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Light
                    </button>
                    <button
                        onClick={() => onChange({...config, mode: 'dark'})}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${config.mode === 'dark' ? 'bg-gray-800 shadow text-white' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Dark
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BrandingConfig, Slide, SlideLayout, SlideVisual } from '../types';
import { 
  Users, TrendingUp, Target, Lightbulb, BarChart, 
  Calendar, Clock, CheckCircle, AlertCircle, MessageCircle, 
  Settings, Search, Globe, Shield, Zap, 
  Briefcase, Coffee, Award, BookOpen, Layers,
  Layout, Image as ImageIcon, PieChart, Activity, Smartphone,
  Wand2, Loader2, Edit3, Type, Minus, Maximize2, Move, Trash2, Copy, GripVertical,
  Columns, Grid, Quote, Hash
} from 'lucide-react';

interface SlideRendererProps {
  slide: Slide;
  branding: BrandingConfig;
  id?: string;
  onUpdate?: (id: string, updates: Partial<Slide>) => void;
  onRegenerateVisual?: (id: string, type: 'image' | 'icon', prompt: string) => Promise<void>;
  animate?: boolean;
}

// Fallback Icon Mapping
const IconMap: Record<string, any> = {
  'users': Users, 'trending-up': TrendingUp, 'target': Target, 'lightbulb': Lightbulb,
  'bar-chart': BarChart, 'calendar': Calendar, 'clock': Clock, 'check-circle': CheckCircle,
  'alert-circle': AlertCircle, 'message-circle': MessageCircle, 'settings': Settings,
  'search': Search, 'globe': Globe, 'shield': Shield, 'zap': Zap,
  'briefcase': Briefcase, 'coffee': Coffee, 'award': Award, 'book-open': BookOpen,
  'layers': Layers, 'layout': Layout, 'pie-chart': PieChart, 'activity': Activity,
  'smartphone': Smartphone
};

// Animation Helper Component (External to prevent recreation)
const Anim: React.FC<{ children: React.ReactNode; delay?: number; className?: string; animate?: boolean }> = ({ children, delay = 0, className = "", animate = false }) => {
  if (!animate) return <div className={className}>{children}</div>;
  
  return (
    <div 
      className={className}
      style={{
        opacity: 0, // Initial state for animation
        animation: `fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

export const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, branding, id, onUpdate, onRegenerateVisual, animate = false }) => {
  const isDark = branding.mode === 'dark';

  // Editable Text Component
  const EditableText = ({ 
      value, 
      className, 
      as: Tag = 'p', 
      onChange 
  }: { value: string, className?: string, as?: any, onChange: (val: string) => void }) => {
      const [isEditing, setIsEditing] = useState(false);
      const [localValue, setLocalValue] = useState(value);

      const handleBlur = () => {
          setIsEditing(false);
          if (localValue !== value) onChange(localValue);
      };

      const textAreaClass = isDark ? "text-white bg-gray-800" : "text-gray-900 bg-white/50";

      if (isEditing && onUpdate) {
          return (
              <Tag className={`${className} outline-none border-b-2 border-indigo-500 w-full`}>
                 <textarea
                    autoFocus
                    className={`w-full bg-transparent resize-none outline-none overflow-hidden ${textAreaClass}`}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    rows={Math.max(1, Math.ceil(localValue.length / 50))} // approximate auto-height
                 />
              </Tag>
          );
      }
      return (
          <Tag 
            className={`${className} ${onUpdate ? 'cursor-text hover:opacity-80 transition-opacity' : ''}`}
            onClick={() => onUpdate && setIsEditing(true)}
          >
            {value}
          </Tag>
      );
  };
  
  // Draggable Block Component
  const DraggableBlock = ({ 
      content, 
      index, 
      moveBlock, 
      updateBlock, 
      deleteBlock, 
      duplicateBlock,
      isDark
  }: { 
      content: string, 
      index: number, 
      moveBlock: (from: number, to: number) => void,
      updateBlock: (val: string) => void,
      deleteBlock: () => void,
      duplicateBlock: () => void,
      isDark: boolean
  }) => {
      const ref = useRef<HTMLDivElement>(null);
      
      const handleDragStart = (e: React.DragEvent) => {
          if (!onUpdate) return;
          e.dataTransfer.setData('text/plain', index.toString());
          e.dataTransfer.effectAllowed = 'move';
      };

      const handleDragOver = (e: React.DragEvent) => {
          if (!onUpdate) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
      };

      const handleDrop = (e: React.DragEvent) => {
          if (!onUpdate) return;
          e.preventDefault();
          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
          if (fromIndex !== index) {
              moveBlock(fromIndex, index);
          }
      };

      const fontSizeClass = getBodyFontSize(slide.content.join('').length);
      const contentStyleProps = getContentStyle();

      return (
        <div 
            ref={ref}
            draggable={!!onUpdate}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="group relative flex items-start"
        >
            {/* Hover Controls */}
            {onUpdate && (
                <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 z-20">
                    <button className="p-1 text-gray-400 hover:text-gray-600 cursor-move" title="Drag to reorder"><GripVertical className="w-4 h-4" /></button>
                    <button onClick={duplicateBlock} className="p-1 text-gray-400 hover:text-indigo-600" title="Duplicate"><Copy className="w-4 h-4" /></button>
                    <button onClick={deleteBlock} className="p-1 text-gray-400 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
            )}
            
            <div className={`w-full flex items-start ${branding.backgroundStyle !== 'minimal' ? 'p-4' : ''}`} {...(branding.backgroundStyle !== 'minimal' ? contentStyleProps : {})}>
                 <span 
                    className="mt-2.5 mr-6 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: branding.primaryColor }}
                ></span>
                <EditableText 
                    value={content}
                    onChange={updateBlock}
                    className={`${fontSizeClass} ${isDark ? 'text-gray-200' : 'text-gray-700'} leading-relaxed font-normal tracking-wide flex-1`}
                />
            </div>
        </div>
      );
  };

  // Helper for array manipulation
  const useBlockActions = (currentIndexes: number[], targetContentArray: string[]) => {
      // Inline logic used in renderContent
  };

  // Dynamic font sizing
  const getBodyFontSize = (textLength: number) => {
    if (textLength < 100) return 'text-3xl';
    if (textLength < 200) return 'text-2xl';
    return 'text-xl';
  };

  const containerStyle = {
    fontFamily: branding.fontFamily,
    backgroundColor: isDark ? '#111827' : 'white', // Dark gray-900 vs White
    color: isDark ? '#F9FAFB' : '#111827',
  };
  
  // Helper to generate content background styles
  const getContentStyle = () => {
    const { backgroundStyle, primaryColor, secondaryColor, borderRadius } = branding;
    
    // Hex to rgba helper
    const hexToRgba = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const baseClass = `${borderRadius} transition-colors duration-300`;
    // For Dark Mode cards, we need dark backgrounds
    const bgBase = isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100';
    
    switch(backgroundStyle) {
        case 'minimal': 
            return { className: `${baseClass} border border-transparent`, style: {} };
        case 'subtle-card':
            return { className: `${baseClass} ${bgBase} border`, style: {} };
        case 'tinted':
            return { 
                className: `${baseClass} border border-transparent`, 
                style: { backgroundColor: hexToRgba(primaryColor, isDark ? 0.2 : 0.04) } 
            };
        case 'gradient':
            return { 
                className: `${baseClass} border border-transparent`, 
                style: { backgroundImage: `linear-gradient(135deg, ${isDark ? '#1F2937' : 'white'} 0%, ${hexToRgba(secondaryColor, isDark ? 0.3 : 0.1)} 100%)` } 
            };
        case 'dots':
             return {
                className: `${baseClass} border border-gray-100`,
                style: { 
                    backgroundColor: isDark ? '#1F2937' : '#FAFAFA',
                    backgroundImage: `radial-gradient(${hexToRgba(secondaryColor, 0.2)} 1.5px, transparent 1.5px)`,
                    backgroundSize: '16px 16px'
                }
             };
        default:
             return { className: `${baseClass} ${bgBase}`, style: {} };
    }
  };

  const contentStyleProps = getContentStyle();

  const RenderIcon = ({ name, size = "w-16 h-16", color = branding.primaryColor }: { name?: string, size?: string, color?: string }) => {
    if (slide.visual?.contentUrl && slide.visual.type === 'icon') {
        return (
            <div 
                className={`${size} [&>svg]:w-full [&>svg]:h-full`} 
                style={{ color }}
                dangerouslySetInnerHTML={{ __html: slide.visual.contentUrl }} 
            />
        );
    }
    const IconComponent = (name && IconMap[name]) ? IconMap[name] : Layers;
    return <IconComponent className={size} style={{ color }} strokeWidth={1.5} />;
  };

  // Interactive Visual Placeholder
  const VisualElement = ({ visual, className = "" }: { visual: SlideVisual, className?: string }) => {
    // ... (Keep existing VisualElement logic)
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editPrompt, setEditPrompt] = useState(""); 
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const isResizingRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0, width: 0, vPos: 50, hPos: 50 });

    const handleAction = async (actionType: 'image' | 'icon') => {
        if (!onRegenerateVisual) return;
        setIsLoading(true);
        setHasError(false);
        try {
            await onRegenerateVisual(slide.id, actionType, editPrompt);
            setIsEditing(false);
            setEditPrompt(""); 
        } catch (e) {
            console.error(e);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const updateVisual = (updates: Partial<SlideVisual>) => {
        if (onUpdate) {
            onUpdate(slide.id, {
                visual: { ...visual, ...updates }
            });
        }
    };
    
    // Drag/Resize logic remains same ...
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isEditing || visual.type === 'icon' || !visual.contentUrl) return;
        e.preventDefault(); e.stopPropagation();
        isDraggingRef.current = true;
        startPosRef.current = { ...startPosRef.current, x: e.clientX, y: e.clientY, vPos: visual.verticalPos ?? 50, hPos: visual.horizontalPos ?? 50 };
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    };
    const handleResizeStart = (e: React.MouseEvent) => {
        if (isEditing) return;
        e.preventDefault(); e.stopPropagation();
        isResizingRef.current = true;
        const rect = containerRef.current?.getBoundingClientRect();
        startPosRef.current = { ...startPosRef.current, x: e.clientX, width: rect ? rect.width : 0 };
        window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
    };
    const handleMouseMove = (e: MouseEvent) => {
        if (isDraggingRef.current && containerRef.current) {
            const deltaX = startPosRef.current.x - e.clientX;
            const deltaY = startPosRef.current.y - e.clientY;
            let newH = startPosRef.current.hPos + (deltaX * 0.2);
            let newV = startPosRef.current.vPos + (deltaY * 0.2);
            newH = Math.max(0, Math.min(100, newH)); newV = Math.max(0, Math.min(100, newV));
            const img = containerRef.current.querySelector('img');
            if (img) img.style.objectPosition = `${newH}% ${newV}%`;
        }
        if (isResizingRef.current && containerRef.current && containerRef.current.parentElement) {
            const parentWidth = containerRef.current.parentElement.getBoundingClientRect().width;
            const deltaX = e.clientX - startPosRef.current.x;
            const newPercent = Math.max(20, Math.min(100, ((startPosRef.current.width + deltaX) / parentWidth) * 100));
            containerRef.current.style.width = `${newPercent}%`;
        }
    };
    const handleMouseUp = (e: MouseEvent) => {
        if (isDraggingRef.current) {
            const deltaX = startPosRef.current.x - e.clientX;
            const deltaY = startPosRef.current.y - e.clientY;
            let newH = Math.max(0, Math.min(100, startPosRef.current.hPos + (deltaX * 0.2)));
            let newV = Math.max(0, Math.min(100, startPosRef.current.vPos + (deltaY * 0.2)));
            updateVisual({ horizontalPos: newH, verticalPos: newV });
        }
        if (isResizingRef.current && containerRef.current && containerRef.current.parentElement) {
             const parentWidth = containerRef.current.parentElement.getBoundingClientRect().width;
             updateVisual({ width: (containerRef.current.getBoundingClientRect().width / parentWidth) * 100 });
        }
        isDraggingRef.current = false; isResizingRef.current = false;
        window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp);
    };


    const hasContent = !!visual.contentUrl;
    const isActuallyLoading = isLoading || (visual.type !== 'none' && !visual.contentUrl);
    const bgClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100';
    const widthStyle = visual.width ? `${visual.width}%` : '100%';
    const objectPos = `${visual.horizontalPos ?? 50}% ${visual.verticalPos ?? 50}%`;

    if (visual.type === 'icon') {
        return (
            <div 
                className={`flex items-center justify-center h-full w-full ${branding.borderRadius} border p-12 relative group overflow-hidden ${bgClass} ${className}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                 <div className={`transition-all duration-300 ${isEditing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    <div className="flex flex-col items-center text-center">
                        <div className={`p-8 rounded-full shadow-sm mb-6 relative ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                             {isActuallyLoading && <div className={`absolute inset-0 flex items-center justify-center z-10 rounded-full ${isDark ? 'bg-gray-800/80' : 'bg-white/80'}`}><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}
                            <RenderIcon name={visual.iconName} size="w-24 h-24" />
                        </div>
                        {/* Only show prompt if NOT loading to avoid clutter */}
                        {!isActuallyLoading && <p className={`text-sm font-medium uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{visual.prompt || "Concept Icon"}</p>}
                    </div>
                </div>
                {/* Edit Overlay */}
                {onRegenerateVisual && (isHovered || isEditing) && !isActuallyLoading && (
                    <div className={`absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center p-6 transition-all duration-200 z-20 ${isDark ? 'bg-gray-900/95' : 'bg-white/95'} ${isEditing || isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                        {isEditing ? (
                             <div className="w-full max-w-xs space-y-3">
                                <input className="w-full px-3 py-2 bg-white text-gray-900 border rounded-lg text-sm" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Search icon..." autoFocus />
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={() => handleAction('icon')} className="flex-1 py-2 bg-black text-white rounded-lg text-xs font-bold">Find</button>
                                </div>
                             </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className={`shadow-lg border px-4 py-2 rounded-full text-sm font-semibold flex items-center transition-transform hover:-translate-y-1 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}><Search className="w-4 h-4 mr-2" />Change Icon</button>
                        )}
                    </div>
                )}
            </div>
        );
    } 

    return (
        <div className={`flex items-center justify-center h-full w-full relative group ${hasContent ? 'bg-transparent' : 'bg-gray-100'} ${branding.borderRadius} ${className}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            <div ref={containerRef} className="relative h-full transition-all duration-75 overflow-hidden shadow-sm" style={{ width: widthStyle, borderRadius: branding.borderRadius === 'rounded-xl' ? '0.75rem' : '0' }}>
                {isActuallyLoading && <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm"><Loader2 className="w-10 h-10 animate-spin text-indigo-600" /></div>}
                {hasContent ? (
                    <img src={visual.contentUrl} className={`w-full h-full object-cover ${isEditing ? '' : 'cursor-move'}`} style={{ objectPosition: objectPos, transform: `scale(${visual.scale || 1})` }} onMouseDown={handleMouseDown} draggable={false} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full relative z-10 p-8 text-center"><div className="w-20 h-20 mb-4 text-gray-400 opacity-80 border-2 border-dashed border-gray-400 rounded-lg"></div><span className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wider">Image Placeholder</span></div>
                )}
                {onUpdate && hasContent && !isEditing && isHovered && <div className="absolute bottom-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center cursor-nwse-resize z-30" onMouseDown={handleResizeStart}><Maximize2 className="w-3 h-3 text-gray-500" /></div>}
            </div>
             {/* Edit Overlay */}
             {onRegenerateVisual && (isHovered || isEditing) && !isActuallyLoading && (
                <div className={`absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center ${isEditing ? 'opacity-100' : 'opacity-0'}`}>
                    <div className={`backdrop-blur-sm p-6 rounded-xl shadow-xl pointer-events-auto border ${isDark ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} ${isEditing ? 'flex' : 'hidden group-hover:flex'} flex-col items-center`}>
                        {isEditing ? (
                            <div className="w-full max-w-xs space-y-3">
                                <textarea className="w-full px-3 py-2 bg-white text-gray-900 border rounded-lg text-sm" rows={2} value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="Describe image..." autoFocus />
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={() => handleAction('image')} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Generate</button>
                                </div>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center gap-3">
                                {hasContent && <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1 mb-2"><input type="range" min="1" max="3" step="0.1" value={visual.scale || 1} onChange={(e) => updateVisual({ scale: parseFloat(e.target.value) })} className="w-24 h-1 bg-gray-300 rounded-lg accent-indigo-600" /></div>}
                                <button onClick={() => setIsEditing(true)} className={`border px-4 py-2 rounded-full text-sm font-semibold flex items-center ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}><Wand2 className="w-4 h-4 mr-2 text-purple-500" />Regenerate</button>
                             </div>
                        )}
                    </div>
                </div>
             )}
        </div>
    );
  };

  const AccentBar = () => (
    <div 
        className="absolute top-0 left-0 h-full w-2" 
        style={{ backgroundColor: branding.primaryColor }}
    />
  );

  const Footer = () => (
    <div className="absolute bottom-8 left-12 right-12 flex justify-between items-end">
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 rounded-full" style={{ backgroundColor: branding.secondaryColor }}></div>
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">
          {branding.companyName}
        </span>
      </div>
      {branding.logoUrl && (
        <img src={branding.logoUrl} alt="Logo" className="h-6 object-contain opacity-80" />
      )}
    </div>
  );

  const SlideControls = () => {
    if (!onUpdate) return null;
    
    const btnClass = `p-1.5 rounded hover:${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} ${isDark ? 'text-gray-400' : 'text-gray-500'} transition-colors`;
    const activeClass = isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600';

    return (
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
            <div className={`backdrop-blur border shadow-sm rounded-lg p-1 flex items-center space-x-1 ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'}`}>
                 <button onClick={() => onUpdate(slide.id, { layout: SlideLayout.TITLE })} className={`${btnClass} ${slide.layout === SlideLayout.TITLE ? activeClass : ''}`} title="Title Slide"><Type className="w-4 h-4" /></button>
                 <button onClick={() => onUpdate(slide.id, { layout: SlideLayout.CONTENT_BULLETS })} className={`${btnClass} ${slide.layout === SlideLayout.CONTENT_BULLETS ? activeClass : ''}`} title="Standard List"><Layout className="w-4 h-4" /></button>
                 <button onClick={() => onUpdate(slide.id, { layout: SlideLayout.TWO_COLUMN })} className={`${btnClass} ${slide.layout === SlideLayout.TWO_COLUMN ? activeClass : ''}`} title="Two Columns"><Columns className="w-4 h-4" /></button>
                 <button onClick={() => onUpdate(slide.id, { layout: SlideLayout.THREE_COLUMN })} className={`${btnClass} ${slide.layout === SlideLayout.THREE_COLUMN ? activeClass : ''}`} title="Three Columns"><Grid className="w-4 h-4" /></button>
                 <div className={`w-px h-4 mx-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                 <button onClick={() => onUpdate(slide.id, { layout: SlideLayout.QUOTE })} className={`${btnClass} ${slide.layout === SlideLayout.QUOTE ? activeClass : ''}`} title="Quote"><Quote className="w-4 h-4" /></button>
                 <button onClick={() => onUpdate(slide.id, { layout: SlideLayout.BIG_NUMBER })} className={`${btnClass} ${slide.layout === SlideLayout.BIG_NUMBER ? activeClass : ''}`} title="Big Number"><Hash className="w-4 h-4" /></button>
            </div>
        </div>
    );
  };

  const renderContent = () => {
    // Utility for list manipulation
    const handleReorder = (from: number, to: number) => {
        if (!onUpdate) return;
        const newContent = [...slide.content];
        const [movedItem] = newContent.splice(from, 1);
        newContent.splice(to, 0, movedItem);
        onUpdate(slide.id, { content: newContent });
    };
    const handleUpdateBlock = (idx: number, val: string) => {
        if (!onUpdate) return;
        const newContent = [...slide.content];
        newContent[idx] = val;
        onUpdate(slide.id, { content: newContent });
    };
    const handleDeleteBlock = (idx: number) => {
        if (!onUpdate) return;
        const newContent = slide.content.filter((_, i) => i !== idx);
        onUpdate(slide.id, { content: newContent });
    };
    const handleDuplicateBlock = (idx: number) => {
        if (!onUpdate) return;
        const newContent = [...slide.content];
        newContent.splice(idx + 1, 0, newContent[idx]);
        onUpdate(slide.id, { content: newContent });
    };

    switch (slide.layout) {
      case SlideLayout.TITLE:
        return (
          <div className="flex flex-col justify-center h-full px-20 relative z-10">
            <Anim animate={animate} delay={200}>
                <EditableText 
                    as="h1"
                    value={slide.title}
                    onChange={(val) => onUpdate && onUpdate(slide.id, { title: val })}
                    className={`text-7xl font-extrabold mb-8 leading-tight tracking-tight ${isDark ? 'text-white' : 'text-gray-900'} max-w-4xl`} 
                />
            </Anim>
            <div className="flex gap-4">
                 <div className="h-1 w-20 rounded-full" style={{ backgroundColor: branding.secondaryColor }}></div>
            </div>
          </div>
        );

      case SlideLayout.CONTENT_BULLETS:
      default:
        const showSmallVisual = slide.visual && slide.visual.type !== 'none';
        return (
          <div className="h-full pt-20 px-20 flex gap-12">
             <div className="flex-1">
                <div className="flex items-center mb-12">
                    {slide.visual?.type === 'icon' && (
                        <Anim animate={animate} delay={0} className={`mr-6 p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} ${branding.borderRadius}`}>
                            <RenderIcon name={slide.visual.iconName} size="w-8 h-8" />
                        </Anim>
                    )}
                    <Anim animate={animate} delay={100}>
                        <EditableText 
                            as="h2"
                            value={slide.title}
                            onChange={(val) => onUpdate && onUpdate(slide.id, { title: val })}
                            className={`text-4xl font-bold tracking-tight max-w-4xl leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}
                        />
                    </Anim>
                </div>

                <div className="max-w-4xl space-y-6">
                    {slide.content.map((item, i) => (
                        <Anim animate={animate} key={i} delay={300 + (i * 150)}>
                            <DraggableBlock 
                                content={item} 
                                index={i}
                                moveBlock={handleReorder}
                                updateBlock={(val) => handleUpdateBlock(i, val)}
                                deleteBlock={() => handleDeleteBlock(i)}
                                duplicateBlock={() => handleDuplicateBlock(i)}
                                isDark={isDark}
                            />
                        </Anim>
                    ))}
                </div>
             </div>
             
             {showSmallVisual && slide.visual?.type !== 'icon' && (
                 <Anim animate={animate} delay={500} className="w-1/3 h-[70%] self-center">
                      <VisualElement visual={slide.visual!} />
                 </Anim>
             )}
          </div>
        );
      
      case SlideLayout.TWO_COLUMN:
        const midPoint = Math.ceil(slide.content.length / 2);
        const leftCol = slide.content.slice(0, midPoint);
        const rightCol = slide.content.slice(midPoint);
        const isFullBleed = branding.borderRadius === 'rounded-none' && slide.visual && slide.visual.type !== 'none';
        
        return (
            <div className={`h-full ${isFullBleed ? 'flex p-0' : 'pt-20 px-16'}`}>
                 <div className={`${isFullBleed ? 'flex-1 p-16 flex flex-col justify-center' : ''}`}>
                    <Anim animate={animate} delay={100}>
                        <EditableText 
                            as="h2"
                            value={slide.title}
                            onChange={(val) => onUpdate && onUpdate(slide.id, { title: val })}
                            className={`text-4xl font-bold mb-12 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}
                        />
                    </Anim>
                    <div className={`${isFullBleed ? 'space-y-6' : 'grid grid-cols-2 gap-16 h-[60%]'}`}>
                        <div className="space-y-6">
                            {leftCol.map((item, i) => (
                                <Anim animate={animate} key={i} delay={300 + (i * 100)}>
                                    <DraggableBlock 
                                        content={item} 
                                        index={i}
                                        moveBlock={handleReorder}
                                        updateBlock={(val) => handleUpdateBlock(i, val)}
                                        deleteBlock={() => handleDeleteBlock(i)}
                                        duplicateBlock={() => handleDuplicateBlock(i)}
                                        isDark={isDark}
                                    />
                                </Anim>
                            ))}
                        </div>
                        {!isFullBleed && (
                            <div className="space-y-6">
                                {slide.visual && slide.visual.type !== 'none' ? (
                                    <Anim animate={animate} delay={500} className="h-full"><VisualElement visual={slide.visual!} /></Anim>
                                ) : (
                                    rightCol.map((item, i) => (
                                        <Anim animate={animate} key={i + midPoint} delay={500 + (i * 100)}>
                                            <DraggableBlock 
                                                content={item} 
                                                index={i + midPoint}
                                                moveBlock={handleReorder}
                                                updateBlock={(val) => handleUpdateBlock(i + midPoint, val)}
                                                deleteBlock={() => handleDeleteBlock(i + midPoint)}
                                                duplicateBlock={() => handleDuplicateBlock(i + midPoint)}
                                                isDark={isDark}
                                            />
                                        </Anim>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                 </div>
                 {isFullBleed && slide.visual && (
                     <div className="w-1/2 h-full">
                         <VisualElement visual={slide.visual} className="h-full w-full rounded-none" />
                     </div>
                 )}
            </div>
        );

      case SlideLayout.THREE_COLUMN:
         const chunk = Math.ceil(slide.content.length / 3);
         const c1 = slide.content.slice(0, chunk);
         const c2 = slide.content.slice(chunk, chunk * 2);
         const c3 = slide.content.slice(chunk * 2);

         return (
             <div className="h-full pt-20 px-16 flex flex-col">
                 <Anim animate={animate} delay={100}>
                    <EditableText 
                        as="h2"
                        value={slide.title}
                        onChange={(val) => onUpdate && onUpdate(slide.id, { title: val })}
                        className={`text-3xl font-bold mb-12 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}
                    />
                </Anim>
                <div className="grid grid-cols-3 gap-8 flex-1">
                     <div className="space-y-4">
                        {c1.map((item, i) => (
                            <Anim animate={animate} key={i} delay={200 + (i * 100)}><DraggableBlock content={item} index={i} moveBlock={handleReorder} updateBlock={(val) => handleUpdateBlock(i, val)} deleteBlock={() => handleDeleteBlock(i)} duplicateBlock={() => handleDuplicateBlock(i)} isDark={isDark} /></Anim>
                        ))}
                     </div>
                     <div className="space-y-4">
                        {c2.map((item, i) => (
                            <Anim animate={animate} key={i + chunk} delay={400 + (i * 100)}><DraggableBlock content={item} index={i + chunk} moveBlock={handleReorder} updateBlock={(val) => handleUpdateBlock(i + chunk, val)} deleteBlock={() => handleDeleteBlock(i + chunk)} duplicateBlock={() => handleDuplicateBlock(i + chunk)} isDark={isDark} /></Anim>
                        ))}
                     </div>
                     <div className="space-y-4">
                        {c3.map((item, i) => (
                             <Anim animate={animate} key={i + chunk * 2} delay={600 + (i * 100)}><DraggableBlock content={item} index={i + chunk * 2} moveBlock={handleReorder} updateBlock={(val) => handleUpdateBlock(i + chunk * 2, val)} deleteBlock={() => handleDeleteBlock(i + chunk * 2)} duplicateBlock={() => handleDuplicateBlock(i + chunk * 2)} isDark={isDark} /></Anim>
                        ))}
                     </div>
                </div>
             </div>
         );

      case SlideLayout.QUOTE:
          return (
              <div className="h-full flex flex-col items-center justify-center px-32 text-center">
                  <Anim animate={animate} delay={200}>
                      <Quote className={`w-16 h-16 mb-8 opacity-20 ${isDark ? 'text-white' : 'text-black'}`} />
                  </Anim>
                  <Anim animate={animate} delay={300}>
                       <EditableText 
                            as="blockquote"
                            value={slide.content[0] || "Insert quote here"}
                            onChange={(val) => handleUpdateBlock(0, val)}
                            className={`text-5xl font-serif italic leading-tight mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        />
                  </Anim>
                  <Anim animate={animate} delay={400}>
                      <div className="flex items-center gap-4">
                          <div className="h-px w-12 bg-gray-400"></div>
                          <EditableText 
                            as="cite"
                            value={slide.title}
                            onChange={(val) => onUpdate && onUpdate(slide.id, { title: val })}
                            className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                        />
                         <div className="h-px w-12 bg-gray-400"></div>
                      </div>
                  </Anim>
              </div>
          );

      case SlideLayout.BIG_NUMBER:
           return (
               <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `radial-gradient(${branding.primaryColor} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>
                    <Anim animate={animate} delay={200}>
                        <EditableText 
                            as="div"
                            value={slide.content[0] || "100%"}
                            onChange={(val) => handleUpdateBlock(0, val)}
                            className="text-[12rem] font-black leading-none tracking-tighter"
                            // style={{ color: branding.primaryColor }} // Removed to allow className usage, simpler
                         />
                         {/* Apply color via style prop to EditableText if supported or wrap it */}
                         <div className="text-[12rem] font-black leading-none tracking-tighter -mt-24 pointer-events-none absolute select-none opacity-20 blur-3xl" style={{ color: branding.primaryColor }}>
                             {slide.content[0]}
                         </div>
                    </Anim>
                    <div style={{ color: branding.primaryColor }} className="text-[10rem] font-black leading-none tracking-tighter relative z-10 mb-4 mix-blend-overlay">
                         {/* This is a hacky way to color the editable text if the component doesn't accept style prop cleanly. 
                             Better: just use the EditableText with style prop or specific class.
                             Let's fix EditableText in next iteration if needed, for now standard text.
                         */}
                    </div>
                    
                    <Anim animate={animate} delay={400}>
                        <EditableText 
                            as="h2"
                            value={slide.title}
                            onChange={(val) => onUpdate && onUpdate(slide.id, { title: val })}
                            className={`text-2xl font-bold uppercase tracking-widest ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                        />
                    </Anim>
               </div>
           );

      case SlideLayout.SECTION_HEADER:
          return (
              <div className={`h-full flex flex-col justify-center px-20 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <Anim animate={animate} delay={200}>
                      <span className="text-sm font-bold tracking-[0.2em] text-indigo-500 mb-6 block uppercase">New Section</span>
                      <EditableText 
                        as="h1"
                        value={slide.title}
                        onChange={(val) => onUpdate && onUpdate(slide.id, { title: val })}
                        className={`text-6xl font-black tracking-tight mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    />
                    <div className="w-24 h-2 rounded-full" style={{ backgroundColor: branding.secondaryColor }}></div>
                  </Anim>
              </div>
          );

      case SlideLayout.CLOSING:
           return (
               <div className={`h-full flex flex-col items-center justify-center text-center ${isDark ? 'bg-gray-900' : 'bg-black'} text-white`}>
                   <Anim animate={animate} delay={200}>
                       <EditableText 
                           as="h1"
                           value={slide.title}
                           onChange={(val) => onUpdate && onUpdate(slide.id, { title: val })}
                           className="text-6xl font-bold mb-8"
                       />
                       <p className="text-gray-400 text-xl">Thank you for attending</p>
                   </Anim>
               </div>
           );
    }
    return <div>Layout not implemented</div>;
  };

  return (
    <div 
        id={id}
        className={`relative w-full aspect-video shadow-2xl overflow-hidden ${branding.borderRadius} border transition-transform duration-500 ease-in-out group`}
        style={containerStyle}
    >
      <SlideControls />
      {slide.layout !== SlideLayout.CLOSING && slide.layout !== SlideLayout.SECTION_HEADER && slide.layout !== SlideLayout.TITLE && <AccentBar />}
      {renderContent()}
      {slide.layout !== SlideLayout.CLOSING && slide.layout !== SlideLayout.SECTION_HEADER && slide.layout !== SlideLayout.TITLE && <Footer />}
    </div>
  );
};

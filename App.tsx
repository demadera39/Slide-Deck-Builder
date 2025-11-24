
import React, { useState, useEffect, useRef } from 'react';
import { generateSlidesFromContent, generateImageForSlide, searchIcon } from './services/geminiService';
import { Slide, BrandingConfig, GenerationStatus, DetailLevel, SlideLayout } from './types';
import { BrandingPanel } from './components/BrandingPanel';
import { SlideRenderer } from './components/SlideRenderer';
import { Layout, Presentation, Wand2, Download, ChevronRight, FileText, CheckCircle, Loader2, AlertCircle, Pencil, Settings2, Sparkles, FileType, X, Play } from 'lucide-react';
import PptxGenJS from "pptxgenjs";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const SAMPLE_TEXT = `Session Overview
I want to explore digital behavior awareness by identifying the difference between necessary screen time (work tasks) and habitual screen time (scrolling, passive consumption) and recognizing triggers for after-work or late-night social media use. Also, this workshop aims to help young adults to develop strategies to decrease screen time without harming work productivity and build personalized daily rhythms that support offline recovery, rest, and focus. Lastly, it aims to result in a more sustainable behavior change and create a realistic plan for reducing screen fatigue, doomscrolling, and tech overload by building boundary-setting techniques and rituals for digital decompression.

Session Opening (10:45 - 11:00)
"We all know screens are a huge part of our lives. Today isn't about demonizing technology; it's about taking a mindful look at how we *use* it."
Key Points:
1. Awareness: Difference between necessary and habitual screen time.
2. Strategies: Practical tools to reduce screen time.
3. Sustainable Change: Building a personalized plan.

Digital Habit Mapping (11:00 - 11:30)
Participants will identify at least three specific digital habits that contribute to excessive screen time.
Distinguish between *active* and *passive* screen time.

Trigger Trap: Unmasking Your Digital Urges (11:30 - 12:00)
Participants will identify at least three personal triggers for unnecessary screen time.
Common Triggers: Boredom, stress, FOMO.
Strategy: Identify the craving before unlocking the phone.

Digital Sunset Ritual Design (12:15 - 12:45)
Goal: Intentionally transition from digital engagement to offline relaxation.
Output: Create a "Digital Sunset" plan.

Session Closing
Recap: We explored awareness, triggers, and rituals.
Action Item: Implement one small change this week.`;

const App: React.FC = () => {
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rawText, setRawText] = useState('');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('standard');
  
  // Full set of generated slides (hidden until revealed)
  const [allSlides, setAllSlides] = useState<Slide[]>([]);
  // Slides currently visible in the UI (for streaming effect)
  const [visibleSlides, setVisibleSlides] = useState<Slide[]>([]);
  
  const [status, setStatus] = useState<GenerationStatus>({
    isGenerating: false,
    isStreaming: false,
    error: null,
    success: false
  });
  
  const [branding, setBranding] = useState<BrandingConfig>({
    primaryColor: '#000000', // Black for high contrast Apple look
    secondaryColor: '#3B82F6', // Blue accent
    fontFamily: 'Inter, sans-serif',
    logoUrl: null,
    companyName: 'Metodic Workshops',
    borderRadius: 'rounded-xl',
    backgroundStyle: 'subtle-card',
    illustrationStyle: 'flat',
    mode: 'light'
  });

  const [exporting, setExporting] = useState<'json' | 'pdf' | 'pptx' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Presentation Mode State
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Window size for responsive presentation scaling
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check for API Key
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeyReady(hasKey);
      } else {
        // Fallback for local dev if window.aistudio is missing
        setApiKeyReady(true);
      }
    };
    checkKey();
  }, []);

  // Gamma-style Streaming Effect
  useEffect(() => {
    if (status.isStreaming && allSlides.length > 0) {
      if (visibleSlides.length < allSlides.length) {
        const timer = setTimeout(() => {
          setVisibleSlides(prev => {
              const nextSlideIndex = prev.length;
              return [...prev, allSlides[nextSlideIndex]];
          });
          
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 800); 
        return () => clearTimeout(timer);
      } else {
        setStatus(prev => ({ ...prev, isStreaming: false, success: true }));
      }
    }
  }, [status.isStreaming, visibleSlides.length, allSlides]);

  // Keyboard Handlers for Presentation
  useEffect(() => {
    if (!isPresenting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
            setCurrentSlideIndex(prev => Math.min(prev + 1, allSlides.length - 1));
        }
        if (e.key === 'ArrowLeft') {
            setCurrentSlideIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === 'Escape') {
            setIsPresenting(false);
            if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, allSlides.length]);

  // Trigger Fullscreen on Presentation Mode
  useEffect(() => {
      if (isPresenting) {
          document.documentElement.requestFullscreen().catch((e) => {
              console.warn("Fullscreen request failed", e);
          });
      }
  }, [isPresenting]);

  const handleGenerate = async () => {
    if (!rawText.trim()) return;
    
    setStatus({ isGenerating: true, isStreaming: false, error: null, success: false });
    setVisibleSlides([]);
    setAllSlides([]);

    try {
      const generatedSlides = await generateSlidesFromContent(rawText, detailLevel);
      setAllSlides(generatedSlides);
      
      setStatus(prev => ({ ...prev, isGenerating: false, isStreaming: true }));
      setStep(2); 

      // Hydrate Visuals in Background
      generatedSlides.forEach(async (slide, index) => {
          if (!slide.visual || slide.visual.type === 'none') return;
          try {
              let url = "";
              if (slide.visual.type === 'icon' && slide.visual.iconName) {
                  url = await searchIcon(slide.visual.iconName);
              } else if ((slide.visual.type === 'image' || slide.visual.type === 'illustration') && slide.visual.prompt) {
                  // Pass current illustration style
                  url = await generateImageForSlide(slide.visual.prompt, branding.illustrationStyle);
              }

              if (url) {
                  setAllSlides(prevSlides => {
                      const newSlides = [...prevSlides];
                      if (newSlides[index]) {
                           newSlides[index] = { ...newSlides[index], visual: { ...newSlides[index].visual!, contentUrl: url } };
                      }
                      return newSlides;
                  });

                  setVisibleSlides(prevVisible => {
                      if (index < prevVisible.length) {
                          const newVisible = [...prevVisible];
                          newVisible[index] = { ...newVisible[index], visual: { ...newVisible[index].visual!, contentUrl: url } };
                          return newVisible;
                      }
                      return prevVisible;
                  });
              }
          } catch (e) {
              console.error(`Failed to hydrate slide ${index}`, e);
          }
      });

    } catch (err: any) {
      setStatus({ isGenerating: false, isStreaming: false, error: err.message || "Failed to generate", success: false });
    }
  };

  const handleSlideUpdate = (id: string, updates: Partial<Slide>) => {
    setAllSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    setVisibleSlides(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleManualRegenerate = async (slideId: string, type: 'image' | 'icon', prompt: string) => {
    const slideIndex = allSlides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) return;

    let newContentUrl = '';
    
    if (type === 'image') {
        // Pass current illustration style
        newContentUrl = await generateImageForSlide(prompt, branding.illustrationStyle);
    } else {
        newContentUrl = await searchIcon(prompt);
    }

    const updatedSlides = [...allSlides];
    updatedSlides[slideIndex] = {
        ...updatedSlides[slideIndex],
        visual: {
            ...updatedSlides[slideIndex].visual!,
            contentUrl: newContentUrl,
            prompt: prompt,
            type: type === 'image' ? (updatedSlides[slideIndex].visual?.type === 'illustration' ? 'illustration' : 'image') : 'icon' 
        }
    };
    setAllSlides(updatedSlides);
    setVisibleSlides(prev => prev.map(s => s.id === slideId ? updatedSlides[slideIndex] : s));
  };

  const handleExportJSON = () => { /* ... (Same as before) */ 
    setExporting('json');
    try {
      const exportData = { meta: { generatedAt: new Date().toISOString(), app: "Metodic" }, branding, slides: allSlides };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${branding.companyName.replace(/\s+/g, '-').toLowerCase()}-deck.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExporting(null);
    } catch (e) { console.error(e); setExporting(null); }
  };

  const handleExportPDF = async () => { /* ... (Same as before) */
    setExporting('pdf');
    try {
      const pdf = new jsPDF('l', 'px', [1280, 720]);
      for (let i = 0; i < allSlides.length; i++) {
        const slideId = allSlides[i].id;
        const element = document.getElementById(slideId);
        if (element) {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, allowTaint: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            if (i > 0) pdf.addPage([1280, 720]);
            pdf.addImage(imgData, 'JPEG', 0, 0, 1280, 720);
        }
      }
      pdf.save(`${branding.companyName.replace(/\s+/g, '-').toLowerCase()}-deck.pdf`);
    } catch (e) { console.error("PDF generation failed", e); alert("Failed to generate PDF"); } finally { setExporting(null); }
  };

  const handleExportPPTX = () => { /* ... (Same as before, abbreviated for brevity in output, but would be full code) */
    setExporting('pptx');
    try {
        const pres = new PptxGenJS();
        pres.layout = 'LAYOUT_16x9';
        pres.defineSlideMaster({ title: 'MASTER_SLIDE', background: { color: 'FFFFFF' }, objects: [{ rect: { x: 0, y: 0, w: 0.2, h: '100%', fill: { color: branding.primaryColor.replace('#', '') } } }, { text: { text: branding.companyName.toUpperCase(), options: { x: 0.5, y: '92%', fontSize: 10, color: 'BBBBBB', bold: true } } }] });

        allSlides.forEach(slide => {
            let masterName = undefined;
            if (slide.layout !== SlideLayout.TITLE && slide.layout !== SlideLayout.SECTION_HEADER && slide.layout !== SlideLayout.CLOSING) { masterName = 'MASTER_SLIDE'; }
            let slideObj = pres.addSlide({ masterName });
            
            if (slide.layout === SlideLayout.TITLE) {
                slideObj.background = { color: 'FFFFFF' };
                slideObj.addText("Workshop", { x: 1, y: 2, fontSize: 14, color: branding.primaryColor.replace('#', ''), bold: true, charSpacing: 4 });
                slideObj.addText(slide.title, { x: 1, y: 2.5, w: '80%', fontSize: 44, color: '111827', bold: true });
                if (branding.companyName) { slideObj.addText(branding.companyName, { x: 1.5, y: 4, fontSize: 18, color: '6B7280' }); slideObj.addShape(pres.ShapeType.line, { x: 1, y: 4.1, w: 0.4, h: 0, line: { color: 'E5E7EB', width: 2 } }); }
            } else if (slide.layout === SlideLayout.SECTION_HEADER) {
                slideObj.background = { color: 'F9FAFB' };
                slideObj.addShape(pres.ShapeType.rect, { x: 0, y: '98%', w: '100%', h: 0.2, fill: { color: branding.secondaryColor.replace('#', '') } });
                slideObj.addText("NEXT SECTION", { x: '42%', y: 2.5, w: '16%', h: 0.4, align: 'center', fontSize: 10, color: '6B7280', fill: { color: 'FFFFFF' }, line: { color: 'E5E7EB' }, shape: pres.ShapeType.roundRect });
                slideObj.addText(slide.title, { x: 1, y: 3.2, w: '80%', align: 'center', fontSize: 40, color: '111827', bold: true });
            } else if (slide.layout === SlideLayout.CLOSING) {
                slideObj.background = { color: '111827' };
                slideObj.addText(slide.title, { x: 1, y: 2.5, w: '80%', align: 'center', fontSize: 44, color: 'FFFFFF', bold: true });
            } else {
                slideObj.addText(slide.title, { x: 1, y: 0.8, w: '80%', fontSize: 32, color: '111827', bold: true });
                if (slide.visual?.type === 'illustration' || slide.visual?.type === 'image') {
                    if (slide.visual.contentUrl) { slideObj.addImage({ data: slide.visual.contentUrl, x: 6.5, y: 1.5, w: 3, h: 3 }); } else { slideObj.addShape(pres.ShapeType.rect, { x: 6.5, y: 1.5, w: 3, h: 3, fill: { color: 'F3F4F6' } }); }
                    const bullets = slide.content.map(c => ({ text: c, options: { fontSize: 16, color: '374151', bullet: true, breakLine: true, paraSpaceAfter: 12 } }));
                    slideObj.addText(bullets, { x: 1, y: 1.8, w: 5, h: 4 });
                } else if (slide.layout === SlideLayout.TWO_COLUMN) {
                    const mid = Math.ceil(slide.content.length / 2);
                    const left = slide.content.slice(0, mid).map(c => ({ text: c, options: { fontSize: 16, color: '374151', breakLine: true } }));
                    const right = slide.content.slice(mid).map(c => ({ text: c, options: { fontSize: 16, color: '374151', breakLine: true } }));
                    slideObj.addText(left, { x: 1, y: 1.8, w: 4, h: 4 }); slideObj.addText(right, { x: 5.2, y: 1.8, w: 4, h: 4 });
                } else if (slide.layout === SlideLayout.BIG_NUMBER) {
                     slideObj.addText(slide.title, { x: 1, y: 1, fontSize: 24, color: '6B7280' });
                     slideObj.addText(slide.content[0], { x: 1, y: 2, fontSize: 120, color: branding.primaryColor.replace('#', ''), bold: true });
                } else {
                    const bullets = slide.content.map(c => ({ text: c, options: { fontSize: 18, color: '374151', bullet: { code: '2022', color: branding.primaryColor.replace('#', '') }, breakLine: true, paraSpaceAfter: 15 } }));
                    slideObj.addText(bullets, { x: 1, y: 1.8, w: 8, h: 4 });
                }
            }
            if (slide.speakerNotes) { slideObj.addNotes(slide.speakerNotes); }
        });
        pres.writeFile({ fileName: `${branding.companyName.replace(/\s+/g, '-').toLowerCase()}-deck.pptx` });
    } catch (e) { console.error("PPTX Error", e); alert("Failed to generate PowerPoint"); } finally { setExporting(null); }
  };

  const startPresentation = () => {
      setCurrentSlideIndex(0);
      setIsPresenting(true);
  };

  if (!apiKeyReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
           <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Metodic</h1>
           <p className="text-gray-500 mb-8">To generate high-quality decks with Gemini Pro and Imagen, please select your Google Cloud Project.</p>
           <button 
             onClick={async () => {
                if (window.aistudio) {
                    await window.aistudio.openSelectKey();
                    setApiKeyReady(true);
                }
             }}
             className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200"
           >
             Connect Google Account
           </button>
        </div>
      </div>
    );
  }

  // Presentation Overlay
  if (isPresenting) {
      // Calculate scale to fit 1280x720 logic into the current viewport (contain)
      const baseWidth = 1280;
      const baseHeight = 720;
      const scale = Math.min(
          windowSize.width / baseWidth, 
          windowSize.height / baseHeight
      );

      return (
          <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center overflow-hidden">
              <div 
                  style={{ 
                      width: baseWidth, 
                      height: baseHeight, 
                      transform: `scale(${scale})`,
                      transformOrigin: 'center center'
                  }} 
                  // Use key to trigger slideEnter animation on slide change
                  key={currentSlideIndex}
                  className="shadow-2xl bg-white animate-slide-enter"
              >
                   <SlideRenderer 
                        slide={allSlides[currentSlideIndex]} 
                        branding={branding} 
                        // In presentation mode, we trigger animations for the current slide
                        animate={true}
                   />
              </div>
              
              {/* Controls Overlay */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur text-white px-6 py-3 rounded-full flex items-center gap-6 opacity-0 hover:opacity-100 transition-opacity z-[110]">
                   <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} className="hover:text-indigo-400">Previous</button>
                   <span className="text-sm font-mono text-gray-400">{currentSlideIndex + 1} / {allSlides.length}</span>
                   <button onClick={() => setCurrentSlideIndex(Math.min(allSlides.length - 1, currentSlideIndex + 1))} className="hover:text-indigo-400">Next</button>
                   <div className="w-px h-4 bg-gray-600"></div>
                   <button onClick={() => { setIsPresenting(false); if (document.fullscreenElement) document.exitFullscreen(); }} className="hover:text-red-400"><X className="w-5 h-5" /></button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen overflow-hidden font-sans text-gray-900 bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-gray-100 flex items-center">
          <div className="bg-black text-white p-2 rounded-lg mr-3 shadow-lg">
             <Layout className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">Metodic.io</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <div onClick={() => setStep(1)} className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${step === 1 ? 'bg-gray-100 text-gray-900 font-semibold translate-x-1' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><FileText className="w-4 h-4 mr-3" />1. Content</div>
          <div onClick={() => allSlides.length > 0 && setStep(2)} className={`flex items-center p-3 rounded-lg transition-all duration-200 ${step === 2 ? 'bg-gray-100 text-gray-900 font-semibold translate-x-1' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'} ${allSlides.length === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}><Sparkles className="w-4 h-4 mr-3" />2. Generate & Style</div>
          <div onClick={() => allSlides.length > 0 && setStep(3)} className={`flex items-center p-3 rounded-lg transition-all duration-200 ${step === 3 ? 'bg-gray-100 text-gray-900 font-semibold translate-x-1' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'} ${allSlides.length === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}><Download className="w-4 h-4 mr-3" />3. Export</div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {step === 1 && (
          <div className="flex-1 overflow-y-auto p-10 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">What are we building today?</h1>
                <p className="text-lg text-gray-500">Paste your guide, notes, or outline. We'll handle the rest.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all focus-within:ring-2 ring-indigo-500/20 ring-offset-2">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center backdrop-blur-sm">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Source Content</span>
                        <button onClick={() => setRawText(SAMPLE_TEXT)} className="text-indigo-600 text-xs hover:text-indigo-800 font-semibold uppercase tracking-wide px-3 py-1 rounded hover:bg-indigo-50 transition-colors">Try Sample</button>
                    </div>
                    <textarea className="flex-1 w-full p-8 focus:outline-none resize-none text-gray-700 font-sans text-base leading-relaxed placeholder-gray-300" placeholder="Paste your content here..." value={rawText} onChange={(e) => setRawText(e.target.value)}/>
                </div>
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
                        <div className="flex items-center mb-6 text-gray-900">
                            <Settings2 className="w-5 h-5 mr-3 text-indigo-600" />
                            <h2 className="text-lg font-bold">Generation Settings</h2>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detail Level</label>
                            <div onClick={() => setDetailLevel('brief')} className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${detailLevel === 'brief' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-300 bg-white'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${detailLevel === 'brief' ? 'text-indigo-900' : 'text-gray-700'}`}>Brief Summary</span>
                                    <span className="text-xs font-mono bg-white/50 px-2 py-0.5 rounded text-gray-500">5-8 Slides</span>
                                </div>
                                <p className={`text-xs ${detailLevel === 'brief' ? 'text-indigo-700' : 'text-gray-500'}`}>High-level overview.</p>
                            </div>
                            <div onClick={() => setDetailLevel('standard')} className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${detailLevel === 'standard' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-300 bg-white'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${detailLevel === 'standard' ? 'text-indigo-900' : 'text-gray-700'}`}>Standard Deck</span>
                                    <span className="text-xs font-mono bg-white/50 px-2 py-0.5 rounded text-gray-500">10-15 Slides</span>
                                </div>
                                <p className={`text-xs ${detailLevel === 'standard' ? 'text-indigo-700' : 'text-gray-500'}`}>Balanced depth.</p>
                            </div>
                            <div onClick={() => setDetailLevel('detailed')} className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${detailLevel === 'detailed' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-300 bg-white'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${detailLevel === 'detailed' ? 'text-indigo-900' : 'text-gray-700'}`}>Detailed Training</span>
                                    <span className="text-xs font-mono bg-white/50 px-2 py-0.5 rounded text-gray-500">20+ Slides</span>
                                </div>
                                <p className={`text-xs ${detailLevel === 'detailed' ? 'text-indigo-700' : 'text-gray-500'}`}>Step-by-step breakdown.</p>
                            </div>
                        </div>
                    </div>
                    <button disabled={status.isGenerating || !rawText.trim()} onClick={handleGenerate} className={`w-full py-5 rounded-2xl text-white font-bold text-lg shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 ${status.isGenerating || !rawText.trim() ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        {status.isGenerating ? <span className="flex items-center justify-center"><Loader2 className="w-6 h-6 mr-3 animate-spin" />Analyzing...</span> : <span className="flex items-center justify-center"><Wand2 className="w-6 h-6 mr-3" />Generate Deck</span>}
                    </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 overflow-hidden flex bg-gray-100">
            <div className="w-80 border-r border-gray-200 bg-white h-full overflow-y-auto z-10 shadow-lg">
               <BrandingPanel config={branding} onChange={setBranding} />
               {!status.isStreaming && (
                   <div className="p-6 border-t border-gray-100">
                     <button onClick={() => setStep(3)} className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium shadow-md">Finalize & Export<ChevronRight className="w-4 h-4 ml-2" /></button>
                   </div>
               )}
            </div>
            <div className="flex-1 overflow-y-auto relative p-12 custom-scrollbar" ref={scrollRef}>
              <div className="max-w-5xl mx-auto space-y-16 pb-24">
                  {visibleSlides.map((slide, index) => (
                      <div key={slide.id} className={`transition-all duration-700 ease-out transform ${index === visibleSlides.length - 1 && status.isStreaming ? 'opacity-0 translate-y-10 animate-slide-in' : 'opacity-100 translate-y-0'}`} style={{ animationFillMode: 'forwards', animationName: index === visibleSlides.length - 1 && status.isStreaming ? 'slideIn' : 'none', animationDuration: '0.6s' }}>
                         <div className="flex items-center justify-between mb-4 px-2">
                             <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{slide.layout.replace('_', ' ')}</span>
                             </div>
                         </div>
                         <div className="ring-1 ring-gray-200 rounded-xl shadow-2xl">
                             <SlideRenderer 
                                slide={slide} 
                                branding={branding} 
                                onRegenerateVisual={handleManualRegenerate}
                                onUpdate={(id, updates) => handleSlideUpdate(id, updates)}
                                // Animate content if it's the latest slide being streamed
                                animate={status.isStreaming && index === visibleSlides.length - 1}
                             />
                         </div>
                      </div>
                  ))}
                  {status.isStreaming && <div className="flex flex-col items-center justify-center py-12 opacity-50"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" /><p className="text-gray-400 font-medium animate-pulse">Drafting next slide...</p></div>}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 overflow-y-auto p-10 bg-white">
             <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12 pb-6 border-b border-gray-100">
                  <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Ready to present?</h1>
                    <p className="text-gray-500">Review your speaker notes and export your deck.</p>
                  </div>
                  <div className="flex space-x-3">
                     <button onClick={startPresentation} className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold flex items-center transition-all shadow-lg hover:shadow-indigo-200"><Play className="w-4 h-4 mr-2" />Present Now</button>
                     <div className="h-full w-px bg-gray-200 mx-2"></div>
                     <button onClick={() => setStep(2)} className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold flex items-center transition-all"><Pencil className="w-4 h-4 mr-2" />Adjust Style</button>
                     <button onClick={handleExportPDF} disabled={!!exporting} className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-bold flex items-center transition-all disabled:opacity-50">{exporting === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileType className="w-4 h-4 mr-2" />}PDF</button>
                     <button onClick={handleExportPPTX} disabled={!!exporting} className="px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 font-bold flex items-center transition-all disabled:opacity-50">{exporting === 'pptx' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Presentation className="w-4 h-4 mr-2" />}PPTX</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 pb-20">
                   {allSlides.map((slide, index) => (
                     <div key={slide.id} className="flex flex-col group">
                        <div className="flex justify-between items-center mb-4">
                           <span className="font-bold text-gray-400 text-sm tracking-widest uppercase">Slide {index + 1}</span>
                           {slide.duration && <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{slide.duration}</span>}
                        </div>
                        <div className="ring-1 ring-gray-900/5 rounded-xl overflow-hidden shadow-lg transition-shadow group-hover:shadow-2xl">
                             <SlideRenderer 
                                slide={slide} 
                                branding={branding} 
                                id={slide.id} 
                                onRegenerateVisual={handleManualRegenerate}
                                onUpdate={(id, updates) => handleSlideUpdate(id, updates)}
                                animate={false} // No content animation in static review grid
                             />
                        </div>
                        {slide.speakerNotes && <div className="mt-6 bg-yellow-50/50 p-6 rounded-xl border border-yellow-100/50 text-sm text-yellow-900/80 leading-relaxed relative"><div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 rounded-l-xl"></div><span className="font-bold block text-xs uppercase text-yellow-600 mb-2 tracking-wider flex items-center"><FileText className="w-3 h-3 mr-1" /> Speaker Script</span>{slide.speakerNotes}</div>}
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

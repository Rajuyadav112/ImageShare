"use client";
import React, { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import ImageViewer from "@/components/ImageViewer";

type Message = { role: "user" | "ai", text: string, imageUrl?: string };
type UploadedImage = { url: string, name: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getMe()
      .then(profile => {
        setConnectionError(null);
        if (profile.is_superadmin) setIsSuperadmin(true);
        if (profile.name) setUserName(profile.name);
        if (profile.email) setUserEmail(profile.email);
        
        // Fetch historical uploads on mount to prevent images disappearing on reload
        api.getMyImages()
          .then(images => {
            const mapped = images.map((img: any) => ({
              url: img.url,
              name: img.url.split('/').pop() || img.id
            }));
            setUploadedImages(mapped);
          })
          .catch(console.error);
      })
      .catch((err: any) => {
        if (err.status === 0 || err.status >= 500) {
          setConnectionError("Backend server is offline or unreachable. Please make sure it is running.");
        } else {
          window.location.href = "/login";
        }
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await api.chat(userMsg);
      setMessages(prev => [...prev, { 
        role: "ai", 
        text: data.message, 
        imageUrl: data.generated_image_url 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const data = await api.uploadImage(file);
      setUploadedImages(prev => [{ url: data.url, name: file.name }, ...prev]);
    } catch (error) {
      alert("Upload failed. Make sure your local backend is running!");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <main className="flex flex-col h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      {connectionError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-red-800 text-sm font-medium flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{connectionError}</span>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* TOP NAVBAR */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-8 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
            A
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">ImageShare</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm font-medium">
          <a href="/" className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md bg-blue-50 text-blue-700">
            <span className="hidden sm:inline">Get Started</span>
            <span className="inline sm:hidden">Start</span>
          </a>
          <a href="/analytics" className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors">
            <span className="hidden sm:inline">Usage Analytics</span>
            <span className="inline sm:hidden">Analytics</span>
          </a>
          {isSuperadmin && (
            <a href="/admin" className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors">
              <span className="hidden sm:inline">Control Panel</span>
              <span className="inline sm:hidden">Admin</span>
            </a>
          )}
        </nav>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setIsChatOpen(prev => !prev)}
            className={`flex items-center gap-2 px-2.5 py-2 sm:px-4 sm:py-2 rounded-lg border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              isChatOpen 
                ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold" 
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span className="hidden sm:inline">✨ Aura AI</span>
          </button>
          
          <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>

          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(prev => !prev);
              }}
              className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {getInitials(userName)}
              </div>
              <span className="text-sm font-semibold text-slate-800 hidden md:inline max-w-[120px] truncate">{userName}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>

            {isDropdownOpen && (
              /* Dropdown Menu */
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-40"
              >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-400">Signed in as</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{userEmail}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                      Logout
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </header>

      {/* WORKSPACE AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Work Area */}
        <section className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
            
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="text-4xl">🚀</div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-1">Hey {userName}, welcome to ImageShare!</h1>
                <p className="text-slate-600">Complete the onboarding to start delivering optimized images.</p>
              </div>
            </div>

            {/* Upload Area */}
            <div className="saas-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Get started with Media Delivery</h2>
              
              <input 
                type="file" 
                id="file-upload"
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/jpeg, image/png, image/webp, image/gif" 
              />
              
              <label 
                htmlFor="file-upload"
                className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer group block"
              >
                <div className="bg-blue-50 p-4 rounded-full text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
                <h3 className="text-slate-800 font-semibold mb-1">
                  {isUploading ? "Uploading..." : "Upload files or drag here"}
                </h3>
                <p className="text-slate-500 text-sm">Drag and drop your files here or click to browse.</p>
              </label>
            </div>

            {/* Gallery Area */}
            <div className="saas-panel p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
               <h2 className="text-lg font-semibold text-slate-800 mb-4">Media Collections</h2>
               {uploadedImages.length === 0 ? (
                  <div className="text-slate-500 text-sm py-12 text-center border border-slate-100 rounded-xl bg-slate-50">
                    No assets uploaded yet. Use the upload box or tell Aura AI to generate one.
                  </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {uploadedImages.map((img, i) => (
                     <div key={i} className="border border-slate-200 rounded-xl p-3 flex flex-col gap-3 group bg-white shadow-sm hover:shadow-md transition-shadow">
                       <div 
                         className="aspect-video bg-slate-100 rounded-lg overflow-hidden relative cursor-zoom-in group-hover:opacity-95 transition-opacity"
                         onClick={() => setSelectedImageUrl(img.url)}
                         title="Click to view full resolution"
                       >
                         <img src={img.url} className="absolute inset-0 w-full h-full object-cover" alt={img.name} />
                       </div>
                       <div>
                         <p className="text-slate-800 text-sm font-medium truncate mb-2" title={img.name}>{img.name}</p>
                         <div className="flex gap-2">
                           <input type="text" readOnly value={img.url} className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-600 outline-none" />
                           <button 
                             className="btn-secondary px-3 py-1 text-xs active:bg-slate-200 transition-colors cursor-pointer"
                             onClick={() => {
                               navigator.clipboard.writeText(img.url);
                               alert("Image URL copied to clipboard!");
                             }}
                           >
                             Copy
                           </button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

          </div>
        </section>

        {/* SIDE-DOCKED COPILET CHAT */}
        <aside className={`border-l border-slate-200 bg-white flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out ${
          isChatOpen ? "w-[380px]" : "w-0 overflow-hidden border-l-0"
        }`}>
          {/* AI Header */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <h2 className="text-sm font-semibold text-slate-800">Aura AI Copilot</h2>
            </div>
            <button 
              onClick={() => setIsChatOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* AI Chat History */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-slate-400 text-center mt-10 text-xs flex flex-col items-center gap-2 px-4">
                <p className="text-base text-slate-700 font-semibold">Hi there! 👋</p>
                <p className="leading-relaxed">I can help you generate or edit images. Just ask me to generate assets, and they will automatically appear in your media library.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              msg.role === "user" ? (
                <div key={i} className="self-end max-w-[85%] bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none text-xs shadow-sm">
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ) : (
                <div key={i} className="self-start max-w-[90%] bg-white border border-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-none flex flex-col gap-3 text-xs shadow-sm">
                  <p className="leading-relaxed">{msg.text}</p>
                  {msg.imageUrl && (
                    <div className="w-full bg-slate-100 rounded-lg border border-slate-200 flex flex-col overflow-hidden">
                      <img 
                        src={msg.imageUrl} 
                        alt="Generated" 
                        className="w-full object-contain cursor-zoom-in hover:opacity-90 transition-opacity" 
                        onClick={() => setSelectedImageUrl(msg.imageUrl || null)}
                        title="Click to view full resolution"
                      />
                      <div className="p-2 bg-white border-t border-slate-100">
                        <input type="text" readOnly value={msg.imageUrl} className="w-full bg-transparent border-none text-[10px] text-slate-500 outline-none" />
                      </div>
                    </div>
                  )}
                </div>
              )
            ))}
            {isLoading && (
               <div className="self-start flex items-center gap-1.5 text-slate-400 bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
               </div>
            )}
          </div>

          {/* AI Input Area */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <div className="relative flex items-end">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Aura AI to generate or edit..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-12 py-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                rows={2}
              />
              <button 
                onClick={handleSend} 
                disabled={isLoading || !input.trim()} 
                className="absolute right-2 bottom-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {selectedImageUrl && (
        <ImageViewer imageUrl={selectedImageUrl} onClose={() => setSelectedImageUrl(null)} />
      )}
    </main>
  );
}

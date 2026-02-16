
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

import { useAppContext } from '../AppContext';

const ProductDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toggleSaved, isSaved, addToCart, inventory, cases, accessories } = useAppContext();
  /* State for gallery */
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const product = inventory.find(p => p.id === id) || cases.find(p => p.id === id) || accessories.find(p => p.id === id);

  useEffect(() => {
    if (product) {
      /* Initialize selected image */
      setSelectedImage(product.imageUrl);
    }
  }, [product]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (!product) return (
    <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-background-light dark:bg-background-dark">
      <span className="material-symbols-outlined text-slate-300 text-6xl mb-4">search_off</span>
      <h2 className="text-xl font-bold">Producto no encontrado</h2>
      <p className="text-slate-500 mb-6">Parece que este producto ya no está disponible en nuestro catálogo.</p>
      <button onClick={() => navigate('/')} className="bg-primary text-white px-6 py-2 rounded-xl font-bold">Volver al Mercado</button>
    </div>
  );

  const savingsPercent = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  /* Gallery Logic */
  const safeThumbnails = Array.isArray(product.thumbnails) ? product.thumbnails : [];
  // Main image is always first, then thumbnails from DB (which might be the same or additional images)
  // If thumbnails already includes main image or logic differs, adjust. 
  // Requirement: "si images is null or undefined, use empty array".
  // Note: AppContext maps 'images' to 'thumbnails'.
  // We want a unified list of unique images to show in gallery if > 1.

  // Construct gallery list: Main Image + Thumbnails. Filter out duplicates if any.
  // Actually, standard practice: Start with product.imageUrl. 
  // If thumbnails exist, they might be ALL images or just extra ones.
  // Let's assume thumbnails contains ALL images including main, or just extras.
  // Safe approach: Combine and deduplicate.
  const allImages = [product.imageUrl, ...safeThumbnails].filter((img, index, self) => img && self.indexOf(img) === index);

  const currentImage = selectedImage || product.imageUrl;

  const safeSpecs = (product.specs || []).filter(
    spec =>
      !spec.label?.startsWith('addition_') &&
      spec.label !== 'Estado'
  );



  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased">
      {/* Top Navigation Bar - Changed from fixed to sticky for better reliability */}
      <div className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-transparent dark:border-transparent transition-colors duration-200">
        <button
          onClick={handleBack}
          className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 transition-all text-slate-900 dark:text-white"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-80">Detalles</h2>
        <button className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 active:scale-95 transition-all text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">ios_share</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="relative flex flex-col pb-40">

        {/* Main Image Carousel & Thumbnails */}
        <div className="w-full px-4 mb-6 mt-4">
          <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-surface-dark/50 shadow-sm border border-slate-200 dark:border-slate-800">
            {/* Scrollable Container (Native Swipe) */}
            <div
              id="main-carousel"
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
              onScroll={(e) => {
                const scrollLeft = e.currentTarget.scrollLeft;
                const width = e.currentTarget.clientWidth;
                const index = Math.round(scrollLeft / width);
                if (allImages[index] && selectedImage !== allImages[index]) {
                  setSelectedImage(allImages[index]);
                }
              }}
            >
              {allImages.map((img, idx) => (
                <div key={idx} className="flex-none w-full h-full snap-center flex items-center justify-center bg-black/5">
                  <img
                    src={img}
                    className="w-full h-full object-cover cursor-zoom-in active:scale-[0.98] transition-transform duration-200 will-change-transform image-crisp"
                    alt={`${product.name} - Vista ${idx + 1}`}
                    onClick={() => setIsModalOpen(true)}
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Dots (Optional, if only 1 image hide) */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md">
                {allImages.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${selectedImage === allImages[idx] ? 'bg-white w-3' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}

            {/* Overlay Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>

            {/* Favorite FAB */}
            <button
              onClick={() => toggleSaved(product.id)}
              className={`absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/20 backdrop-blur-md transition-colors ${isSaved(product.id) ? 'text-red-500' : 'text-white'}`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isSaved(product.id) ? 'font-variation-settings-fill' : ''}`}>favorite</span>
            </button>
          </div>

          {/* Thumbnails Preview */}
          {allImages.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar py-1 px-1">
              {allImages.map((img, idx) => {
                const isActive = selectedImage === img; // or simplified check
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(img);
                      const carousel = document.getElementById('main-carousel');
                      if (carousel) {
                        carousel.scrollTo({
                          left: idx * carousel.clientWidth,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 cursor-pointer p-0.5 transition-all ${isActive ? 'border-primary opacity-100 ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full rounded-lg object-cover" alt={`Thumb ${idx}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Insight Box */}


        {/* Title and Price Block */}
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Vendedor Verificado
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <span className="material-symbols-outlined text-[14px]">fact_check</span>
              Calidad Certificada
            </div>
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight mb-1 text-slate-900 dark:text-white">{product.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">{product.storage} • {product.color} • Libre</p>

          <div className="flex items-end gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-6">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">${product.price}.00</span>
            {product.originalPrice && (
              <>
                <span className="text-base text-slate-400 line-through mb-1.5">${product.originalPrice}.00</span>
                <span className="text-sm font-medium text-green-500 mb-1.5 ml-auto">Ahorras {savingsPercent}%</span>
              </>
            )}
          </div>
        </div>

        {/* Spec Grid */}
        <div className="px-4 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Detalles del Dispositivo</h3>
          <div className="grid grid-cols-2 gap-3">

            {safeSpecs.map((spec, idx) => (
              <div key={idx} className="flex flex-col gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark">
                <div className="flex items-center justify-between">
                  <span className={`material-symbols-outlined ${idx === 0 ? 'text-green-500' : idx === 1 ? 'text-primary' : idx === 2 ? 'text-purple-500' : 'text-orange-500'}`}>{spec.icon}</span>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{spec.label}</p>
                  <p className="text-base font-semibold">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Fullscreen Zoom Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col animate-fadeIn">
              {/* Modal Header */}
              <div className="absolute top-0 w-full z-20 flex justify-between p-4">
                <h3 className="text-white/80 font-medium text-sm px-4 py-2 rounded-full bg-black/20 backdrop-blur-md">
                  {allImages.indexOf(selectedImage || "") + 1} / {allImages.length}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="size-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Zoomable Content */}
              <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden relative">
                {/* Note: Implementing swipe inside zoom modal is complex. 
                 We will use arrows for desktop and simple touch area detection or keep it simple with click-navigation for next/prev if needed.
                 Standard 'Premium' Lightboxes use swipe. 
                 Let's stick to a single Zoom View for the selected image, 
                 and allow changing images via thumbnails at the bottom of the modal or left/right click areas.
             */}
                <TransformWrapper
                  initialScale={1}
                  minScale={1}
                  maxScale={4}
                  centerOnInit
                  wheel={{ step: 0.2 }}
                >
                  <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                    <img
                      src={selectedImage || product.imageUrl}
                      className="w-full h-full object-contain max-h-screen"
                      alt="Zoom view"
                    />
                  </TransformComponent>
                </TransformWrapper>

                {/* Navigation Areas (Invisible Buttons for easy nav) */}
                <div className="absolute inset-y-0 left-0 w-1/4 z-10 flex items-center pl-4 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = allImages.indexOf(selectedImage || "");
                      const prev = idx > 0 ? allImages[idx - 1] : allImages[allImages.length - 1];
                      setSelectedImage(prev);
                    }}
                    className="p-3 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                </div>
                <div className="absolute inset-y-0 right-0 w-1/4 z-10 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = allImages.indexOf(selectedImage || "");
                      const next = idx < allImages.length - 1 ? allImages[idx + 1] : allImages[0];
                      setSelectedImage(next);
                    }}
                    className="p-3 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Modal Thumbnails */}
              <div className="w-full p-4 pb-8 overflow-x-auto no-scrollbar flex justify-center gap-2 z-20">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${selectedImage === img ? 'border-white scale-110 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="thumb" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="px-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Descripción</h3>
          <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <p className={showFullDescription ? "" : "line-clamp-3"}>
              {product.description}
            </p>
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-primary font-semibold mt-1 flex items-center gap-1 text-sm"
            >
              {showFullDescription ? "Leer menos" : "Leer más"}
              <span className={`material-symbols-outlined text-[16px] transition-transform ${showFullDescription ? 'rotate-180' : ''}`}>expand_more</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 w-full max-w-md mx-auto bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 pb-8 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase font-semibold">Precio Total</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">${product.price}.00</span>
          </div>
          <div className="flex flex-1 gap-2">
            <button
              onClick={() => {
                addToCart(product);
                navigate('/cart');
              }}
              className="flex-1 bg-primary text-white h-12 rounded-xl font-bold text-[14px] flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Carrito
            </button>
            <button
              className="flex-[1.5] bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white h-12 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all transform active:scale-[0.98]"
            >
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailScreen;

import { useAtom } from "jotai";
// Removed useEffect since we no longer need to track page changes for audio
import { pageAtom } from "./atoms";

export const UI = ({ logo, whatsapp, pages = [] }) => {
  const [page, setPage] = useAtom(pageAtom);

  // Dynamic WhatsApp Configuration
  const message = encodeURIComponent("Hi! I would like to place an order.");
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${message}`;

  // --- AUDIO LOGIC REMOVED ---

  return (
    <>
      {/* MAIN OVERLAY CONTAINER 
        z-10 ensures it sits above the MenuViewer (which is z-0).
        pointer-events-none allows clicks to pass through to the slider in the empty middle space.
      */}
      <main className="fixed inset-0 z-10 pointer-events-none select-none">
        
        {/* --- TOP HEADER (Reserved 200px) --- */}
        <div className="absolute top-0 left-0 w-full h-[200px] flex justify-between items-start p-5 md:p-8 bg-gradient-to-b from-black/60 to-transparent">
          
          {/* Logo */}
          <a className="pointer-events-auto transition-transform hover:scale-105 -mt-6" href="#">
            <img 
              className="w-24 md:w-32 drop-shadow-md" 
              src={logo} 
              alt="Restaurant Logo" 
            />
          </a>

          {/* Order Now Button */}
          <a
            className="pointer-events-auto bg-white text-black font-extrabold py-3 px-6 rounded-full shadow-xl hover:bg-[#FF4F18] hover:text-white transition-all duration-300 transform hover:scale-105 cursor-pointer uppercase text-xs md:text-sm tracking-widest -mt-0"
            href={whatsappUrl} 
            target="_blank"
            rel="noopener noreferrer"
          >
            Order Now
          </a>
        </div>

        {/* --- BOTTOM FOOTER (Reserved 140px) --- */}
        <div className="absolute bottom-0 left-0 w-full h-[140px] flex items-end justify-center pb-2 bg-gradient-to-t from-black/60 to-transparent">
          
          {/* Page Navigation Dock */}
          <div className="pointer-events-auto flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-2xl overflow-x-auto max-w-[90%] scrollbar-hide">
            
            {pages.map((_, index) => {
              // Determine button label
              let label = `${index + 1}`;
              if (index === 0) label = "Cover";
              
              return (
                <button
                  key={index}
                  className={`transition-all duration-300 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full font-bold text-xs shrink-0 ${
                    index === page
                      ? "bg-[#FF4F18] text-white shadow-lg scale-110"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                  onClick={() => setPage(index)}
                >
                  {label}
                </button>
              );
            })}

          </div>
        </div>

      </main>
    </>
  );
};
import React from 'react';
import { Navbar } from '../components/Navbar';

const Home = () => {
  // Palette variables for reference
  const colors = {
    bg: '#F2F4F6',      
    black: '#111318',   
    orange: '#f97316', 
  };

  return (
    <div className="min-h-screen font-sans selection:bg-black selection:text-white" style={{ backgroundColor: colors.bg, color: colors.black }}>
      
      {/* --- NAVBAR --- */}
      <Navbar />

      {/* --- HERO SECTION (id="home") --- */}
      <section id="home" className="pt-40 pb-20 px-6 text-center">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            The #1 Digital Menu Solution
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tight text-[#111318]">
            Bring Your Menu <br />
            <span className="text-orange-500">To Life.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Transform static PDFs into interactive 3D experiences. 
            <br className="hidden md:block"/>
            Simple, fast, and built for modern dining.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button className="bg-orange-500 hover:bg-orange-600 text-white h-14 px-10 rounded-xl text-lg font-bold transition-transform hover:-translate-y-1 shadow-xl shadow-orange-500/20">
              Create Menu
            </button>
            <button className="bg-black hover:bg-gray-800 text-white h-14 px-10 rounded-xl text-lg font-bold transition-transform hover:-translate-y-1 shadow-lg">
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION (id="features") --- */}
      <section id="features" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                title: "Interactive 3D Flip", 
                desc: "Real page-flipping physics directly in the browser.",
                number: "01"
              },
              { 
                title: "Instant Updates", 
                desc: "Edit prices and items instantly. No reprints needed.",
                number: "02"
              },
              { 
                title: "Smart Analytics", 
                desc: "Track customer views and popular dishes.",
                number: "03"
              }
            ].map((feature, i) => (
              <div key={i} className="group p-10 rounded-3xl bg-orange-500 text-white hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-14 h-14 bg-white text-orange-500 rounded-2xl flex items-center justify-center text-xl mb-8 font-black shadow-sm">
                  {feature.number}
                </div>
                <h3 className="text-3xl font-black mb-4">{feature.title}</h3>
                <p className="text-orange-100 text-lg font-medium leading-relaxed opacity-90">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION (id="pricing") --- */}
      <section id="pricing" className="py-20 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-6 tracking-tight">Simple Pricing.</h2>
            <p className="text-gray-500 text-xl font-medium">No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="p-12 rounded-[2.5rem] bg-[#111318] text-white flex flex-col hover:scale-[1.02] transition-transform duration-300">
              <h3 className="text-3xl font-bold mb-2">Starter</h3>
              <div className="text-6xl font-black mb-8 tracking-tighter">$0</div>
              <ul className="space-y-5 mb-12 flex-1 text-gray-400 font-medium">
                <li className="flex gap-4 items-center"><span className="text-white">✓</span> 1 Digital Menu</li>
                <li className="flex gap-4 items-center"><span className="text-white">✓</span> Standard QR Code</li>
                <li className="flex gap-4 items-center"><span className="text-white">✓</span> 100 Views/month</li>
              </ul>
              <button className="w-full py-5 rounded-2xl bg-white text-black text-lg font-black hover:bg-gray-200 transition-colors">
                Start Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-12 rounded-[2.5rem] bg-orange-500 text-white flex flex-col relative shadow-2xl shadow-orange-500/30 hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-8 right-8 bg-black text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest">
                Best Value
              </div>
              <h3 className="text-3xl font-bold mb-2">Pro</h3>
              <div className="text-6xl font-black mb-8 tracking-tighter">$29</div>
              <ul className="space-y-5 mb-12 flex-1 text-white font-medium">
                <li className="flex gap-4 items-center">★ Unlimited Views</li>
                <li className="flex gap-4 items-center">★ 3D Page Flip Effect</li>
                <li className="flex gap-4 items-center">★ Remove Branding</li>
                <li className="flex gap-4 items-center">★ Priority Support</li>
              </ul>
              <button className="w-full py-5 rounded-2xl bg-black text-white text-lg font-black hover:bg-gray-900 transition-colors">
                Get Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTACT / SUBSCRIBE SECTION (id="contact") --- */}
      <section id="contact" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto bg-[#111318] p-12 md:p-16 rounded-[3rem] text-center text-white shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Ready to Launch?</h2>
          <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of restaurants modernizing their dining experience today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-8 py-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:bg-white/20 transition-all font-medium"
            />
            <button className="px-10 py-5 bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30">
              Join Now
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-gray-400 font-medium text-sm">
        <div className="flex justify-center gap-8 mb-8">
          <a href="#" className="hover:text-black transition-colors">Twitter</a>
          <a href="#" className="hover:text-black transition-colors">Instagram</a>
          <a href="#" className="hover:text-black transition-colors">LinkedIn</a>
        </div>
        © 2024 MenuSent. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
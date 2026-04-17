'use client';

import { FaMapMarkerAlt, FaArrowLeft } from 'react-icons/fa';
import ProjectsMap from '@/components/ProjectsMap';
import Link from 'next/link';

export default function MapPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header - compact, professional */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-900/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors duration-200 text-sm font-medium border border-transparent hover:border-white/10"
              aria-label="Orqaga"
            >
              <FaArrowLeft className="w-4 h-4 shrink-0" />
              Orqaga
            </Link>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex w-9 h-9 rounded-lg bg-sky-500/15 items-center justify-center shrink-0 ring-1 ring-sky-400/20">
                <FaMapMarkerAlt className="w-4 h-4 text-sky-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-white truncate">
                  Xozirdagi loyihalar
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm truncate">
                  Toshkent shahridagi loyiha joylashuvlari
                </p>
              </div>
            </div>
            <div className="w-[72px] sm:w-20 shrink-0" aria-hidden />
          </div>
        </div>
      </header>

      {/* Map - more zoom, cleaner frame */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-5">
        <div className="rounded-xl sm:rounded-2xl overflow-hidden ring-1 ring-white/5 bg-slate-800/30 shadow-xl">
          <ProjectsMap />
        </div>
      </main>
    </div>
  );
}

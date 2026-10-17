'use client';

import React from 'react';

const PHONE_NUMBER = '0967323335';
const PHONE_DISPLAY = '0967.323.335';

export default function FloatingContactButtons() {
  return (
    <div className="fixed bottom-6 right-5 sm:right-7 z-50 flex flex-col items-end gap-3.5 select-none pointer-events-auto">
      
      {/* 1. BUTTON ZALO CHAT */}
      <a
        href={`https://zalo.me/${PHONE_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat qua Zalo"
        className="group relative flex items-center justify-end cursor-pointer no-underline"
      >
        {/* Tooltip Label (Expands on hover) */}
        <span className="hidden sm:inline-block absolute right-14 mr-2 px-3 py-1.5 rounded-none bg-white/95 backdrop-blur-md text-[#0068ff] font-semibold text-xs shadow-lg border border-[#0068ff]/20 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
          Chat Zalo: {PHONE_DISPLAY}
        </span>

        {/* Pulse Waves */}
        <span className="absolute -inset-1 rounded-full bg-[#0068ff]/40 animate-ping pointer-events-none" />
        <span className="absolute -inset-2 rounded-full bg-[#0068ff]/20 animate-pulse pointer-events-none" />

        {/* Main Icon Button */}
        <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#0052cc] via-[#0068ff] to-[#0084ff] text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-110 active:scale-95 border-2 border-white">
          {/* Zalo Vector Icon */}
          <svg
            className="w-7 h-7 sm:w-7.5 sm:h-7.5 fill-current"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M24 4C12.95 4 4 12.06 4 22c0 5.48 2.76 10.37 7.15 13.79-.31 2.33-1.19 5.86-2.5 8.13 2.73-.39 6.82-1.74 9.17-3.37 1.94.57 4.02.88 6.18.88 11.05 0 20-8.06 20-18S35.05 4 24 4zm-4.32 23.47h-5.25c-.55 0-1-.45-1-1v-8.94c0-.55.45-1 1-1h5.25c.55 0 1 .45 1 1v8.94c0 .55-.45 1-1 1zm8.64 0h-5.25c-.55 0-1-.45-1-1v-8.94c0-.55.45-1 1-1h5.25c.55 0 1 .45 1 1v8.94c0 .55-.45 1-1 1zm8.64 0h-5.25c-.55 0-1-.45-1-1v-8.94c0-.55.45-1 1-1h5.25c.55 0 1 .45 1 1v8.94c0 .55-.45 1-1 1z" fill="none"/>
            <text
              x="50%"
              y="58%"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="Arial, sans-serif"
              fontWeight="900"
              fontSize="17"
            >
              Zalo
            </text>
          </svg>
        </div>
      </a>

      {/* 2. BUTTON GỌI HOTLINE */}
      <a
        href={`tel:${PHONE_NUMBER}`}
        aria-label="Gọi hotline trực tiếp"
        className="group relative flex items-center justify-end cursor-pointer no-underline"
      >
        {/* Tooltip Label (Expands on hover) */}
        <span className="hidden sm:inline-block absolute right-14 mr-2 px-3 py-1.5 rounded-none bg-white/95 backdrop-blur-md text-[#5d371f] font-semibold text-xs shadow-lg border border-[#d5c3ba] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap">
          Hotline: {PHONE_DISPLAY}
        </span>

        {/* Pulse Waves */}
        <span className="absolute -inset-1 rounded-full bg-[#5d371f]/40 animate-ping pointer-events-none" />
        <span className="absolute -inset-2 rounded-full bg-[#c5a880]/30 animate-pulse pointer-events-none" />

        {/* Main Icon Button */}
        <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#5d371f] via-[#754426] to-[#8d5330] text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-110 active:scale-95 border-2 border-white">
          <span className="material-symbols-outlined text-[24px] sm:text-[26px] animate-[wiggle_1.5s_ease-in-out_infinite] group-hover:animate-none">
            call
          </span>
        </div>
      </a>

    </div>
  );
}

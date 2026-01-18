import React from 'react';

export const Logo = ({ className = "text-[#2c81fb] w-8 h-8" }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none"
    className={className} // Pass text-color here to change background
  >
    {/* Background: Inherits text color */}
    <rect x="0" y="0" width="24" height="24" rx="6" fill="currentColor" />
    
    {/* Icon: Always White, scaled for padding */}
    <g transform="translate(3, 3) scale(0.75)">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" 
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 13a4.5 4.5 0 0 0 3-4" 
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" 
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3.477 10.896a4 4 0 0 1 .585-.396" 
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 18a4 4 0 0 1-1.967-.516" 
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 13h4" 
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 18h6a2 2 0 0 1 2 2v1" 
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 8h8" 
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 8V5a2 2 0 0 1 2-2" 
             stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="16" cy="13" r=".5" fill="white" />
        <circle cx="18" cy="3" r=".5" fill="white" />
        <circle cx="20" cy="21" r=".5" fill="white" />
        <circle cx="20" cy="8" r=".5" fill="white" />
    </g>
  </svg>
);
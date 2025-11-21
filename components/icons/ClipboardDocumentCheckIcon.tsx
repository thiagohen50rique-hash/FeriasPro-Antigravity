import React from 'react';

const ClipboardDocumentCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-1.125 0-2.25.9-2.25 2.25v13.5c0 1.125.9 2.25 2.25 2.25h9c1.125 0 2.25-.9 2.25-2.25v-9.75M14.25 9l-3.75 3.75-1.5-1.5M12 9h.008v.008H12V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-3.314 0-6 2.686-6 6v2.25c0 3.314 2.686 6 6 6s6-2.686 6-6V8.25c0-3.314-2.686-6-6-6zM15.75 5.25v.008h.008v-.008h-.008z" />
  </svg>
);

export default ClipboardDocumentCheckIcon;
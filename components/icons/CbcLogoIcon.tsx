import React from 'react';

const CbcLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg 
        viewBox="0 0 130 40" 
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor" 
        {...props}
    >
        <text 
            x="50%" 
            y="50%" 
            dominantBaseline="middle" 
            textAnchor="middle" 
            fontSize="38" 
            fontWeight="bold" 
            fontFamily="Glober, sans-serif"
        >
            CBC
        </text>
    </svg>
);

export default CbcLogoIcon;
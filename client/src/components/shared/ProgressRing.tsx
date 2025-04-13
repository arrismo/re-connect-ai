import { useEffect, useState } from "react";

interface ProgressRingProps {
  percent: number;
  size: number;
  strokeWidth: number;
  color: string;
  children?: React.ReactNode;
}

export default function ProgressRing({ 
  percent, 
  size, 
  strokeWidth, 
  color, 
  children 
}: ProgressRingProps) {
  const [circumference, setCircumference] = useState(0);
  const [offset, setOffset] = useState(0);
  
  // Calculate the circle's circumference and stroke-dashoffset
  useEffect(() => {
    const radius = (size / 2) - (strokeWidth / 2);
    const circ = 2 * Math.PI * radius;
    setCircumference(circ);
    
    const calculatedOffset = circ - (percent / 100 * circ);
    setOffset(calculatedOffset);
  }, [percent, size, strokeWidth]);
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="progress-ring" width={size} height={size}>
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={(size / 2) - (strokeWidth / 2)} 
          stroke="#E5E7EB" 
          strokeWidth={strokeWidth} 
          fill="transparent"
        />
        <circle 
          cx={size / 2} 
          cy={size / 2} 
          r={(size / 2) - (strokeWidth / 2)} 
          stroke={color} 
          strokeWidth={strokeWidth} 
          fill="transparent" 
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns/format";
import Image from "next/image";

interface SlideshowProps {
  className?: string;
}

const images = [
  "/images/forms/pexels-eberhardgross-2098427.jpg",
  "/images/forms/pexels-fotios-photos-2215534.jpg",
  "/images/forms/pexels-rahulp9800-1212487.jpg",
  "/images/forms/pexels-todd-trapani-488382-1420440.jpg",
  "/images/forms/pexels-vladbagacian-1368382.jpg",
];

export function Slideshow({ className = "" }: SlideshowProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Digital clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Slideshow Images */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image}
              alt={`Form background ${index + 1}`}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}

        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Digital Clock Overlay */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
        <div className="text-lg font-mono font-bold tracking-wider text-right">
          {format(currentTime, "HH:mm:ss")}
        </div>
        <div className="text-xs text-white/80 mt-1 text-right">
          {format(currentTime, "EEEE, dd MMMM yyyy")}
        </div>
      </div>

      {/* Slideshow Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentImageIndex
                ? "bg-white scale-125"
                : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

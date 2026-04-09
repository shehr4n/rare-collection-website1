"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const galleryImages = images.length ? images : [];

  return (
    <div className="product-gallery">
      <div
        ref={trackRef}
        className="product-gallery-track"
        aria-label="Product image gallery"
        onScroll={(event) => {
          const container = event.currentTarget;
          const nextIndex = Math.round(container.scrollLeft / container.clientWidth);
          if (nextIndex !== activeIndex) {
            setActiveIndex(nextIndex);
          }
        }}
      >
        {galleryImages.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className={`product-gallery-slide${index === activeIndex ? " is-active" : ""}`}
          >
            <Image src={image} alt={`${alt} ${index + 1}`} width={900} height={1200} className="product-detail-image" />
          </div>
        ))}
      </div>
      {galleryImages.length > 1 ? (
        <div className="product-gallery-dots">
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-dot-${index}`}
              type="button"
              className={`gallery-dot${index === activeIndex ? " is-active" : ""}`}
              onClick={() => {
                setActiveIndex(index);
                trackRef.current?.scrollTo({ left: index * trackRef.current.clientWidth, behavior: "smooth" });
              }}
              aria-label={`Show image ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
      {galleryImages.length > 1 ? (
        <div className="product-gallery-thumbs">
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-thumb-${index}`}
              type="button"
              className={`product-gallery-thumb${index === activeIndex ? " is-active" : ""}`}
              onClick={() => {
                setActiveIndex(index);
                trackRef.current?.scrollTo({ left: index * trackRef.current.clientWidth, behavior: "smooth" });
              }}
            >
              <Image src={image} alt={`${alt} thumbnail ${index + 1}`} width={120} height={150} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

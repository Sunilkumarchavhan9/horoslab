import React from "react";

export function ImageGallerySection() {
  const images = [
    "/developer-console.jpg",
    "/dev-console2.jpg",
    "/dev.jpg",
  ];

  return (
    <section id="image-gallery" className="bg-white py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h3 className="mb-6 text-2xl font-semibold text-gray-900">Screenshots</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((src, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg border">
              <img src={src} alt={`screenshot-${i}`} className="h-56 w-full object-cover" />
              <div className="absolute left-0 bottom-0 w-full bg-gradient-to-t from-black/50 to-transparent px-3 py-2 text-white">
                <p className="text-sm">Preview {i + 1}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ImageGallerySection;

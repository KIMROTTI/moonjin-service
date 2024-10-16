"use client";

import { JSX, ReactElement, useEffect, useRef, useState } from "react";

type UseCarouselProps = {
  length: number;
  width: number;
};

type CarouselProps = {
  children: ReactElement;
};

type UseCarouselReturn = {
  Carousel: ({ children }: CarouselProps) => JSX.Element;
  prevEvent: () => void;
  nextEvent: () => void;
};

const Carousel = ({ children }: CarouselProps) => {
  return (
    <div className="flex w-full overflow-hidden h-full items-center">
      <ul
        id="carousel"
        className="flex w-fit h-fit  transition duration-150 ease-in-out"
      >
        {children}
      </ul>
    </div>
  );
};

export default function useCarousel({
  length,
  width,
}: UseCarouselProps): UseCarouselReturn {
  const carouselRef = useRef<HTMLElement | null>(null);
  const [currCell, setCurrCell] = useState(0);

  const prevEvent = () => {
    setCurrCell((prev) => (prev === 0 ? length - 1 : prev - 1));
  };

  const nextEvent = () => {
    setCurrCell((prev) => (prev === length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    if (document) carouselRef.current = document.getElementById("carousel");
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.style.transform = `translateX(-${
        currCell * width
      }px) `;
    }
  }, [currCell]);

  return { Carousel, prevEvent, nextEvent };
}

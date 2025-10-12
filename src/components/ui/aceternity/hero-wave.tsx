"use client";
import React from "react";
import { WavyBackground } from "../wavy-background";
import { MovingBorder } from "../moving-border";
import { MovingBorderDemo } from "./moving-border";

export function Wavy({name='to Procrastinot'}: any) {
  return (
    <WavyBackground className="max-w-4xl mx-auto pb-40">
      <p className="text-2xl md:text-4xl lg:text-7xl text-white font-bold inter-var text-center">
        Welcome {name}!
      </p>
      <MovingBorderDemo/>
    </WavyBackground>
  );
}

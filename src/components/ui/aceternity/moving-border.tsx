"use client";
import React from "react";
import { Button } from "../moving-border";
import Link from "next/link";

export function MovingBorderDemo() {
  return (
    <div className="flex justify-center">
        <Link href='/workflows'>
        <Button
        borderRadius="1.75rem"
        className="bg-white dark:bg-slate-900 text-black dark:text-white text-l border-neutral-200 dark:border-slate-800 px-10"
      >
        Start Building
      </Button>
        </Link>
      
    </div>
  );
}

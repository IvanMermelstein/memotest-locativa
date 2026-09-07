"use client"

import { memo } from "react"
import Image, { type StaticImageData } from "next/image"
import { Card } from "@/components/ui/card"
import cardBack from "@/public/tabletas-memotest.jpg"

interface MemoCardProps {
  id: number
  imageSrc: StaticImageData
  isFlipped: boolean
  isMatched: boolean
  matchState: "idle" | "correct" | "wrong"
  onClick: (id: number) => void
}

function MemoCardComponent({ id, imageSrc, isFlipped, isMatched, matchState, onClick }: MemoCardProps) {
  const showFace = isFlipped || isMatched
  const feedbackClass =
    isMatched || matchState === "correct"
      ? "ring-2 ring-green-400 bg-green-50"
      : matchState === "wrong"
        ? "ring-2 ring-red-400"
        : ""

  return (
    <Card
      className={`
        aspect-square cursor-pointer transition-transform duration-300 will-change-transform hover:scale-105 [perspective:1000px]
        ${feedbackClass}
        ${showFace ? "shadow-lg" : "shadow-md hover:shadow-lg"}
      `}
      onClick={() => onClick(id)}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 will-change-transform [transform-style:preserve-3d] ${
          showFace ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Back face (shown while unflipped): tabletas Memotest */}
        <div className="absolute inset-0 flex items-center justify-center p-2 [backface-visibility:hidden]">
          <div className="w-full h-full rounded-md flex items-center justify-center relative overflow-hidden">
            <Image src={cardBack} alt="" fill className="object-cover" priority />
          </div>
        </div>

        {/* Front face (image) */}
        <div className="absolute inset-0 flex items-center justify-center p-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="w-full h-full rounded-md flex items-center justify-center">
            <Image src={imageSrc} alt="" width={125.5} height={125.5} priority />
          </div>
        </div>
      </div>
    </Card>
  )
}

export const MemoCard = memo(MemoCardComponent)

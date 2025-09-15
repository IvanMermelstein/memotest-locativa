"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RotateCcw, Trophy } from "lucide-react"
import Image from 'next/image'
import arboria from '@/public/logo-arboria.jpg'
import ciudad from '@/public/logo-ciudad.jpg'
import clash from '@/public/logo-clash.jpg'
import datic from '@/public/logo-datic.jpg'
import firmia from '@/public/logo-firmia.jpeg'
import locativa from '@/public/logo-locativa.jpg'
import rosental from '@/public/logo-rosental.jpg'
import vida from '@/public/logo-vida.jpg'
import cabeceraRosental from '@/public/logo-cabecera-rosental.png'
import { useRouter } from "next/navigation"
import { NameModal } from "./components/NameModal"
import Link from 'next/link'


interface GameCard {
  id: number
  imageId: number
  isFlipped: boolean
  isMatched: boolean
}

const getCardImageSrc = (imageId: number): string => {
  const images = [arboria, ciudad, clash, datic, firmia, locativa, rosental, vida]
  return images[imageId - 1] || images[0]
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function Component() {
  const [cards, setCards] = useState<GameCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [moves, setMoves] = useState(0)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timeLimit, setTimeLimit] = useState(60)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFailed, setGameFailed] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const router = useRouter()

  // Initialize game
  const initializeGame = (newTimeLimit = 60) => {
    const imageIds = Array.from({ length: 8 }, (_, i) => i + 1)
    const cardPairs = [...imageIds, ...imageIds]

    const shuffledCards = cardPairs
      .map((imageId, index) => ({
        id: index,
        imageId,
        isFlipped: false,
        isMatched: false,
      }))
      .sort(() => Math.random() - 0.5)

    setCards(shuffledCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setGameCompleted(false)
    setGameFailed(false)
    setIsChecking(false)
    setTimeLimit(newTimeLimit)
    setTimeLeft(newTimeLimit)
    setGameStarted(false)
  }

  // Initialize game on component mount
  useEffect(() => {
    initializeGame()
  }, [])

  useEffect(() => {
    if (gameCompleted) {
      setShowNameModal(true)
    }
  }, [gameCompleted])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (gameStarted && timeLeft > 0 && !gameCompleted && !gameFailed) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameFailed(true)
            setGameStarted(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameStarted, timeLeft, gameCompleted, gameFailed])

  const handleSaveName = async (firstName: string, lastName: string) => {
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, moves, time: timeLimit - timeLeft })
    })
    setShowNameModal(false)
  }

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (isChecking || flippedCards.length >= 2 || gameFailed) return

    // Start timer on first card click
    if (!gameStarted) {
      setGameStarted(true)
    }

    const card = cards.find((c) => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Update card state
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)))

    // Check for match when two cards are flipped
    if (newFlippedCards.length === 2) {
      setIsChecking(true)
      setMoves((prev) => prev + 1)

      const [firstCardId, secondCardId] = newFlippedCards
      const firstCard = cards.find((c) => c.id === firstCardId)
      const secondCard = cards.find((c) => c.id === secondCardId)

      if (firstCard && secondCard && firstCard.imageId === secondCard.imageId) {
        // Match found
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === firstCardId || c.id === secondCardId ? { ...c, isMatched: true } : c)),
          )
          setMatchedPairs((prev) => prev + 1)
          setFlippedCards([])
          setIsChecking(false)
        }, 1000)
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === firstCardId || c.id === secondCardId ? { ...c, isFlipped: false } : c)),
          )
          setFlippedCards([])
          setIsChecking(false)
        }, 1500)
      }
    }
  }

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === 8) {
      setGameCompleted(true)
    }
  }, [matchedPairs])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[#0B2558] to-black">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-4">
          <Image
            src={cabeceraRosental}
            width={400}
            height={180}
            priority={true}
            className="mb-8 mx-auto"
          />
          <p className="text-gray-100">¡Encontrá todos los pares iguales!</p>
        </div>

        {/* Game Stats */}
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{moves}</div>
            <div className="text-sm text-gray-100">Movimientos</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${timeLeft <= 30 ? "text-red-600" : "text-orange-600"}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-100">Tiempo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{matchedPairs}/8</div>
            <div className="text-sm text-gray-100">Pares</div>
          </div>
          <Button onClick={() => initializeGame(timeLimit)} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Link href="/ranking">
            <Button variant="outline" size="sm" className="gap-2">
              <Trophy className="w-4 h-4" />
              Ranking
            </Button>
          </Link>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-4 gap-4 mb-6 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
          {cards.map((card) => (
            <Card
              key={card.id}
              className={`
                aspect-square cursor-pointer transition-all duration-300 hover:scale-105
                ${card.isMatched ? "ring-2 ring-green-400 bg-green-50" : ""}
                ${card.isFlipped || card.isMatched ? "shadow-lg" : "shadow-md hover:shadow-lg"}
              `}
              onClick={() => handleCardClick(card.id)}
            >
              <div className="w-full h-full flex items-center justify-center p-2">
                {card.isFlipped || card.isMatched ? (
                  <div
                    className={`
                      w-full h-full rounded-md flex items-center justify-center
                    `}
                  >
                    <Image
                      src={getCardImageSrc(card.imageId)}
                      width={125.5}
                      height={125.5}
                      priority={true}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-400 to-slate-600 rounded-md flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                    <div className="w-8 h-8 bg-white/20 rounded-full relative z-10"></div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Game Completion Modal */}
        {gameCompleted && (
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border-2 border-green-200">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Felicitaciones! 🎉</h2>
            <p className="text-gray-800 mb-4">Completaste el juego en {moves} movimientos!</p>
            <Button onClick={() => initializeGame(timeLimit)} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Intentar de Nuevo
            </Button>
          </div>
        )}

        {/* Game Failed Modal */}
        {gameFailed && (
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border-2 border-red-200">
            <div className="w-16 h-16 text-red-500 mx-auto mb-4 text-6xl">⏰</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">¡Tiempo Agotado! ⏱️</h2>
            <p className="text-gray-800 mb-4">
              Se acabó el tiempo. Encontraste {matchedPairs} de 8 pares en {moves} movimientos.
            </p>
            <Button onClick={() => initializeGame(timeLimit)} className="gap-2 bg-red-600 hover:bg-red-700">
              <RotateCcw className="w-4 h-4" />
              Intentar de Nuevo
            </Button>
          </div>
        )}
      </div>
      <NameModal open={showNameModal} onSubmit={handleSaveName} />
    </div>
  )
}

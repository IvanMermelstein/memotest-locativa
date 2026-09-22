"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { MemoCard } from "@/components/MemoCard"
import { RotateCcw, Trophy } from "lucide-react"
import Image from 'next/image'
import sticker1 from '@/public/sticker-1.png'
import sticker2 from '@/public/sticker-2.png'
import sticker3 from '@/public/sticker-3.png'
import sticker4 from '@/public/sticker-4.png'
import sticker5 from '@/public/sticker-5.png'
import sticker6 from '@/public/sticker-6.png'
import sticker7 from '@/public/sticker-7.png'
import sticker8 from '@/public/sticker-8.png'
import cabeceraLocativa from '@/public/logo-superior-memotest.png'
import { useRouter } from "next/navigation"
import { NameModal } from "./components/NameModal"
import { GameFailedModal } from "./components/GameFailedModal"
import { PreGameModal } from "./components/PreGameModal"
import Link from 'next/link'


interface GameCard {
  id: number
  imageId: number
  isFlipped: boolean
  isMatched: boolean
  matchState: "idle" | "correct" | "wrong"
}

import type { StaticImageData } from "next/image"

const getCardImageSrc = (imageId: number): StaticImageData => {
  const images = [sticker1, sticker2, sticker3, sticker4, sticker5, sticker6, sticker7, sticker8]
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
  const [showGameFailedModal, setShowGameFailedModal] = useState(false)
  const [showPreGameModal, setShowPreGameModal] = useState(false)
  const [playerInfo, setPlayerInfo] = useState<{ firstName: string; lastName: string; phone: string } | null>(null)
  const router = useRouter()

  // Latest-value ref so handleCardClick can stay referentially stable
  // (required for MemoCard's React.memo to actually skip re-renders)
  // while still reading up-to-date state.
  const latestRef = useRef({ cards, flippedCards, isChecking, gameFailed, gameStarted, playerInfo })
  latestRef.current = { cards, flippedCards, isChecking, gameFailed, gameStarted, playerInfo }

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
        matchState: "idle" as const,
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

  // Arma el tablero al cargar la página, pero queda inerte (ver
  // handleCardClick) hasta que el jugador toque Reset y complete el popup
  // de datos — así el ranking queda accesible sin que nada lo bloquee.
  useEffect(() => {
    initializeGame()
  }, [])

  // Guarda el puntaje sin pedir confirmación — el dato de contacto ya se
  // levantó en el popup previo, así que apenas termina la partida (gane o
  // pierda) se manda solo, se vea o no se vea el popup de resultado. Una
  // partida perdida (se acabó el tiempo) se guarda igual, pero marcada como
  // no válida para que no cuente en el ranking.
  const saveScore = (finalMoves: number, finalTime: number, valid: boolean) => {
    if (!playerInfo) return
    fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: playerInfo.firstName,
        lastName: playerInfo.lastName,
        phone: playerInfo.phone,
        moves: finalMoves,
        time: finalTime,
        valid,
      }),
    })
  }

  useEffect(() => {
    if (gameCompleted) {
      saveScore(moves, timeLimit - timeLeft, true)
      setShowNameModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameCompleted])

  useEffect(() => {
    if (gameFailed) {
      saveScore(moves, timeLimit - timeLeft, false)
      setShowGameFailedModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFailed])

  // Una partida nueva (botón Comenzar/Reset) vuelve a pedir
  // nombre/apellido/teléfono, ya que es un intento voluntario y distinto.
  const requestNewGame = () => {
    setShowPreGameModal(true)
  }

  const handlePreGameSubmit = (firstName: string, lastName: string, phone: string) => {
    setPlayerInfo({ firstName, lastName, phone })
    setShowPreGameModal(false)
    initializeGame(timeLimit)
  }

  // Al cerrar el popup de resultado (con "OK") se vuelve a la pantalla
  // principal en reposo, igual que si se acabara de abrir la página — sin
  // volver a mostrar ningún popup ni dejar jugar hasta que el jugador
  // toque Comenzar/Reset por su cuenta.
  const handleGameOverClose = () => {
    setShowNameModal(false)
    setShowGameFailedModal(false)
    setPlayerInfo(null)
    initializeGame()
  }

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

  // Handle card click.
  // Reads state from `latestRef` instead of closuring it directly so this
  // function keeps a stable identity across renders — required for
  // MemoCard's React.memo to skip re-rendering unaffected cards.
  const handleCardClick = useCallback((cardId: number) => {
    const { cards, flippedCards, isChecking, gameFailed, gameStarted, playerInfo } = latestRef.current
    if (!playerInfo || isChecking || flippedCards.length >= 2 || gameFailed) return

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
      const isMatch = !!firstCard && !!secondCard && firstCard.imageId === secondCard.imageId

      // Give an immediate visual cue (green/red ring) as soon as the second
      // card flips, instead of leaving the user guessing until the timeout
      // below resolves the pair.
      setCards((prev) =>
        prev.map((c) =>
          c.id === firstCardId || c.id === secondCardId
            ? { ...c, matchState: isMatch ? "correct" : "wrong" }
            : c,
        ),
      )

      if (isMatch) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstCardId || c.id === secondCardId
                ? { ...c, isMatched: true, matchState: "idle" }
                : c,
            ),
          )
          setMatchedPairs((prev) => prev + 1)
          setFlippedCards([])
          setIsChecking(false)
        }, 600)
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstCardId || c.id === secondCardId
                ? { ...c, isFlipped: false, matchState: "idle" }
                : c,
            ),
          )
          setFlippedCards([])
          setIsChecking(false)
        }, 900)
      }
    }
  }, [])

  // Check for game completion
  useEffect(() => {
    if (matchedPairs === 8) {
      setGameCompleted(true)
    }
  }, [matchedPairs])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#f5f5f5]">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-4">
          {/* El PNG es un cuadrado de 1080x1080 con bastante margen blanco arriba/abajo
              del logo. En vez de agrandar el cuadrado entero, recortamos ese margen con
              un contenedor más bajo que ancho + object-cover, para que se vea como un
              banner en vez de un cuadrado. */}
          <div className="relative w-full max-w-[500px] mx-auto my-4 overflow-hidden">
            {/* Espaciador que fuerza el alto según el ancho (relación 500:263)
                sin depender de aspect-ratio, no soportado en navegadores/tablets viejos */}
            <div className="pt-[52.6%]" />
            <Image
              src={cabeceraLocativa}
              fill
              priority={true}
              className="object-cover object-center"
              alt="Locativa Garantías"
            />
          </div>
          <p className="text-gray-700 font-bold text-lg mb-2">Somos la garantía que necesitás para alquilar.</p>
          <p className="text-gray-700">¡Encontrá todos los pares iguales!</p>
        </div>

        {/* Game Stats */}
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{moves}</div>
            <div className="text-sm text-gray-600">Movimientos</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${timeLeft <= 30 ? "text-red-600" : "text-orange-600"}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-600">Tiempo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{matchedPairs}/8</div>
            <div className="text-sm text-gray-600">Pares</div>
          </div>
          <Button onClick={requestNewGame} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {playerInfo ? "Reset" : "Comenzar"}
          </Button>
          <Link href="/ranking">
            <Button variant="outline" size="sm" className="gap-2">
              <Trophy className="w-4 h-4" />
              Ranking
            </Button>
          </Link>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-4 gap-4 mb-6 p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
          {cards.map((card) => (
            <MemoCard
              key={card.id}
              id={card.id}
              imageSrc={getCardImageSrc(card.imageId)}
              isFlipped={card.isFlipped}
              isMatched={card.isMatched}
              matchState={card.matchState}
              onClick={handleCardClick}
            />
          ))}
        </div>
      </div>
      <NameModal
        open={showNameModal}
        moves={moves}
        onClose={handleGameOverClose}
      />
      <GameFailedModal
        open={showGameFailedModal}
        matchedPairs={matchedPairs}
        moves={moves}
        onClose={handleGameOverClose}
      />
      <PreGameModal open={showPreGameModal} onSubmit={handlePreGameSubmit} />
    </div>
  )
}

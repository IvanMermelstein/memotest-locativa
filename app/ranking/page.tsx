'use client'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Score { firstName: string; lastName: string; phone: string; moves: number; time: number }
const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function RankingPage() {
  const { data, error } = useSWR<Score[]>('/api/scores', fetcher)
  if (error) return <div className="min-h-screen bg-[#f5f5f5] text-gray-700 p-6">Error al cargar ranking</div>
  if (!data) return <div className="min-h-screen bg-[#f5f5f5] text-gray-700 p-6">Cargando...</div>

  return (
    <div className="min-h-screen p-6 bg-[#f5f5f5] text-gray-700">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl text-gray-800 mb-6 text-center mt-8">🏆 Ranking</h1>
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="grid grid-cols-5 gap-4 font-bold pb-2 border-b border-gray-300">
              <div>Posición</div><div>Nombre</div><div>Teléfono</div><div>Movimientos</div><div>Tiempo</div>
            </div>
            {data.slice(0, 20).map((s, i) => (
              <div key={i} className={`${i % 2 === 0 ? 'bg-black/5' : ''} grid grid-cols-5 gap-4 py-2`}>
                <div className="ml-2">{i + 1}</div>
                <div>{s.firstName} {s.lastName}</div>
                <div>{s.phone}</div>
                <div className="ml-2">{s.moves}</div>
                <div className="ml-2">{Math.floor(s.time / 60)}:{String(s.time % 60).padStart(2, '0')}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="outline" className='text-gray-900'>Volver al juego</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
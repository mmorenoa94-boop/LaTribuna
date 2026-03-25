import { NextResponse } from 'next/server'

// GET: Download CSV template
export async function GET() {
  const csvContent = [
    'equipo_local,equipo_visitante,fecha,hora,competencia,estadio',
    'Deportivo Cali,América de Cali,2026-04-15,19:30,Liga BetPlay 2026-I,Estadio Deportivo Cali',
    'Junior FC,Millonarios,2026-04-16,20:00,Liga BetPlay 2026-I,Estadio Metropolitano',
    'Nacional,Medellín,2026-04-17,18:00,Liga BetPlay 2026-I,Estadio Atanasio Girardot',
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla_partidos.csv"',
    },
  })
}

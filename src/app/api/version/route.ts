export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({ v: process.env.NEXT_PUBLIC_BUILD_ID ?? '0' })
}

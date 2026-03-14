import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(_req: Request, { params }: { params: { size: string } }) {
  const size = parseInt(params.size, 10) || 192
  const r = size * 0.25

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#38BDF8',
          borderRadius: r,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Pin SVG inlined as JSX-compatible element */}
        <div
          style={{
            width: size * 0.45,
            height: size * 0.62,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 36"
            width={size * 0.45}
            height={size * 0.62}
          >
            <path
              d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24S24 20.25 24 12C24 5.373 18.627 0 12 0z"
              fill="white"
            />
            <circle cx="12" cy="12" r="5" fill="#38BDF8" />
          </svg>
        </div>
      </div>
    ),
    { width: size, height: size },
  )
}

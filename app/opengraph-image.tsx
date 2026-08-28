import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ background: '#0a0a0a', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <div style={{ width: 80, height: 80, background: '#ffffff', borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 700, color: '#0a0a0a' }}>S</div>
        <div style={{ fontSize: 72, fontWeight: 700, color: '#ffffff' }}>SimplyApply</div>
        <div style={{ fontSize: 28, color: '#888888' }}>Local jobs for students — matched to your schedule</div>
        <div style={{ fontSize: 20, color: '#444444', marginTop: 12 }}>simplyapply.app</div>
      </div>
    ),
    { ...size }
  )
}
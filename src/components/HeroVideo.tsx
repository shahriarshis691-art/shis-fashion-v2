type Props = {
  src?: string
  poster?: string
  children?: React.ReactNode
}

export default function HeroVideo({ src, poster, children }: Props) {
  return (
    <div className="hero-video-wrapper">
      {src ? (
        <video
          className="hero-video"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
        />
      ) : poster ? (
        // fallback poster image if no video provided
        <img className="hero-video-poster" src={poster} alt="" />
      ) : null}

      <div className="hero-video-overlay">{children}</div>
    </div>
  )
}

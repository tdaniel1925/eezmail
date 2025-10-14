'use client';

export function BackgroundEffects(): JSX.Element {
  return (
    <>
      {/* Center blue glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center -z-10">
        <div className="w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] rounded-full bg-[rgba(60,130,255,0.15)] blur-[120px] sm:blur-[180px]" />
      </div>

      {/* Diagonal grid lines */}
      <div
        className="pointer-events-none fixed inset-0 opacity-25 -z-10"
        style={{
          '--line': 'rgba(255,255,255,0.06)',
          '--vline': 'rgba(255,255,255,0.08)',
          '--gap': '260px',
          '--thick': '1px',
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              var(--line) 0 var(--thick),
              transparent var(--thick) var(--gap)
            ),
            repeating-linear-gradient(
              135deg,
              var(--line) 0 var(--thick),
              transparent var(--thick) var(--gap)
            ),
            linear-gradient(
              to right,
              transparent calc(50% - var(--thick)/2),
              var(--vline) calc(50% - var(--thick)/2) calc(50% + var(--thick)/2),
              transparent calc(50% + var(--thick)/2)
            )
          `,
          backgroundSize: '100% 100%, 100% 100%, var(--gap) 100%',
          backgroundPosition: 'center, center, center',
          backgroundRepeat: 'no-repeat, no-repeat, repeat',
        } as React.CSSProperties}
      />

      {/* Soft vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_40%_at_50%_35%,transparent_0%,transparent_55%,rgba(0,0,0,0.7)_100%)] -z-10" />
    </>
  );
}


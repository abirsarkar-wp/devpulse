interface PulseStripProps {
  openCount: number;
}

export function PulseStrip({ openCount }: PulseStripProps) {
  const active = openCount > 0;

  const speed = active
    ? Math.max(1.2, 3 - openCount * 0.3)
    : 6;

  const color = active ? '#D14C3F' : '#3F8F6F';

  const beatPath = active
    ? '0,16 40,16 50,4 60,28 70,16 120,16 160,16 170,6 180,26 190,16 240,16 280,16 290,4 300,28 310,16 400,16'
    : '0,16 400,16';

  return (
    <div className="relative h-10 overflow-hidden border-b border-white/10 bg-ink">
      <div
        className="absolute inset-y-0 flex"
        style={{
          width: '200%',
          animation: `pulse-scroll ${speed}s linear infinite`,
        }}
      >
        {[0, 1].map((i) => (
          <svg
            key={i}
            width="50%"
            height="40"
            viewBox="0 0 400 32"
            preserveAspectRatio="none"
            className="shrink-0"
          >
            <polyline
              points={beatPath}
              fill="none"
              stroke={color}
              strokeWidth="2.25"
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          </svg>
        ))}
      </div>

      <div className="scan-line absolute top-0 h-px w-24 bg-white/50" />
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none sm:px-6">
        <span className="font-mono text-[10px] tracking-[.2em] text-white/45 uppercase">
          System pulse
        </span>

        <span
          className="font-mono text-[10px] tracking-widest font-medium"
          style={{ color }}
        >
          {active ? `${openCount} OPEN` : 'ALL CLEAR'}
        </span>
      </div>
    </div>
  );
}

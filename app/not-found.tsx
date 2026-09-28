import Link from "next/link";


export default function NotFound() {
  return (
    <main className="not-found-page">
      <svg className="mascot-flame not-found-flame" viewBox="0 0 64 72" style={{ width: "88px", height: "99px", display: "block" }} aria-hidden="true">
        <defs>
          <linearGradient id="sadEmberShell" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#c33b0a" />
            <stop offset="0.5" stopColor="#ff7518" />
            <stop offset="1" stopColor="#ca3909" />
          </linearGradient>
          <linearGradient id="sadEmberCore" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#ffad26" />
            <stop offset="0.5" stopColor="#fff07a" />
            <stop offset="1" stopColor="#ffc23a" />
          </linearGradient>
          <filter id="sadEmberGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M27 3h8v7h5v7h6v8h5v9h5v13h-5v7h-5v5h-7v4H18v-4h-7v-5H6v-8H3V34h5v-9h5v-8h6v-7h8z" fill="url(#sadEmberShell)" filter="url(#sadEmberGlow)" />
        <path d="M28 10h7v7h5v7h6v9h5v12h-5v7h-7v5H19v-5h-6v-7H9V34h5v-9h5v-8h9z" fill="#f05b0b" />
        <path d="M29 17h6v7h5v7h5v8h4v9h-5v5H20v-5h-5v-7h4v-8h5v-8h5z" fill="url(#sadEmberCore)" />
        <path d="M29 26h6v8h5v9h-5v7H27v-7h-5v-7h5v-6h2z" fill="#fff4a6" opacity="0.86" />
        <path d="M16 39l12-3M36 36l12 3" stroke="#54210d" strokeWidth="3" strokeLinecap="square" />
        <rect x="19" y="40" width="8" height="7" fill="#54210d" />
        <rect x="37" y="40" width="8" height="7" fill="#54210d" />
        <path d="M46 46h4v4h3v6h-3v3h-4v-3h-2v-6h2z" fill="#8ee8ff" />
        <path d="M47 48h2v4h-2z" fill="#e4fbff" />
        <path d="M26 51q6 8 12 0" fill="none" stroke="#54210d" strokeWidth="2.5" strokeLinecap="square" />
        <path d="M8 55h15v5h-4v5H8z" fill="#713417" />
        <path d="M22 57h20v6H22z" fill="#a64c16" />
        <path d="M42 55h14v10H45v-5h-3z" fill="#713417" />
        <path d="M7 64h50v5H7z" fill="#4c2414" />
        <path d="M11 57h6v3h-6zm34 0h6v3h-6z" fill="#d57925" />
        <path d="M27 59h4v2h-4zm7 1h5v2h-5z" fill="#e98b2e" />
        <path d="M1 29h3v3H1zm55-8h3v3h-3zm-4-12h3v3h-3z" fill="#ffd45c" />
      </svg>
      <p className="legal-kicker">404 / PATH_NOT_FOUND</p>
      <h1>This trail went cold.</h1>
      <p>That page isn’t here. Let’s head back to the campfire.</p>
      <Link href="/" className="landing-cta">Back to Vioscribe <span aria-hidden="true">-&gt;</span></Link>
    </main>
  );
}

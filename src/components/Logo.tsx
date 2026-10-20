export default function Logo({size=28}:{size?:number}){
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#4f46e5"/>
    <rect x="6" y="7" width="12" height="9" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.6"/><path d="M6 10.5h12" stroke="#fff" strokeWidth="1.6"/>
    <path d="M14 16v3.5c0 1.4 1.1 2.5 2.5 2.5H18" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round"/><circle cx="22.5" cy="22" r="4.5" fill="#fff"/></svg>;
}

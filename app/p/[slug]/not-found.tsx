import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center text-white">
      <h1 className="text-6xl font-display font-bold text-[#C6FF00] mb-4">404</h1>
      <p className="text-xl text-gray-400 mb-8">Page introuvable</p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#C6FF00] text-[#0D0D0D] font-semibold rounded-xl hover:bg-[#C6FF00]/90 transition-colors"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

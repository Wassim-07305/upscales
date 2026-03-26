export default function Loading() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#0D0D0D]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-10 border-2 border-[#C6FF00] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Chargement de l&apos;éditeur...</p>
      </div>
    </div>
  );
}

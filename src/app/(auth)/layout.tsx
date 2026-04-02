import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0C0A09]">
      {/* Left panel — branding showcase */}
      <div
        className="relative hidden lg:flex lg:w-[45%] xl:w-[50%] flex-col items-center justify-center p-12 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #c6ff0015 0%, #c6ff0008 50%, transparent 100%)",
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          className="absolute -top-1/3 -left-1/4 w-[60%] h-[60%] rounded-full blur-[120px] opacity-20"
          style={{ background: "#c6ff00" }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full blur-[100px] opacity-15"
          style={{ background: "#c6ff00" }}
        />

        <div className="relative z-10 text-center max-w-md">
          <Image
            src="/logo.png"
            alt="UPSCALE"
            width={96}
            height={96}
            className="mx-auto mb-8 rounded-2xl"
            style={{ filter: "drop-shadow(0 0 30px rgba(196, 30, 58, 0.3))" }}
          />

          <h1 className="text-4xl xl:text-5xl text-white font-display font-bold tracking-tight mb-3">
            UPSCALE
          </h1>

          {/* Decorative dots */}
          <div className="flex items-center justify-center gap-1.5 mt-10">
            {[0.6, 1, 0.6].map((opacity, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#c6ff00", opacity }}
              />
            ))}
          </div>
        </div>

        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Mobile branded header */}
      <div
        className="lg:hidden p-6 pb-2 text-center"
        style={{
          background: "linear-gradient(180deg, #c6ff0010 0%, transparent 100%)",
        }}
      >
        <Image
          src="/logo.png"
          alt="UPSCALE"
          width={56}
          height={56}
          className="mx-auto mb-3 rounded-xl"
          style={{ filter: "drop-shadow(0 0 16px rgba(196, 30, 58, 0.3))" }}
        />
        <h1 className="text-2xl text-white font-display font-bold tracking-tight">
          UPSCALE
        </h1>
      </div>

      {/* Right panel — form content */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-1/2 -right-1/3 w-[70%] h-[70%] rounded-full blur-[120px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, #c6ff00 0%, transparent 70%)",
              animation: "float 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -bottom-1/3 -left-1/4 w-[50%] h-[50%] rounded-full blur-[100px] opacity-15"
            style={{
              background:
                "radial-gradient(circle, #c6ff00 0%, transparent 70%)",
              animation: "float 10s ease-in-out infinite reverse",
            }}
          />
        </div>

        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative w-full max-w-[420px] z-10">{children}</div>
      </div>
    </div>
  );
}

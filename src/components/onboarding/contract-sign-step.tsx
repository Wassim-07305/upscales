"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FileSignature,
  CheckCircle2,
  ArrowRight,
  Download,
  Loader2,
  X,
  MapPin,
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useContract } from "@/hooks/use-contracts";
import { SignaturePad } from "@/components/contracts/signature-pad";

// ─── Schema de validation ─────────────────────────────────
const signatureSchema = z.object({
  signer_name: z.string().min(2, "Nom requis"),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(3, "Ville requise"),
  lu_et_approuve: z.literal(true, {
    message: "Vous devez accepter",
  }),
});

type SignatureFormData = z.infer<typeof signatureSchema>;

type Phase = "loading" | "reading" | "signing" | "signed";

// ─── Sous-composant : Viewer PDF du contrat ──────────────
function ContractPdfViewer() {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
      style={{ height: "calc(100vh - 200px)" }}
    >
      <iframe
        src="/contrat-upscale.pdf"
        className="w-full h-full border-0"
        title="Contrat d'accompagnement"
      />
    </div>
  );
}

// ─── Sous-composant : Formulaire de signature ─────────────
function SigningForm({
  defaultName,
  onSubmit,
  isPending,
}: {
  defaultName: string;
  onSubmit: (data: SignatureFormData, signatureImage: string) => void;
  isPending: boolean;
}) {
  const [signatureImage, setSignatureImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<SignatureFormData>({
    resolver: zodResolver(signatureSchema),
    defaultValues: {
      signer_name: defaultName,
      address: "",
      city: "",
      lu_et_approuve: undefined as unknown as true,
    },
    mode: "onChange",
  });

  const luEtApprouve = watch("lu_et_approuve");

  const handleFormSubmit = (data: SignatureFormData) => {
    if (!signatureImage) return;
    onSubmit(data, signatureImage);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Nom complet */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <User className="w-4 h-4 text-primary" />
          Nom complet
        </label>
        <input
          {...register("signer_name")}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-primary"
          placeholder="Votre nom complet"
        />
        {errors.signer_name && (
          <p className="mt-1.5 text-xs text-lime-300">
            {errors.signer_name.message}
          </p>
        )}
      </div>

      {/* Adresse */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <MapPin className="w-4 h-4 text-primary" />
          Adresse
        </label>
        <input
          {...register("address")}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-primary"
          placeholder="Votre adresse postale"
        />
        {errors.address && (
          <p className="mt-1.5 text-xs text-lime-300">
            {errors.address.message}
          </p>
        )}
      </div>

      {/* Ville */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-white/70 mb-2">
          <Building2 className="w-4 h-4 text-primary" />
          Ville
        </label>
        <input
          {...register("city")}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-primary"
          placeholder="Votre ville"
        />
        {errors.city && (
          <p className="mt-1.5 text-xs text-lime-300">{errors.city.message}</p>
        )}
      </div>

      {/* Signature pad */}
      <div>
        <label className="text-sm font-medium text-white/70 mb-2 block">
          Votre signature
        </label>
        <SignaturePad
          onSign={(dataUrl) => setSignatureImage(dataUrl)}
          onCancel={() => setSignatureImage(null)}
          disabled={isPending}
        />
        {signatureImage && (
          <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Signature enregistree
          </p>
        )}
      </div>

      {/* Lu et approuve */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={luEtApprouve === true}
          onChange={(e) =>
            setValue("lu_et_approuve", e.target.checked as unknown as true, {
              shouldValidate: true,
            })
          }
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-primary accent-primary"
        />
        <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
          J&apos;ai lu et j&apos;approuve les termes du contrat ci-dessus
        </span>
      </label>
      {errors.lu_et_approuve && (
        <p className="text-xs text-lime-300">{errors.lu_et_approuve.message}</p>
      )}

      {/* Bouton signer */}
      <button
        type="submit"
        disabled={!isValid || !signatureImage || isPending}
        className={cn(
          "w-full flex items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-base font-semibold text-white transition-all duration-200",
          isValid && signatureImage && !isPending
            ? "bg-gradient-to-r from-primary to-lime-400 shadow-lg shadow-lime-400/25 hover:scale-[1.02] hover:shadow-xl"
            : "bg-white/10 cursor-not-allowed opacity-50",
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Signature en cours...
          </>
        ) : (
          <>
            <FileSignature className="h-5 w-5" />
            Signer le contrat
          </>
        )}
      </button>
    </form>
  );
}

// ─── Composant principal ──────────────────────────────────
interface ContractSignStepProps {
  onComplete: () => void;
}

export function ContractSignStep({ onComplete }: ContractSignStepProps) {
  const { profile } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [contractId, setContractId] = useState<string | null>(null);
  const [signedFormData, setSignedFormData] =
    useState<SignatureFormData | null>(null);
  const [signedImage, setSignedImage] = useState<string | null>(null);
  const [filledPdfUrl, setFilledPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Charger le contrat au mount
  const contractQuery = useContract(contractId ?? "");

  const generateContract = useCallback(async () => {
    if (contractId) return; // Eviter les appels doubles
    try {
      const res = await fetch("/api/contracts/auto-generate", {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok || !json.contract_id) {
        setError(json.error ?? "Impossible de generer le contrat");
        return;
      }
      setContractId(json.contract_id);
    } catch {
      setError("Erreur de connexion au serveur");
    }
  }, []);

  useEffect(() => {
    generateContract();
  }, [generateContract]);

  // Transition loading -> reading quand le contrat est charge
  useEffect(() => {
    if (contractQuery.data && phase === "loading") {
      setPhase("reading");
    }
  }, [contractQuery.data, phase]);

  // Confettis quand on passe en phase signed
  useEffect(() => {
    if (phase !== "signed") return;
    let cancelled = false;
    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
      const confetti = mod.default;
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#c6ff00", "#F59E0B", "#10B981", "#FFFFFF"],
      });
    });
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const [signing, setSigning] = useState(false);

  const handleSign = async (
    data: SignatureFormData,
    signatureImage: string,
  ) => {
    if (!contractId || signing) return;
    setSigning(true);

    try {
      // Generer le PDF rempli, sauvegarder dans Storage, et marquer comme signe
      const res = await fetch("/api/contracts/fill-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer_name: data.signer_name,
          address: data.address,
          city: data.city,
          signature_image: signatureImage,
          contract_id: contractId,
          save: true,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        setFilledPdfUrl(URL.createObjectURL(blob));
      }

      setSignedFormData(data);
      setSignedImage(signatureImage);
      setPhase("signed");
    } catch {
      setSigning(false);
    }
  };

  const contract = contractQuery.data;

  // ─── Phase : loading ──────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        {error ? (
          <>
            <p className="text-lime-300 text-sm text-center">{error}</p>
            <button
              onClick={() => {
                setError(null);
                generateContract();
              }}
              className="text-sm text-primary underline hover:text-primary/80"
            >
              Reessayer
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            <p className="text-sm text-white/40">
              Preparation de votre contrat...
            </p>
          </>
        )}
      </div>
    );
  }

  if (!contract) return null;

  // ─── Phase : reading / signing ──────────────────────────
  if (phase === "reading" || phase === "signing") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex-1 flex flex-col"
      >
        <div className="text-center mb-2">
          <h2 className="text-lg font-bold text-white">{contract.title}</h2>
        </div>

        <ContractPdfViewer />

        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setPhase("signing")}
            className="flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary to-lime-400 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-lime-400/25 transition-all duration-200 hover:scale-[1.02]"
          >
            <FileSignature className="h-5 w-5" />
            Signer ce contrat
          </button>
        </div>

        {/* Modale de signature */}
        {phase === "signing" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">
                  Signer le contrat
                </h3>
                <button
                  onClick={() => setPhase("reading")}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              <SigningForm
                defaultName={profile?.full_name ?? ""}
                onSubmit={handleSign}
                isPending={signing}
              />
            </motion.div>
          </div>
        )}
      </motion.div>
    );
  }

  // ─── Phase : signed ───────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex-1 flex flex-col"
    >
      {/* Header compact */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-white">Contrat signe !</h2>
      </div>

      {/* PDF du contrat rempli */}
      <div
        className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
        style={{ height: "calc(100vh - 200px)" }}
      >
        <iframe
          src={filledPdfUrl ?? "/contrat-upscale.pdf"}
          className="w-full h-full border-0"
          title="Contrat signe"
        />
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {filledPdfUrl && (
            <a
              href={filledPdfUrl}
              download="contrat-signe-upscale.pdf"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all"
            >
              <Download className="w-4 h-4" />
              Telecharger le contrat
            </a>
          )}
        </div>
        <button
          onClick={onComplete}
          className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-lime-400 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-lime-400/25 transition-all duration-200 hover:scale-[1.02]"
        >
          Continuer
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}

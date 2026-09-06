"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";

// Admin addresses
const ADMIN_ADDRESSES = [
  "0x36d7885524c591eda18Cf678b49a09772E89dB5c",
].map((address) => address.toLowerCase());

type Tab = "deploy" | "submit" | "admin";

interface Submission {
  id: string;
  contractAddress: string;
  collectionName: string;
  creatorName: string;
  websiteUrl?: string;
  description?: string;
  xProfile?: string;
  discord?: string;
  pinAddress?: string;
  status: string;
  createdAt?: string;
}

interface DeployedCollection {
  id?: string;
  contractAddress: string;
  collectionName?: string;
  creatorName?: string;
  pinAddress?: string;
  approved?: boolean;
}

function normalizePin(value: string): string {
  let decoded = value.trim();

  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // Keep original value if decoding fails.
  }

  return decoded
    .replace(/^\/{3}/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function isValidPin(value: string): boolean {
  const normalized = normalizePin(value);
  const words = normalized.split(".");

  return (
    words.length === 3 &&
    words.every(
      (word) => word.length > 0 && /^[a-z0-9-]+$/.test(word)
    )
  );
}

function formatPin(value?: string): string {
  if (!value) return "";
  return `///${normalizePin(value)}`;
}

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const isAdmin =
    !!address && ADMIN_ADDRESSES.includes(address.toLowerCase());

  const [activeTab, setActiveTab] = useState<Tab>("deploy");

  // Shared 3 Word Pin
  const [pinAddress, setPinAddress] = useState("");
  const [pinError, setPinError] = useState("");

  // Submission form
  const [contractAddress, setContractAddress] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  const [xProfile, setXProfile] = useState("");
  const [discord, setDiscord] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // Admin
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [deployedCollections, setDeployedCollections] = useState<
    DeployedCollection[]
  >([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [approvingAddress, setApprovingAddress] = useState<string | null>(
    null
  );
  const [adminView, setAdminView] = useState<"submissions" | "collections">(
    "submissions"
  );

  useEffect(() => {
    if (isAdmin && activeTab === "admin") {
      loadAdminData();
    }
  }, [isAdmin, activeTab]);

  function handlePinChange(value: string) {
    setPinAddress(value);
    setPinError("");

    if (!value.trim()) return;

    if (!isValidPin(value)) {
      setPinError(
        "Enter exactly 3 words separated by periods. Example: ///house.blue.atlanta"
      );
    }
  }

  function validatePin(): string | null {
    const normalized = normalizePin(pinAddress);

    if (!normalized) {
      setPinError(
        "A 3 Word Pin address is required. Example: ///house.blue.atlanta"
      );
      return null;
    }

    if (!isValidPin(normalized)) {
      setPinError(
        "Use exactly 3 words separated by periods. Example: ///house.blue.atlanta"
      );
      return null;
    }

    setPinError("");
    return normalized;
  }

  function launchBuilder() {
    const normalized = validatePin();

    if (!normalized) return;

    router.push(
      `/create/builder?pin=${encodeURIComponent(normalized)}`
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");

    const normalizedPin = validatePin();

    if (!normalizedPin) {
      return;
    }

    if (!contractAddress.trim()) {
      setMessage("Contract address is required.");
      return;
    }

    if (!collectionName.trim()) {
      setMessage("Collection name is required.");
      return;
    }

    if (!creatorName.trim()) {
      setMessage("Creator name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/submissions/submit-collection",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractAddress: contractAddress.trim(),
            collectionName: collectionName.trim(),
            creatorName: creatorName.trim(),
            websiteUrl: websiteUrl.trim(),
            description: description.trim(),
            xProfile: xProfile.trim(),
            discord: discord.trim(),
            pinAddress: normalizedPin,
            walletAddress: address,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to submit collection."
        );
      }

      setMessage(
        "Collection submitted successfully for verification."
      );

      setContractAddress("");
      setCollectionName("");
      setCreatorName("");
      setWebsiteUrl("");
      setDescription("");
      setXProfile("");
      setDiscord("");
      setPinAddress("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function loadAdminData() {
    await Promise.all([
      loadSubmissions(),
      loadDeployedCollections(),
    ]);
  }

  async function loadSubmissions() {
    setLoadingSubmissions(true);

    try {
      const response = await fetch(
        "/api/submissions/get-submissions?status=pending"
      );

      const data = await response.json();

      if (response.ok) {
        setSubmissions(data.submissions || data || []);
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  async function loadDeployedCollections() {
    setLoadingCollections(true);

    try {
      const response = await fetch(
        "/api/submissions/get-unapproved-collections"
      );

      const data = await response.json();

      if (response.ok) {
        setDeployedCollections(
          data.collections || data || []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load deployed collections:",
        error
      );
    } finally {
      setLoadingCollections(false);
    }
  }

  async function reviewSubmission(
    id: string,
    decision: "approve" | "deny"
  ) {
    setReviewingId(id);

    try {
      const response = await fetch(
        "/api/submissions/review-submission",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            submissionId: id,
            decision,
            adminAddress: address,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to review submission."
        );
      }

      await loadSubmissions();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to review submission."
      );
    } finally {
      setReviewingId(null);
    }
  }

  async function approveCollection(
    collectionAddress: string
  ) {
    setApprovingAddress(collectionAddress);

    try {
      const response = await fetch(
        "/api/submissions/approve-collection",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractAddress: collectionAddress,
            adminAddress: address,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to approve collection."
        );
      }

      await loadDeployedCollections();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to approve collection."
      );
    } finally {
      setApprovingAddress(null);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white placeholder:text-white/30 outline-none transition focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-400/10";

  const cardClass =
    "rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl shadow-[0_0_60px_rgba(0,242,234,0.04)]";

  const gradientText =
    "bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent";

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      {/* Landing-page style ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />
        <div className="absolute bottom-[-300px] right-[-200px] h-[650px] w-[650px] rounded-full bg-pink-500/10 blur-[160px]" />
        <div className="absolute left-[-250px] top-[45%] h-[500px] w-[500px] rounded-full bg-cyan-400/5 blur-[140px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8">
          {/* Hero */}
          <section className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
              3WORDPIN CREATOR HUB
            </div>

            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
              Create.
              <br />
              <span className={gradientText}>
                Deploy. Pin.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
              Create your collection, deploy on Gen-Plasma, and
              connect it to a human-readable 3 Word Pin address.
            </p>
          </section>

          {/* Navigation tabs */}
          <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-2 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setActiveTab("deploy")}
              className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                activeTab === "deploy"
                  ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 shadow-[0_0_25px_rgba(0,242,234,0.08)]"
                  : "text-white/45 hover:bg-white/5 hover:text-white"
              }`}
            >
              Create & Deploy
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("submit")}
              className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                activeTab === "submit"
                  ? "border border-pink-400/20 bg-pink-400/10 text-pink-300 shadow-[0_0_25px_rgba(255,0,80,0.08)]"
                  : "text-white/45 hover:bg-white/5 hover:text-white"
              }`}
            >
              Submit Collection
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("admin")}
                className={`rounded-xl px-5 py-3 text-sm font-bold transition ${
                  activeTab === "admin"
                    ? "border border-white/20 bg-white/10 text-white"
                    : "text-white/45 hover:bg-white/5 hover:text-white"
                }`}
              >
                Admin
              </button>
            )}
          </div>

          {/* CREATE / DEPLOY */}
          {activeTab === "deploy" && (
            <section className="mx-auto mt-10 max-w-5xl">
              <div className={`${cardClass} overflow-hidden`}>
                <div className="border-b border-white/10 p-7 sm:p-10">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="mb-3 text-sm font-bold tracking-[0.15em] text-cyan-300 uppercase">
                        Builder
                      </div>

                      <h2 className="text-3xl font-black sm:text-4xl">
                        Create & Deploy
                      </h2>

                      <p className="mt-3 max-w-2xl text-white/50">
                        Build an NFT collection with low-cost
                        deployment on Gen-Plasma.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-200">
                      ERC-721
                    </div>
                  </div>
                </div>

                <div className="space-y-8 p-7 sm:p-10">
                  {/* 3 WORD PIN */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-white">
                      3 Word Pin Address
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-cyan-300">
                        ///
                      </span>

                      <input
                        value={normalizePin(pinAddress)}
                        onChange={(e) =>
                          handlePinChange(e.target.value)
                        }
                        placeholder="house.blue.atlanta"
                        className={`${inputClass} pl-12`}
                      />
                    </div>

                    {pinError && (
                      <p className="mt-2 text-sm text-pink-400">
                        {pinError}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-white/35">
                      Example: ///house.blue.atlanta — this becomes
                      the human-readable address for your collection.
                    </p>
                  </div>

                  {/* Feature grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        title: "Low Gas",
                        text: "Deploy with dramatically lower transaction costs.",
                        icon: "⚡",
                      },
                      {
                        title: "ERC-721",
                        text: "Launch standard NFT collections with flexible metadata.",
                        icon: "◇",
                      },
                      {
                        title: "Royalties",
                        text: "Configure creator royalties for secondary sales.",
                        icon: "↗",
                      },
                      {
                        title: "3WORDPIN",
                        text: "Give your collection a memorable 3-word location.",
                        icon: "⌖",
                      },
                    ].map((feature) => (
                      <div
                        key={feature.title}
                        className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                      >
                        <div className="mb-4 text-2xl">
                          {feature.icon}
                        </div>

                        <h3 className="font-bold">
                          {feature.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-white/40">
                          {feature.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
                    <div className="mb-5 flex items-center justify-between">
                      <h3 className="font-bold">
                        Launch Options
                      </h3>

                      <span className="text-xs text-white/35">
                        XPL
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          price: "18",
                          title: "Starter",
                          text: "Simple collection launch",
                        },
                        {
                          price: "22",
                          title: "Creator",
                          text: "Advanced metadata tools",
                        },
                        {
                          price: "35",
                          title: "Pro",
                          text: "Full creator experience",
                        },
                      ].map((plan) => (
                        <div
                          key={plan.title}
                          className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                        >
                          <div className="text-2xl font-black">
                            {plan.price}{" "}
                            <span className="text-sm text-cyan-300">
                              XPL
                            </span>
                          </div>

                          <div className="mt-2 font-bold">
                            {plan.title}
                          </div>

                          <div className="mt-1 text-xs text-white/35">
                            {plan.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Holder discount */}
                  <div className="rounded-2xl border border-pink-400/15 bg-pink-400/[0.04] p-5">
                    <div className="font-bold text-pink-300">
                      Holder Discount
                    </div>

                    <p className="mt-1 text-sm text-white/45">
                      Eligible 3WORDPIN holders may receive
                      discounted creator tools and launch fees.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={launchBuilder}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-pink-500 px-6 py-4 font-black text-black shadow-[0_0_40px_rgba(0,242,234,0.12)] transition hover:scale-[1.01] hover:shadow-[0_0_55px_rgba(255,0,80,0.15)]"
                  >
                    Continue to Collection Builder →
                  </button>
                </div>
              </div>

              {/* Developer resources */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <a
                  href="https://docs.plasma.to"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardClass} group p-6 transition hover:border-cyan-400/20`}
                >
                  <div className="text-xs font-bold tracking-widest text-cyan-300 uppercase">
                    Documentation
                  </div>

                  <div className="mt-2 text-xl font-black">
                    Plasma Docs ↗
                  </div>

                  <p className="mt-2 text-sm text-white/40">
                    Explore the Gen-Plasma developer documentation.
                  </p>
                </a>

                <a
                  href="https://github.com/plasma-network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardClass} group p-6 transition hover:border-pink-400/20`}
                >
                  <div className="text-xs font-bold tracking-widest text-pink-300 uppercase">
                    Open Source
                  </div>

                  <div className="mt-2 text-xl font-black">
                    Plasma GitHub ↗
                  </div>

                  <p className="mt-2 text-sm text-white/40">
                    Explore Plasma Network developer resources.
                  </p>
                </a>
              </div>
            </section>
          )}

          {/* SUBMIT */}
          {activeTab === "submit" && (
            <section className="mx-auto mt-10 max-w-5xl">
              <div className={`${cardClass} p-7 sm:p-10`}>
                <div className="mb-10">
                  <div className="mb-3 text-sm font-bold tracking-[0.15em] text-pink-300 uppercase">
                    Verification
                  </div>

                  <h2 className="text-3xl font-black sm:text-4xl">
                    Submit Your Collection
                  </h2>

                  <p className="mt-3 max-w-2xl text-white/50">
                    Already deployed a collection? Submit it for
                    verification and connect it to a 3 Word Pin.
                  </p>
                </div>

                {/* Requirements */}
                <div className="mb-8 grid gap-3 sm:grid-cols-3">
                  {[
                    "Valid contract",
                    "Creator information",
                    "3 Word Pin address",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
                    >
                      <div className="text-sm font-bold">
                        <span className="mr-2 text-cyan-300">
                          0{index + 1}
                        </span>
                        {item}
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Pin */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      3 Word Pin Address *
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-cyan-300">
                        ///
                      </span>

                      <input
                        value={normalizePin(pinAddress)}
                        onChange={(e) =>
                          handlePinChange(e.target.value)
                        }
                        placeholder="house.blue.atlanta"
                        className={`${inputClass} pl-12`}
                        required
                      />
                    </div>

                    {pinError && (
                      <p className="mt-2 text-sm text-pink-400">
                        {pinError}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-white/35">
                      This address can be shared as
                      ///word.word.word and opened through 3WORDPIN.
                    </p>
                  </div>

                  {/* Contract */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Contract Address *
                    </label>

                    <input
                      value={contractAddress}
                      onChange={(e) =>
                        setContractAddress(e.target.value)
                      }
                      placeholder="0x..."
                      className={inputClass}
                      required
                    />
                  </div>

                  {/* Collection / creator */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Collection Name *
                      </label>

                      <input
                        value={collectionName}
                        onChange={(e) =>
                          setCollectionName(e.target.value)
                        }
                        placeholder="My NFT Collection"
                        className={inputClass}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Creator Name *
                      </label>

                      <input
                        value={creatorName}
                        onChange={(e) =>
                          setCreatorName(e.target.value)
                        }
                        placeholder="Creator / Studio"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  {/* Website / X / Discord */}
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Website
                      </label>

                      <input
                        value={websiteUrl}
                        onChange={(e) =>
                          setWebsiteUrl(e.target.value)
                        }
                        placeholder="https://..."
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        X / Twitter
                      </label>

                      <input
                        value={xProfile}
                        onChange={(e) =>
                          setXProfile(e.target.value)
                        }
                        placeholder="@username"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Discord
                      </label>

                      <input
                        value={discord}
                        onChange={(e) =>
                          setDiscord(e.target.value)
                        }
                        placeholder="discord.gg/..."
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      placeholder="Tell us about your collection..."
                      rows={5}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {message && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-200">
                      {message}
                    </div>
                  )}

                  {!isConnected && (
                    <div className="rounded-2xl border border-pink-400/20 bg-pink-400/5 p-4 text-sm text-pink-200">
                      Connect your wallet before submitting a
                      collection.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !isConnected}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-pink-500 px-6 py-4 font-black text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit Collection →"}
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* ADMIN */}
          {activeTab === "admin" && isAdmin && (
            <section className="mx-auto mt-10 max-w-6xl">
              <div className={`${cardClass} overflow-hidden`}>
                <div className="border-b border-white/10 p-7 sm:p-10">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="mb-3 text-xs font-bold tracking-[0.2em] text-white/40 uppercase">
                        Restricted Area
                      </div>

                      <h2 className="text-3xl font-black">
                        Admin Dashboard
                      </h2>

                      <p className="mt-2 text-white/40">
                        Manage collection verification and approvals.
                      </p>
                    </div>

                    <div className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-bold text-cyan-300">
                      ADMIN VERIFIED
                    </div>
                  </div>
                </div>

                {/* Admin tabs */}
                <div className="flex border-b border-white/10">
                  <button
                    type="button"
                    onClick={() =>
                      setAdminView("submissions")
                    }
                    className={`flex-1 px-5 py-4 text-sm font-bold transition ${
                      adminView === "submissions"
                        ? "border-b-2 border-cyan-400 text-cyan-300"
                        : "text-white/35 hover:text-white"
                    }`}
                  >
                    Pending Submissions
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAdminView("collections")
                    }
                    className={`flex-1 px-5 py-4 text-sm font-bold transition ${
                      adminView === "collections"
                        ? "border-b-2 border-pink-400 text-pink-300"
                        : "text-white/35 hover:text-white"
                    }`}
                  >
                    Deployed Collections
                  </button>
                </div>

                {/* Pending submissions */}
                {adminView === "submissions" && (
                  <div className="p-7 sm:p-10">
                    {loadingSubmissions ? (
                      <div className="py-16 text-center text-white/40">
                        Loading submissions...
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/40">
                        No pending submissions.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((submission) => (
                          <div
                            key={submission.id}
                            className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"
                          >
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <h3 className="text-xl font-black">
                                  {submission.collectionName}
                                </h3>

                                <p className="mt-1 text-sm text-white/45">
                                  by {submission.creatorName}
                                </p>

                                {submission.pinAddress && (
                                  <div className="mt-4 inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-sm font-bold text-cyan-300">
                                    ///{normalizePin(
                                      submission.pinAddress
                                    )}
                                  </div>
                                )}

                                <div className="mt-4 break-all rounded-xl bg-black/30 p-3 font-mono text-xs text-white/40">
                                  {submission.contractAddress}
                                </div>

                                {submission.description && (
                                  <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
                                    {submission.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex shrink-0 gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    reviewingId ===
                                    submission.id
                                  }
                                  onClick={() =>
                                    reviewSubmission(
                                      submission.id,
                                      "approve"
                                    )
                                  }
                                  className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-black disabled:opacity-40"
                                >
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    reviewingId ===
                                    submission.id
                                  }
                                  onClick={() =>
                                    reviewSubmission(
                                      submission.id,
                                      "deny"
                                    )
                                  }
                                  className="rounded-xl border border-pink-400/20 bg-pink-400/10 px-4 py-3 text-sm font-bold text-pink-300 disabled:opacity-40"
                                >
                                  Deny
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Deployed collections */}
                {adminView === "collections" && (
                  <div className="p-7 sm:p-10">
                    {loadingCollections ? (
                      <div className="py-16 text-center text-white/40">
                        Loading collections...
                      </div>
                    ) : deployedCollections.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/40">
                        No unapproved collections.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {deployedCollections.map(
                          (collection) => (
                            <div
                              key={
                                collection.id ||
                                collection.contractAddress
                              }
                              className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"
                            >
                              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                  <h3 className="text-xl font-black">
                                    {collection.collectionName ||
                                      "Unnamed Collection"}
                                  </h3>

                                  {collection.creatorName && (
                                    <p className="mt-1 text-sm text-white/40">
                                      by{" "}
                                      {
                                        collection.creatorName
                                      }
                                    </p>
                                  )}

                                  {collection.pinAddress && (
                                    <div className="mt-3 inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-sm font-bold text-cyan-300">
                                      ///{normalizePin(
                                        collection.pinAddress
                                      )}
                                    </div>
                                  )}

                                  <div className="mt-3 break-all font-mono text-xs text-white/35">
                                    {
                                      collection.contractAddress
                                    }
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <a
                                    href={`https://explorer.plasma.to/address/${collection.contractAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white"
                                  >
                                    Explorer ↗
                                  </a>

                                  <a
                                    href={`/mint/${collection.contractAddress}`}
                                    className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-300"
                                  >
                                    Mint Page
                                  </a>

                                  <button
                                    type="button"
                                    disabled={
                                      approvingAddress ===
                                      collection.contractAddress
                                    }
                                    onClick={() =>
                                      approveCollection(
                                        collection.contractAddress
                                      )
                                    }
                                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-pink-500 px-4 py-3 text-sm font-black text-black disabled:opacity-40"
                                  >
                                    {approvingAddress ===
                                    collection.contractAddress
                                      ? "Approving..."
                                      : "Approve"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Bottom CTA */}
          {activeTab !== "admin" && (
            <section className="mx-auto mt-14 max-w-4xl text-center">
              <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 backdrop-blur-xl sm:p-12">
                <div className="text-sm font-bold tracking-[0.2em] text-white/35 uppercase">
                  Keep It Simple
                </div>

                <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                  One collection.
                  <br />
                  <span className={gradientText}>
                    One memorable address.
                  </span>
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-white/40">
                  3WORDPIN turns complicated blockchain addresses
                  and locations into something people can actually
                  remember and share.
                </p>

                {pinAddress && isValidPin(pinAddress) && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/p/${encodeURIComponent(
                          normalizePin(pinAddress)
                        )}`
                      )
                    }
                    className="mt-7 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-6 py-3 font-bold text-cyan-300 transition hover:bg-cyan-400/10"
                  >
                    View ///{normalizePin(pinAddress)} →
                  </button>
                )}
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

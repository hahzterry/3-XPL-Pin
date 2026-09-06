"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";

const ADMIN_ADDRESSES = [
  "0x36d7885524c591eda18Cf678b49a09772E89dB5c",
].map((address) => address.toLowerCase());

type Tab = "create" | "submit" | "admin";

interface Submission {
  id: string;
  contractAddress?: string;
  collectionName?: string;
  creatorName?: string;
  websiteUrl?: string;
  description?: string;
  xProfile?: string;
  discord?: string;
  pinAddress?: string;
  status?: string;
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
      (word) =>
        word.length > 0 &&
        /^[a-z0-9-]+$/.test(word)
    )
  );
}

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const isAdmin =
    !!address &&
    ADMIN_ADDRESSES.includes(address.toLowerCase());

  const [activeTab, setActiveTab] =
    useState<Tab>("create");

  // --------------------------------------------------
  // 3 WORD PIN
  // --------------------------------------------------

  const [pinAddress, setPinAddress] = useState("");
  const [pinError, setPinError] = useState("");

  function handlePinChange(value: string) {
    setPinError("");

    const cleaned = value
      .replace(/^\/{3}/, "")
      .replace(/\s+/g, "");

    setPinAddress(cleaned);

    if (!cleaned) return;

    if (!isValidPin(cleaned)) {
      setPinError(
        "Use exactly 3 words separated by periods. Example: house.blue.atlanta"
      );
    }
  }

  function validatePin(): string | null {
    const normalized = normalizePin(pinAddress);

    if (!normalized) {
      setPinError(
        "Enter your 3 Word Pin. Example: house.blue.atlanta"
      );
      return null;
    }

    if (!isValidPin(normalized)) {
      setPinError(
        "Your 3 Word Pin must contain exactly 3 words separated by periods."
      );
      return null;
    }

    setPinError("");

    return normalized;
  }

  function viewPin() {
    const normalized = validatePin();

    if (!normalized) return;

    router.push(
      `/p/${encodeURIComponent(normalized)}`
    );
  }

  function continueToBuilder() {
    const normalized = validatePin();

    if (!normalized) return;

    router.push(
      `/create/builder?pin=${encodeURIComponent(normalized)}`
    );
  }

  // --------------------------------------------------
  // SUBMISSION
  // --------------------------------------------------

  const [contractAddress, setContractAddress] =
    useState("");

  const [collectionName, setCollectionName] =
    useState("");

  const [creatorName, setCreatorName] =
    useState("");

  const [websiteUrl, setWebsiteUrl] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [xProfile, setXProfile] =
    useState("");

  const [discord, setDiscord] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // --------------------------------------------------
  // ADMIN
  // --------------------------------------------------

  const [submissions, setSubmissions] =
    useState<Submission[]>([]);

  const [loadingSubmissions, setLoadingSubmissions] =
    useState(false);

  const [reviewingId, setReviewingId] =
    useState<string | null>(null);

  const [deployedCollections, setDeployedCollections] =
    useState<DeployedCollection[]>([]);

  const [loadingCollections, setLoadingCollections] =
    useState(false);

  const [approvingAddress, setApprovingAddress] =
    useState<string | null>(null);

  const [adminView, setAdminView] = useState<
    "submissions" | "collections"
  >("submissions");

  useEffect(() => {
    if (
      isAdmin &&
      activeTab === "admin"
    ) {
      loadAdminData();
    }
  }, [isAdmin, activeTab]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    const normalizedPin = validatePin();

    if (!normalizedPin) return;

    if (!contractAddress.trim()) {
      setMessage("Please enter the required information.");
      return;
    }

    if (!collectionName.trim()) {
      setMessage("Please enter the required information.");
      return;
    }

    if (!creatorName.trim()) {
      setMessage("Please enter the required information.");
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
            contractAddress:
              contractAddress.trim(),

            collectionName:
              collectionName.trim(),

            creatorName:
              creatorName.trim(),

            websiteUrl:
              websiteUrl.trim(),

            description:
              description.trim(),

            xProfile:
              xProfile.trim(),

            discord:
              discord.trim(),

            pinAddress:
              normalizedPin,

            walletAddress:
              address,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Something went wrong. Please try again."
        );
      }

      setMessage(
        "Your information has been submitted successfully."
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

  // --------------------------------------------------
  // ADMIN DATA
  // --------------------------------------------------

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
        setSubmissions(
          data.submissions ||
            data ||
            []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load submissions:",
        error
      );
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
          data.collections ||
            data ||
            []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load collections:",
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
          data?.error ||
            "Unable to complete this action."
        );
      }

      await loadSubmissions();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to complete this action."
      );
    } finally {
      setReviewingId(null);
    }
  }

  async function approveCollection(
    collectionAddressValue: string
  ) {
    setApprovingAddress(
      collectionAddressValue
    );

    try {
      const response = await fetch(
        "/api/submissions/approve-collection",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractAddress:
              collectionAddressValue,

            adminAddress:
              address,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to complete this action."
        );
      }

      await loadDeployedCollections();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to complete this action."
      );
    } finally {
      setApprovingAddress(null);
    }
  }

  // --------------------------------------------------
  // STYLES
  // --------------------------------------------------

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-white placeholder:text-white/25 outline-none transition focus:border-cyan-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-400/10";

  const cardClass =
    "rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl shadow-[0_0_60px_rgba(0,242,234,0.04)]";

  const gradientText =
    "bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent";

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[150px]" />

        <div className="absolute bottom-[-300px] right-[-200px] h-[650px] w-[650px] rounded-full bg-pink-500/10 blur-[160px]" />

        <div className="absolute left-[-250px] top-[45%] h-[500px] w-[500px] rounded-full bg-cyan-400/5 blur-[140px]" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8">
          {/* ==========================================
              HERO
          ========================================== */}

          <section className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-bold tracking-[0.2em] text-cyan-300 uppercase">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
              3 WORD PIN
            </div>

            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">
              Create.
              <br />

              <span className={gradientText}>
                Share. Pin.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/50 sm:text-lg">
              Give any place a simple three-word address
              that people can remember, share, and use to
              find you.
            </p>
          </section>

          {/* ==========================================
              TABS
          ========================================== */}

          <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.025] p-2 backdrop-blur-xl">
            <button
              type="button"
              onClick={() =>
                setActiveTab("create")
              }
              className={`rounded-xl px-6 py-3 text-sm font-bold transition ${
                activeTab === "create"
                  ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              Create a Pin
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("submit")
              }
              className={`rounded-xl px-6 py-3 text-sm font-bold transition ${
                activeTab === "submit"
                  ? "border border-pink-400/20 bg-pink-400/10 text-pink-300"
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              Add Your Place
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setActiveTab("admin")
                }
                className={`rounded-xl px-6 py-3 text-sm font-bold transition ${
                  activeTab === "admin"
                    ? "border border-white/20 bg-white/10 text-white"
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                Admin
              </button>
            )}
          </div>

          {/* ==========================================
              CREATE
          ========================================== */}

          {activeTab === "create" && (
            <section className="mx-auto mt-10 max-w-5xl">
              <div
                className={`${cardClass} overflow-hidden`}
              >
                <div className="border-b border-white/10 p-7 sm:p-10">
                  <div className="mb-3 text-sm font-bold tracking-[0.15em] text-cyan-300 uppercase">
                    Keep It Simple
                  </div>

                  <h2 className="text-3xl font-black sm:text-4xl">
                    Create Your 3 Word Pin
                  </h2>

                  <p className="mt-3 max-w-2xl text-white/45">
                    Enter three words to create a simple,
                    memorable address for a place.
                  </p>
                </div>

                <div className="space-y-8 p-7 sm:p-10">
                  {/* PIN INPUT */}

                  <div>
                    <label className="mb-3 block text-sm font-bold">
                      Your 3 Word Pin
                    </label>

                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-cyan-300">
                        ///
                      </span>

                      <input
                        value={pinAddress}
                        onChange={(event) =>
                          handlePinChange(
                            event.target.value
                          )
                        }
                        placeholder="house.blue.atlanta"
                        className={`${inputClass} pl-12 text-lg font-semibold`}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>

                    {pinError && (
                      <p className="mt-3 text-sm text-pink-400">
                        {pinError}
                      </p>
                    )}

                    {!pinError && (
                      <p className="mt-3 text-sm text-white/30">
                        Example:{" "}
                        <span className="text-cyan-300">
                          ///house.blue.atlanta
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Preview */}

                  <div className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.07] to-pink-500/[0.04] p-8 text-center">
                    <div className="absolute left-1/2 top-0 h-32 w-64 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[80px]" />

                    <div className="relative">
                      <div className="mb-3 text-xs font-bold tracking-[0.2em] text-white/30 uppercase">
                        Your Address
                      </div>

                      <div className="break-all text-3xl font-black sm:text-5xl">
                        <span className="text-cyan-300">
                          ///
                        </span>

                        <span className="bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
                          {pinAddress ||
                            "word.word.word"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={viewPin}
                      disabled={
                        !pinAddress ||
                        !isValidPin(pinAddress)
                      }
                      className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-6 py-4 font-bold text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      View My Pin →
                    </button>

                    <button
                      type="button"
                      onClick={continueToBuilder}
                      disabled={
                        !pinAddress ||
                        !isValidPin(pinAddress)
                      }
                      className="rounded-2xl bg-gradient-to-r from-cyan-400 to-pink-500 px-6 py-4 font-black text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Continue →
                    </button>
                  </div>

                  {/* Feature cards */}

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        icon: "✨",
                        title: "Memorable",
                        text: "Three simple words are easier to remember than a long address.",
                      },
                      {
                        icon: "↗",
                        title: "Shareable",
                        text: "Send your 3 Word Pin through text, social media, or anywhere else.",
                      },
                      {
                        icon: "⌖",
                        title: "Precise",
                        text: "Use your unique words to identify a specific place.",
                      },
                      {
                        icon: "💬",
                        title: "Promote",
                        text: "Turn your 3 Word Pin into something people can discover and share.",
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

                        <p className="mt-2 text-sm leading-6 text-white/35">
                          {feature.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ========================================
                  SOCIAL PROMOTION
              ======================================== */}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <a
                  href="https://social.3wordpin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardClass} group p-7 transition hover:border-cyan-400/30`}
                >
                  <div className="text-3xl">
                    📍
                  </div>

                  <div className="mt-4 text-xs font-bold tracking-[0.18em] text-cyan-300 uppercase">
                    3 WORD PIN
                  </div>

                  <div className="mt-2 text-2xl font-black">
                    Share Your Place ↗
                  </div>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    Make your location easier to remember,
                    share, and discover.
                  </p>
                </a>

                <a
                  href="https://social.3wordpin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardClass} group p-7 transition hover:border-pink-400/30`}
                >
                  <div className="text-3xl">
                    💬
                  </div>

                  <div className="mt-4 text-xs font-bold tracking-[0.18em] text-pink-300 uppercase">
                    3 WORD PIN SOCIAL
                  </div>

                  <div className="mt-2 text-2xl font-black">
                    Promote Your XRPLBNB ↗
                  </div>

                  <p className="mt-2 text-sm leading-6 text-white/40">
                    To promote your XRPLBNB, use 3 Word Pin
                    Social to share your place and reach more
                    people.
                  </p>
                </a>
              </div>
            </section>
          )}

          {/* ==========================================
              ADD YOUR PLACE
          ========================================== */}

          {activeTab === "submit" && (
            <section className="mx-auto mt-10 max-w-5xl">
              <div
                className={`${cardClass} p-7 sm:p-10`}
              >
                <div className="mb-10">
                  <div className="mb-3 text-sm font-bold tracking-[0.15em] text-pink-300 uppercase">
                    3 WORD PIN
                  </div>

                  <h2 className="text-3xl font-black sm:text-4xl">
                    Add Your Place
                  </h2>

                  <p className="mt-3 max-w-2xl text-white/45">
                    Connect your place, business, project, or
                    destination to a memorable 3 Word Pin.
                  </p>
                </div>

                {/* PIN */}

                <div className="mb-8">
                  <label className="mb-3 block text-sm font-bold">
                    3 Word Pin Address *
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-black text-cyan-300">
                      ///
                    </span>

                    <input
                      value={pinAddress}
                      onChange={(event) =>
                        handlePinChange(
                          event.target.value
                        )
                      }
                      placeholder="house.blue.atlanta"
                      className={`${inputClass} pl-12`}
                      required
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  {pinError && (
                    <p className="mt-2 text-sm text-pink-400">
                      {pinError}
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Place Name *
                    </label>

                    <input
                      value={collectionName}
                      onChange={(event) =>
                        setCollectionName(
                          event.target.value
                        )
                      }
                      placeholder="Your Place or Business"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Name *
                    </label>

                    <input
                      value={creatorName}
                      onChange={(event) =>
                        setCreatorName(
                          event.target.value
                        )
                      }
                      placeholder="Your name or organization"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Website
                    </label>

                    <input
                      value={websiteUrl}
                      onChange={(event) =>
                        setWebsiteUrl(
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Social Profile
                      </label>

                      <input
                        value={xProfile}
                        onChange={(event) =>
                          setXProfile(
                            event.target.value
                          )
                        }
                        placeholder="@username"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Community Link
                      </label>

                      <input
                        value={discord}
                        onChange={(event) =>
                          setDiscord(
                            event.target.value
                          )
                        }
                        placeholder="Your community link"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value
                        )
                      }
                      placeholder="Tell people about this place..."
                      rows={5}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {message && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-200">
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-pink-500 px-6 py-4 font-black text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting
                      ? "Creating..."
                      : "Create My 3 Word Pin →"}
                  </button>
                </form>
              </div>
            </section>
          )}

          {/* ==========================================
              ADMIN
          ========================================== */}

          {activeTab === "admin" && isAdmin && (
            <section className="mx-auto mt-10 max-w-6xl">
              <div
                className={`${cardClass} overflow-hidden`}
              >
                <div className="border-b border-white/10 p-7 sm:p-10">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="mb-3 text-xs font-bold tracking-[0.2em] text-white/30 uppercase">
                        Private Area
                      </div>

                      <h2 className="text-3xl font-black">
                        Admin Dashboard
                      </h2>

                      <p className="mt-2 text-white/40">
                        Manage submitted places and addresses.
                      </p>
                    </div>

                    <div className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-xs font-bold text-cyan-300">
                      ADMIN
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-white/10">
                  <button
                    type="button"
                    onClick={() =>
                      setAdminView(
                        "submissions"
                      )
                    }
                    className={`flex-1 px-5 py-4 text-sm font-bold ${
                      adminView === "submissions"
                        ? "border-b-2 border-cyan-400 text-cyan-300"
                        : "text-white/35"
                    }`}
                  >
                    Submitted Places
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAdminView(
                        "collections"
                      )
                    }
                    className={`flex-1 px-5 py-4 text-sm font-bold ${
                      adminView === "collections"
                        ? "border-b-2 border-pink-400 text-pink-300"
                        : "text-white/35"
                    }`}
                  >
                    Places
                  </button>
                </div>

                {/* Submitted places */}

                {adminView ===
                  "submissions" && (
                  <div className="p-7 sm:p-10">
                    {loadingSubmissions ? (
                      <div className="py-16 text-center text-white/40">
                        Loading...
                      </div>
                    ) : submissions.length ===
                      0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/35">
                        No submitted places.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map(
                          (submission) => (
                            <div
                              key={
                                submission.id
                              }
                              className="rounded-3xl border border-white/10 bg-white/[0.025] p-6"
                            >
                              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                  <h3 className="text-xl font-black">
                                    {submission.collectionName ||
                                      "Unnamed Place"}
                                  </h3>

                                  <p className="mt-1 text-sm text-white/40">
                                    {submission.creatorName}
                                  </p>

                                  {submission.pinAddress && (
                                    <div className="mt-4 inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-sm font-bold text-cyan-300">
                                      ///
                                      {normalizePin(
                                        submission.pinAddress
                                      )}
                                    </div>
                                  )}

                                  {submission.description && (
                                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/40">
                                      {
                                        submission.description
                                      }
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
                                    Remove
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

                {/* Places */}

                {adminView ===
                  "collections" && (
                  <div className="p-7 sm:p-10">
                    {loadingCollections ? (
                      <div className="py-16 text-center text-white/40">
                        Loading...
                      </div>
                    ) : deployedCollections.length ===
                      0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-white/35">
                        No places found.
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
                                      "Unnamed Place"}
                                  </h3>

                                  {collection.creatorName && (
                                    <p className="mt-1 text-sm text-white/40">
                                      {
                                        collection.creatorName
                                      }
                                    </p>
                                  )}

                                  {collection.pinAddress && (
                                    <div className="mt-3 inline-flex rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-sm font-bold text-cyan-300">
                                      ///
                                      {normalizePin(
                                        collection.pinAddress
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2">
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
                                      ? "Saving..."
                                      : "Approve"}
                                  </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ==========================================
              BOTTOM CTA
          ========================================== */}

          {activeTab !== "admin" && (
            <section className="mx-auto mt-14 max-w-4xl text-center">
              <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 backdrop-blur-xl sm:p-12">
                <div className="text-sm font-bold tracking-[0.2em] text-white/25 uppercase">
                  Keep It Simple
                </div>

                <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                  One place.
                  <br />

                  <span className={gradientText}>
                    Three words.
                  </span>
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-white/40">
                  Create an address people can actually
                  remember and share.
                </p>

                {pinAddress &&
                  isValidPin(pinAddress) && (
                    <button
                      type="button"
                      onClick={viewPin}
                      className="mt-7 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-6 py-3 font-bold text-cyan-300 transition hover:bg-cyan-400/10"
                    >
                      View ///
                      {normalizePin(pinAddress)}
                      {" →"}
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

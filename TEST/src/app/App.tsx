import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const GLOW_STYLE = `
  @keyframes glow-pulse {
    0%, 100% {
      box-shadow: 0 0 6px 2px rgba(200,245,96,0.35), inset 0 0 6px rgba(200,245,96,0.12);
    }
    50% {
      box-shadow: 0 0 20px 6px rgba(200,245,96,0.75), inset 0 0 14px rgba(200,245,96,0.25);
    }
  }
`;

const CATEGORIES = [
  "RENT", "MEDICAL AID", "ELECTRIC",
  "WATER", "GYM", "SUBS",
  "TRANSPORT", "GROCERIES", "TAKEOUT",
  "PERSONAL", "MISC/CASH", "FEES",
];

interface Transaction {
  id: number;
  amount: string;
  date: string;
  description: string;
  suggested: string;
}

interface HistoryEntry {
  index: number;
  note: string;
  chosenCat: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: 1,  amount: "£12.83",  date: "21/03/2026", description: "CHECKERS HYPER DURBAN ZA",  suggested: "GROCERIES"   },
  { id: 2,  amount: "£49.99",  date: "20/03/2026", description: "PLANET FITNESS MONTHLY",    suggested: "GYM"          },
  { id: 3,  amount: "£128.50", date: "19/03/2026", description: "CITY POWER PREPAID",         suggested: "ELECTRIC"    },
  { id: 4,  amount: "£850.00", date: "01/03/2026", description: "LANDLORD BANK TRANSFER",    suggested: "RENT"         },
  { id: 5,  amount: "£22.40",  date: "18/03/2026", description: "UBER EATS ORDER #4821",      suggested: "TAKEOUT"     },
  { id: 6,  amount: "£14.99",  date: "17/03/2026", description: "NETFLIX SUBSCRIPTION",       suggested: "SUBS"        },
  { id: 7,  amount: "£35.60",  date: "16/03/2026", description: "MUNICIPAL WATER BILL",       suggested: "WATER"       },
  { id: 8,  amount: "£78.20",  date: "15/03/2026", description: "DISCOVERY HEALTH MED",       suggested: "MEDICAL AID" },
  { id: 9,  amount: "£42.00",  date: "14/03/2026", description: "TAXIFY TRIP X3",              suggested: "TRANSPORT"   },
  { id: 10, amount: "£200.00", date: "13/03/2026", description: "ATM WITHDRAWAL FNB",          suggested: "MISC/CASH"   },
];

const CARD_HEIGHT = 168;

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animKey, setAnimKey]           = useState(0);
  const [direction, setDirection]       = useState<"forward" | "backward">("forward");
  const [note, setNote]                 = useState("");
  const [completed, setCompleted]       = useState(false);
  const [sortedCount, setSortedCount]   = useState(0);
  const [selectedCat, setSelectedCat]   = useState<string | null>(null);
  // restoredCat: the category previously chosen for this transaction (shown after undo)
  const [restoredCat, setRestoredCat]   = useState<string | null>(null);
  const [history, setHistory]           = useState<HistoryEntry[]>([]);

  const transaction = TRANSACTIONS[currentIndex];
  const canUndo     = history.length > 0 && !selectedCat && !completed;

  /* ── Advance to next transaction ── */
  const advance = (chosenCat: string) => {
    if (currentIndex >= TRANSACTIONS.length - 1) {
      setSortedCount((c) => c + 1);
      setCompleted(true);
    } else {
      setHistory((h) => [...h, { index: currentIndex, note, chosenCat }]);
      setSortedCount((c) => c + 1);
      setDirection("forward");
      setAnimKey((k) => k + 1);
      setCurrentIndex((i) => i + 1);
      setNote("");
    }
    setSelectedCat(null);
    setRestoredCat(null);
  };

  /* ── Category selected ── */
  const handleCategory = (cat: string) => {
    if (selectedCat || completed) return;
    setRestoredCat(null);
    setSelectedCat(cat);
    setTimeout(() => advance(cat), 500);
  };

  /* ── Undo ── */
  const handleUndo = () => {
    if (!canUndo) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setSortedCount((c) => Math.max(0, c - 1));
    setDirection("backward");
    setAnimKey((k) => k + 1);
    setCurrentIndex(prev.index);
    setNote(prev.note);
    setCompleted(false);
    // Restore the previously chosen category so the user can see & change it
    setRestoredCat(prev.chosenCat);
  };

  const enterY = direction === "forward" ? 56 : -56;
  const exitY  = direction === "forward" ? -56 : 56;

  return (
    <>
      <style>{GLOW_STYLE}</style>
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#151815" }}
      >
        <div
          style={{
            width: 340,
            minHeight: 700,
            background: "#151815",
            borderRadius: 44,
            border: "2px solid #2a2e29",
            boxShadow: "0 0 0 6px #111, 0 30px 80px rgba(0,0,0,0.7), inset 0 0 30px rgba(0,0,0,0.4)",
            padding: "28px 20px 24px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Notch */}
          <div className="flex justify-center mb-4">
            <div style={{ width: 100, height: 6, background: "#1C201B", borderRadius: 3 }} />
          </div>

          {/* ── Transaction card slot ── */}
          <div style={{ height: CARD_HEIGHT, position: "relative", overflow: "hidden", flexShrink: 0 }}>
            <AnimatePresence mode="popLayout" initial={false}>
              {!completed ? (
                <motion.div
                  key={animKey}
                  initial={{ y: enterY, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1,
                    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                  exit={{ y: exitY, opacity: 0, scale: 0.97,
                    transition: { duration: 0.28, ease: [0.55, 0, 0.78, 0] } }}
                  drag={canUndo ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0.28, right: 0.05 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -55 || info.velocity.x < -350) handleUndo();
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#1C201B",
                    border: "1px solid #2a2e29",
                    borderRadius: 12,
                    padding: "16px 18px",
                    cursor: canUndo ? "grab" : "default",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#C8F560", fontSize: 9, letterSpacing: "0.15em", fontFamily: "monospace" }}>
                      AMOUNT
                    </span>
                    <span style={{ color: "#444", fontSize: 9, letterSpacing: "0.1em", fontFamily: "monospace" }}>
                      {currentIndex + 1}/{TRANSACTIONS.length}
                    </span>
                  </div>

                  <div style={{ color: "#fff", fontSize: 32, fontFamily: "Georgia, serif", letterSpacing: "-0.02em", marginBottom: 14 }}>
                    {transaction.amount}
                  </div>

                  <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.08em", lineHeight: 1.9, color: "#C8F560" }}>
                    <span style={{ color: "#555" }}>DATE: </span>{transaction.date}<br />
                    <span style={{ color: "#555" }}>DESCRIPTION: </span>{transaction.description}<br />
                    <span style={{ color: "#555" }}>SUGGESTED: </span>{transaction.suggested}
                  </div>

                  {/* Back arrow */}
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); handleUndo(); }}
                    disabled={!canUndo}
                    animate={{ opacity: canUndo ? 1 : 0.18 }}
                    transition={{ duration: 0.35 }}
                    whileHover={canUndo ? { scale: 1.2 } : {}}
                    whileTap={canUndo ? { scale: 0.9 } : {}}
                    style={{
                      position: "absolute",
                      bottom: 10,
                      right: 12,
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: canUndo ? "pointer" : "default",
                      color: "rgba(200,245,96,0.32)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                      <path d="M5.5 1L1 5.5L5.5 10M1 5.5H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="done"
                  initial={{ y: 56, opacity: 0, scale: 0.97 }}
                  animate={{ y: 0, opacity: 1, scale: 1,
                    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                  style={{
                    position: "absolute", inset: 0,
                    background: "#1C201B", border: "1px solid #2a2e29", borderRadius: 12,
                    padding: "16px 18px", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <span style={{ color: "#C8F560", fontSize: 11, letterSpacing: "0.2em", fontFamily: "monospace" }}>ALL DONE</span>
                  <span style={{ color: "#fff", fontSize: 28, fontFamily: "Georgia, serif" }}>✓</span>
                  <span style={{ color: "#555", fontSize: 9, letterSpacing: "0.12em", fontFamily: "monospace" }}>
                    {sortedCount} TRANSACTIONS SORTED
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ flex: 1, minHeight: 16 }} />

          {/* ── Category grid ── */}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={animKey}
              initial={{ x: direction === "forward" ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ x: direction === "forward" ? -60 : 60, opacity: 0, transition: { duration: 0.22, ease: [0.55, 0, 0.78, 0] } }}
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}
            >
              {CATEGORIES.map((cat) => (
                <CategoryButton
                  key={cat}
                  label={cat}
                  isSuggested={!completed && !selectedCat && !restoredCat && transaction?.suggested === cat}
                  isSelected={selectedCat === cat}
                  isRestored={!selectedCat && restoredCat === cat}
                  onClick={() => handleCategory(cat)}
                  disabled={!!selectedCat || completed}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Note input */}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder=""
            style={{
              width: "100%",
              background: "#1C201B",
              border: "1px solid #2a2e29",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#C8F560",
              fontFamily: "monospace",
              fontSize: 11,
              outline: "none",
              letterSpacing: "0.08em",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(200,245,96,0.3)"; }}
            onBlur={(e)  => { e.target.style.borderColor = "#2a2e29"; }}
          />
        </div>
      </div>
    </>
  );
}

/* ─── Category button ─── */
function CategoryButton({
  label,
  isSuggested,
  isSelected,
  isRestored,
  onClick,
  disabled,
}: {
  label: string;
  isSuggested: boolean;
  isSelected: boolean;
  isRestored: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  /* Derived border / bg / text */
  const borderColor = isSelected
    ? "#C8F560"
    : isRestored
    ? "rgba(200,245,96,0.9)"
    : isSuggested
    ? "rgba(200,245,96,0.55)"
    : "#2a2e29";

  const bgColor = isSelected
    ? "#C8F560"
    : isRestored
    ? "rgba(200,245,96,0.10)"
    : "#1C201B";

  const textColor = isSelected
    ? "#000000"
    : isRestored || isSuggested
    ? "#C8F560"
    : "#888888";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.93 } : {}}
      animate={{ backgroundColor: bgColor, borderColor }}
      transition={{ duration: 0.18 }}
      style={{
        position: "relative",
        border: "1px solid",
        borderRadius: 8,
        padding: "10px 4px",
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        outline: "none",
        overflow: "hidden",
      }}
    >
      {/* Pulse glow — only when suggested */}
      <AnimatePresence>
        {isSuggested && (
          <motion.div
            key="glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeOut" } }}
            transition={{ duration: 0.35 }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 7,
              pointerEvents: "none",
              animation: "glow-pulse 1.6s ease-in-out infinite",
            }}
          />
        )}
      </AnimatePresence>

      {/* Restored indicator — subtle static inner ring */}
      <AnimatePresence>
        {isRestored && (
          <motion.div
            key="restored-ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute",
              inset: 2,
              borderRadius: 5,
              border: "1px solid rgba(200,245,96,0.3)",
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      <motion.span
        animate={{ color: textColor }}
        transition={{ duration: 0.18 }}
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.12em",
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}
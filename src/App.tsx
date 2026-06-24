/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Calendar, Sparkles, TrendingUp, HelpCircle, Save, Award, ChevronRight, Moon, LogOut, Coffee, ChevronDown, ChevronUp, Cloud, Check, Loader2 } from "lucide-react";
import { OvertimeLog, OvertimeSettings, Signer } from "./types";
import AIParsingBox from "./components/AIParsingBox";
import ActiveTimer from "./components/ActiveTimer";
import HeatmapCalendar from "./components/HeatmapCalendar";
import OvertimeAnalytics from "./components/OvertimeAnalytics";
import LogHistory from "./components/LogHistory";
import ProfileModal from "./components/ProfileModal";

// Firebase Integration imports
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "./firebase";

// Initial mocking backup data just to make the application beautiful on first open
const INITIAL_DEMO_LOGS: OvertimeLog[] = [
  {
    id: "demo-1",
    date: "2026-05-22",
    startTime: "18:00",
    endTime: "20:30",
    durationHours: 2.5,
    activity: "Debugging bug pengirim email & testing staging",
    createdAt: new Date("2026-05-22T21:00:00Z").toISOString(),
  },
  {
    id: "demo-2",
    date: "2026-05-20",
    startTime: "17:30",
    endTime: "21:30",
    durationHours: 4,
    activity: "Software Dev: Integrasi API Payment gateway",
    createdAt: new Date("2026-05-20T22:00:00Z").toISOString(),
  },
  {
    id: "demo-3",
    date: "2026-05-18",
    startTime: "18:15",
    endTime: "20:15",
    durationHours: 2,
    activity: "Rapat koordinasi deployment rilis v1.2",
    createdAt: new Date("2026-05-18T20:30:00Z").toISOString(),
  },
];

// Helper to robustly check if an error is due to being offline or unavailable
function checkIsOfflineError(err: any): boolean {
  if (!err) return false;
  
  // Extract all potential message indicators from the error object to bypass any iframe cross-realm instanceof issues
  const parts: string[] = [];
  if (typeof err === "string") {
    parts.push(err);
  } else if (typeof err === "object") {
    if (err.message) parts.push(String(err.message));
    if (err.error) parts.push(String(err.error));
    if (err.code) parts.push(String(err.code));
    if (err.reason) parts.push(String(err.reason));
    if (err.description) parts.push(String(err.description));
    try {
      parts.push(JSON.stringify(err));
    } catch (e) {
      // Ignore serialization issues
    }
    if (typeof err.toString === "function") {
      try {
        parts.push(err.toString());
      } catch (e) {
        // Ignore
      }
    }
  } else {
    parts.push(String(err));
  }

  const errStr = parts.filter(Boolean).join(" ").toLowerCase();

  return (
    errStr.includes("offline") ||
    errStr.includes("unavailable") ||
    errStr.includes("failed to get") ||
    errStr.includes("network") ||
    errStr.includes("not-found") ||
    errStr.includes("failed-precondition") ||
    err?.code === "unavailable" ||
    err?.code === "failed-precondition"
  );
}

const DEFAULT_SIGNERS: Signer[] = [
  {
    id: "fernandez",
    name: "FERNANDEZ",
    badge: "2084875",
    position: "Smd I ITR Pabrik I",
    plant: "Pabrik I",
    createdAt: new Date("2026-06-22T00:00:00Z").toISOString(),
  },
  {
    id: "suharnoto",
    name: "SUHARNOTO",
    badge: "2073912",
    position: "Smd II ITR Pabrik II",
    plant: "Pabrik II",
    createdAt: new Date("2026-06-22T00:00:00Z").toISOString(),
  },
  {
    id: "agus_setiawan",
    name: "AGUS SETIAWAN",
    badge: "2091244",
    position: "Smd III ITR Pabrik III",
    plant: "Pabrik III",
    createdAt: new Date("2026-06-22T00:00:00Z").toISOString(),
  },
  {
    id: "bambang_hermanto",
    name: "BAMBANG HERMANTO",
    badge: "2054321",
    position: "Manager Inspeksi Teknik",
    plant: "Umum",
    createdAt: new Date("2026-06-22T00:00:00Z").toISOString(),
  },
];

export default function App() {
  const [logs, setLogs] = useState<OvertimeLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [settings, setSettings] = useState<OvertimeSettings>({
    hourlyRate: 50000,
    monthlyTargetHours: 20,
    employeeName: "Firul", // extracted default from firul.rma@gmail.com
    employeeBadge: "K. 210250",
    department: "Inspeksi Teknik Rotating & Khusus",
    overtimeType: "hidup",
  });
  const [signers, setSigners] = useState<Signer[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Firebase configuration state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [bypassedLogin, setBypassedLogin] = useState(false);

  // Auto dismiss brand splash screen once auth finishes loading
  useEffect(() => {
    if (!isAuthLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1500); // 1.5 seconds beauty delay for branding logo
      return () => clearTimeout(timer);
    }
  }, [isAuthLoading]);

  // Tab/view selections: "input" (Timer & AI parser) or "analytics" (History & Analytics)
  const [activeTab, setActiveTab] = useState<"input" | "stats">("input");

  // Modal dialog states
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  // Load state and listen to configuration and logs on mount
  useEffect(() => {
    // 1. Instantly pull isolated local storage based on last active user to keep app ultra-fast
    const lastUser = localStorage.getItem("last_active_user") || "guest";
    const logsKey = lastUser === "guest" ? "catat_lembur_logs_guest" : `catat_lembur_logs_${lastUser}`;
    
    let storedLogs = localStorage.getItem(logsKey);
    // Backward compatibility lookup
    if (!storedLogs && lastUser === "guest") {
      storedLogs = localStorage.getItem("catat_lembur_logs");
    }

    if (storedLogs) {
      setLogs(JSON.parse(storedLogs));
    } else {
      setLogs(INITIAL_DEMO_LOGS);
      localStorage.setItem(logsKey, JSON.stringify(INITIAL_DEMO_LOGS));
    }

    const settingsKey = lastUser === "guest" ? "catat_lembur_settings_guest" : `catat_lembur_settings_${lastUser}`;
    let storedSettings = localStorage.getItem(settingsKey);
    // Backward compatibility lookup
    if (!storedSettings && lastUser === "guest") {
      storedSettings = localStorage.getItem("catat_lembur_settings");
    }

    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      setSettings(prev => ({
        ...prev,
        ...parsed,
        employeeBadge: parsed.employeeBadge || "K. 210250",
        department: parsed.department || "Inspeksi Teknik Rotating & Khusus",
        overtimeType: parsed.overtimeType || "hidup"
      }));
    } else {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    }

    // Load signers for guest/initial status
    const guestSignersKey = "catat_lembur_signers_guest";
    const storedSignersLocal = localStorage.getItem(guestSignersKey);
    if (storedSignersLocal) {
      setSigners(JSON.parse(storedSignersLocal));
    } else {
      setSigners(DEFAULT_SIGNERS);
      localStorage.setItem(guestSignersKey, JSON.stringify(DEFAULT_SIGNERS));
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setSelectedDate(todayStr);

    const savedTimer = localStorage.getItem("active_overtime_timer");
    if (savedTimer) {
      setIsTimerRunning(true);
    }

    // 2. Setup real-time Firebase Auth/Firestore listener with secure context isolation
    let unsubscribeLogs: (() => void) | null = null;
    let unsubscribeSignersList: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Force cleanup of any previous active user snapshot listener to prevent crosstalk
      if (unsubscribeLogs) {
        unsubscribeLogs();
        unsubscribeLogs = null;
      }
      if (unsubscribeSignersList) {
        unsubscribeSignersList();
        unsubscribeSignersList = null;
      }

      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        setAuthError(null);
        
        // Save current active user ID to avoid crosstalk
        localStorage.setItem("last_active_user", currentUser.uid);

        // a. Sync Profile settings with Firestore (user-specific scope)
        const configPath = `users/${currentUser.uid}/settings/config`;
        const configRef = doc(db, configPath);
        const userSettingsKey = `catat_lembur_settings_${currentUser.uid}`;
        
        try {
          const configSnap = await getDoc(configRef);
          if (configSnap.exists()) {
            const remoteSettings = configSnap.data() as OvertimeSettings;
            const updated: OvertimeSettings = {
              ...settings,
              ...remoteSettings,
              employeeBadge: remoteSettings.employeeBadge || "K. 210250",
              department: remoteSettings.department || "Inspeksi Teknik Rotating & Khusus",
            };
            setSettings(updated);
            localStorage.setItem(userSettingsKey, JSON.stringify(updated));
          } else {
            // First login for this account: let's build fresh settings pre-populated with their dynamic Google Name!
            const defaultGoogleName = currentUser.displayName || currentUser.email?.split("@")[0] || "User";
            const initialUserData: OvertimeSettings = {
              hourlyRate: 50000,
              monthlyTargetHours: 20,
              employeeName: defaultGoogleName,
              employeeBadge: "K. 210250",
              department: "Inspeksi Teknik Rotating & Khusus",
              overtimeType: "hidup",
            };
            setSettings(initialUserData);
            await setDoc(configRef, initialUserData);
            localStorage.setItem(userSettingsKey, JSON.stringify(initialUserData));
          }
        } catch (err: any) {
          console.warn("Firestore settings fetch failed/offline on startup, falling back to user-specific cached settings:", err);
          const userCachedSettings = localStorage.getItem(userSettingsKey);
          if (userCachedSettings) {
            try {
              setSettings(JSON.parse(userCachedSettings));
            } catch (e) {
              // Ignore parse errors
            }
          } else {
            // Setup default user settings if no cache exists
            const defaultGoogleName = currentUser.displayName || currentUser.email?.split("@")[0] || "User";
            setSettings({
              hourlyRate: 50000,
              monthlyTargetHours: 20,
              employeeName: defaultGoogleName,
              employeeBadge: "K. 210250",
              department: "Inspeksi Teknik Rotating & Khusus",
              overtimeType: "hidup",
            });
          }
        }

        // b. Subs to real-time sync of Logs
        const logsPath = `users/${currentUser.uid}/logs`;
        const logsRef = collection(db, logsPath);
        const userLogsKey = `catat_lembur_logs_${currentUser.uid}`;
        
        unsubscribeLogs = onSnapshot(
          logsRef,
          async (snapshot) => {
            if (snapshot.empty) {
              // Server collection is empty. Let's see if there are any offline logs specifically for this logged-in account,
              // or transition logs if they just upgraded from guest state (and didn't switch distinct accounts).
              const storedUserLogs = localStorage.getItem(userLogsKey);
              
              let currentLocalLogs: OvertimeLog[] = [];
              if (storedUserLogs) {
                currentLocalLogs = JSON.parse(storedUserLogs);
              } else {
                // If there is no specific user cache, only import if previous state was a guest
                const lastUserTypeCheck = lastUser;
                if (!lastUserTypeCheck || lastUserTypeCheck === "guest") {
                  const guestLogs = localStorage.getItem("catat_lembur_logs_guest") || localStorage.getItem("catat_lembur_logs");
                  if (guestLogs) {
                    currentLocalLogs = JSON.parse(guestLogs).filter((l: OvertimeLog) => !l.id.startsWith("demo-"));
                  }
                }
              }

              const actualOfflineLogs = currentLocalLogs.filter(
                (l: OvertimeLog) => !l.id.startsWith("demo-")
              );

              if (actualOfflineLogs.length > 0) {
                const batch = writeBatch(db);
                actualOfflineLogs.forEach((log: OvertimeLog) => {
                  batch.set(doc(db, `users/${currentUser.uid}/logs/${log.id}`), log);
                });
                try {
                  await batch.commit();
                } catch (err: any) {
                  const isOfflineErr = checkIsOfflineError(err);
                  if (isOfflineErr) {
                    console.warn("Firestore batch is offline, queued locally:", err);
                  } else {
                    handleFirestoreError(err, OperationType.WRITE, logsPath);
                  }
                }
              } else {
                setLogs([]);
              }
            } else {
              const cloudLogs: OvertimeLog[] = [];
              snapshot.forEach((docSnap) => {
                cloudLogs.push(docSnap.data() as OvertimeLog);
              });

              // Check if we have any local or guest logs that are NOT on the server yet (so we don't wipe them out!)
              const storedUserLogs = localStorage.getItem(userLogsKey);
              const guestLogs = localStorage.getItem("catat_lembur_logs_guest") || localStorage.getItem("catat_lembur_logs");
              
              let localLogsMerged: OvertimeLog[] = [];
              if (storedUserLogs) {
                try { localLogsMerged = JSON.parse(storedUserLogs); } catch(e) {}
              }
              if (guestLogs) {
                try {
                  const parsedGuest = JSON.parse(guestLogs);
                  parsedGuest.forEach((gLog: OvertimeLog) => {
                    if (!gLog.id.startsWith("demo-") && !localLogsMerged.some(l => l.id === gLog.id)) {
                      localLogsMerged.push(gLog);
                    }
                  });
                } catch(e) {}
              }

              // Filter out demo logs, and find any unsynced logs
              const unsyncedLogs = localLogsMerged.filter(
                (localLog) => !localLog.id.startsWith("demo-") && !cloudLogs.some((cloudLog) => cloudLog.id === localLog.id)
              );

              if (unsyncedLogs.length > 0) {
                console.log("Syncing unsynced local logs to Firestore:", unsyncedLogs);
                const batch = writeBatch(db);
                unsyncedLogs.forEach((log) => {
                  batch.set(doc(db, `users/${currentUser.uid}/logs/${log.id}`), log);
                });
                batch.commit().catch((err) => {
                  console.warn("Failed to commit unsynced local logs:", err);
                });
                
                // Add unsynced logs to displayed logs until next snapshot fires
                unsyncedLogs.forEach((log) => {
                  if (!cloudLogs.some(c => c.id === log.id)) {
                    cloudLogs.push(log);
                  }
                });
              }

              cloudLogs.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
              setLogs(cloudLogs);
              localStorage.setItem(userLogsKey, JSON.stringify(cloudLogs));
            }
          },
          (err: any) => {
            console.warn("Firestore onSnapshot error, falling back to local user logs cached:", err);
            const storedLogsLocal = localStorage.getItem(userLogsKey);
            if (storedLogsLocal) {
              try {
                setLogs(JSON.parse(storedLogsLocal));
              } catch (e) {
                // Ignore
              }
            } else {
              const guestLogs = localStorage.getItem("catat_lembur_logs_guest") || localStorage.getItem("catat_lembur_logs");
              if (guestLogs) {
                try {
                  const parsed = JSON.parse(guestLogs).filter((l: OvertimeLog) => !l.id.startsWith("demo-"));
                  if (parsed.length > 0) {
                    setLogs(parsed);
                    return;
                  }
                } catch (e) {}
              }
              setLogs([]);
            }
          }
        );

        // c. Subs to real-time sync of Signers
        const signersPath = `users/${currentUser.uid}/signers`;
        const signersRef = collection(db, signersPath);
        const userSignersKey = `catat_lembur_signers_${currentUser.uid}`;

        const seedSignersIfEmpty = async () => {
          try {
            const snap = await getDocs(signersRef);
            if (snap.empty) {
              const batch = writeBatch(db);
              DEFAULT_SIGNERS.forEach((sig) => {
                batch.set(doc(db, `users/${currentUser.uid}/signers/${sig.id}`), sig);
              });
              await batch.commit();
            }
          } catch (seedErr) {
            console.warn("Signers seed fallback error (likely offline):", seedErr);
          }
        };

        seedSignersIfEmpty().then(() => {
          unsubscribeSignersList = onSnapshot(
            signersRef,
            (snapshot) => {
              const list: Signer[] = [];
              snapshot.forEach((snapDoc) => {
                list.push(snapDoc.data() as Signer);
              });
              setSigners(list);
              localStorage.setItem(userSignersKey, JSON.stringify(list));
            },
            (err) => {
              console.warn("Signers snapshot failed, using local user signers cache:", err);
              const storedSigners = localStorage.getItem(userSignersKey);
              if (storedSigners) {
                setSigners(JSON.parse(storedSigners));
              }
            }
          );
        });

      } else {
        // Logged out: fallback to guest local stores
        if (unsubscribeLogs) {
          unsubscribeLogs();
        }
        if (unsubscribeSignersList) {
          unsubscribeSignersList();
          unsubscribeSignersList = null;
        }
        localStorage.setItem("last_active_user", "guest");
        
        const guestLogsKey = "catat_lembur_logs_guest";
        let storedLogsLocal = localStorage.getItem(guestLogsKey);
        if (!storedLogsLocal) {
          storedLogsLocal = localStorage.getItem("catat_lembur_logs");
        }
        
        if (storedLogsLocal) {
          setLogs(JSON.parse(storedLogsLocal));
        } else {
          setLogs(INITIAL_DEMO_LOGS);
        }
        
        const guestSettingsKey = "catat_lembur_settings_guest";
        let storedSettingsLocal = localStorage.getItem(guestSettingsKey);
        if (!storedSettingsLocal) {
          storedSettingsLocal = localStorage.getItem("catat_lembur_settings");
        }

        if (storedSettingsLocal) {
          const parsed = JSON.parse(storedSettingsLocal);
          setSettings(prev => ({
            ...prev,
            ...parsed,
            employeeBadge: parsed.employeeBadge || "K. 210250",
            department: parsed.department || "Inspeksi Teknik Rotating & Khusus",
            overtimeType: parsed.overtimeType || "hidup"
          }));
        } else {
          setSettings({
            hourlyRate: 50000,
            monthlyTargetHours: 20,
            employeeName: "Firul",
            employeeBadge: "K. 210250",
            department: "Inspeksi Teknik Rotating & Khusus",
            overtimeType: "hidup",
          });
        }

        const guestSignersKey = "catat_lembur_signers_guest";
        const storedSignersLocal = localStorage.getItem(guestSignersKey);
        if (storedSignersLocal) {
          setSigners(JSON.parse(storedSignersLocal));
        } else {
          setSigners(DEFAULT_SIGNERS);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeLogs) {
        unsubscribeLogs();
      }
      if (unsubscribeSignersList) {
        unsubscribeSignersList();
      }
    };
  }, []);

  const handleLogAdd = async (newLogData: Omit<OvertimeLog, "id" | "createdAt">) => {
    const freshLog: OvertimeLog = {
      ...newLogData,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
 
    const updatedLogs = [freshLog, ...logs];
    setLogs(updatedLogs);
    
    // Save to isolated user-specific key
    const logsKey = user ? `catat_lembur_logs_${user.uid}` : "catat_lembur_logs_guest";
    localStorage.setItem(logsKey, JSON.stringify(updatedLogs));
 
    if (user) {
      const logPath = `users/${user.uid}/logs/${freshLog.id}`;
      try {
        await setDoc(doc(db, logPath), freshLog);
      } catch (err: any) {
        const isOfflineErr = checkIsOfflineError(err);
        if (isOfflineErr) {
          console.warn("Firestore is offline, log queued in local database cache:", err);
        } else {
          handleFirestoreError(err, OperationType.WRITE, logPath);
        }
      }
    }
  };
 
  const handleLogDelete = async (id: string) => {
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    
    // Save to isolated user-specific key
    const logsKey = user ? `catat_lembur_logs_${user.uid}` : "catat_lembur_logs_guest";
    localStorage.setItem(logsKey, JSON.stringify(updated));
 
    if (user) {
      const logPath = `users/${user.uid}/logs/${id}`;
      try {
        await deleteDoc(doc(db, logPath));
      } catch (err: any) {
        const isOfflineErr = checkIsOfflineError(err);
        if (isOfflineErr) {
          console.warn("Firestore is offline, deletion queued in local database cache:", err);
        } else {
          handleFirestoreError(err, OperationType.DELETE, logPath);
        }
      }
    }
  };
 
  const handleSettingsUpdate = async (updatedSettings: OvertimeSettings) => {
    setSettings(updatedSettings);
    
    // Save to isolated user-specific key
    const settingsKey = user ? `catat_lembur_settings_${user.uid}` : "catat_lembur_settings_guest";
    localStorage.setItem(settingsKey, JSON.stringify(updatedSettings));
 
    if (user) {
      const configPath = `users/${user.uid}/settings/config`;
      try {
        await setDoc(doc(db, configPath), updatedSettings);
      } catch (err: any) {
        const isOfflineErr = checkIsOfflineError(err);
        if (isOfflineErr) {
          console.warn("Firestore is offline, settings update queued in local database cache:", err);
        } else {
          handleFirestoreError(err, OperationType.WRITE, configPath);
        }
      }
    }
  };

  const handleAddSigner = async (newSignerData: Omit<Signer, "id" | "createdAt">) => {
    const freshSigner: Signer = {
      ...newSignerData,
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedSigners = [...signers, freshSigner];
    setSigners(updatedSigners);
    
    const signersKey = user ? `catat_lembur_signers_${user.uid}` : "catat_lembur_signers_guest";
    localStorage.setItem(signersKey, JSON.stringify(updatedSigners));
    
    if (user) {
      const path = `users/${user.uid}/signers/${freshSigner.id}`;
      try {
        await setDoc(doc(db, path), freshSigner);
      } catch (err: any) {
        const isOfflineErr = checkIsOfflineError(err);
        if (isOfflineErr) {
          console.warn("Firestore is offline, adding signer queued in local database cache:", err);
        } else {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
      }
    }
  };

  const handleDeleteSigner = async (id: string) => {
    const updated = signers.filter((s) => s.id !== id);
    setSigners(updated);
    
    const signersKey = user ? `catat_lembur_signers_${user.uid}` : "catat_lembur_signers_guest";
    localStorage.setItem(signersKey, JSON.stringify(updated));
    
    if (user) {
      const path = `users/${user.uid}/signers/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (err: any) {
        const isOfflineErr = checkIsOfflineError(err);
        if (isOfflineErr) {
          console.warn("Firestore is offline, deleting signer queued in local database cache:", err);
        } else {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
      }
    }
  };

  const handleResetSigners = async () => {
    setSigners(DEFAULT_SIGNERS);
    
    const signersKey = user ? `catat_lembur_signers_${user.uid}` : "catat_lembur_signers_guest";
    localStorage.setItem(signersKey, JSON.stringify(DEFAULT_SIGNERS));
    
    if (user) {
      const batch = writeBatch(db);
      // Delete current local signers from firestore
      signers.forEach((sig) => {
        batch.delete(doc(db, `users/${user.uid}/signers/${sig.id}`));
      });
      // Add default signers
      DEFAULT_SIGNERS.forEach((sig) => {
        batch.set(doc(db, `users/${user.uid}/signers/${sig.id}`), sig);
      });
      try {
        await batch.commit();
      } catch (err: any) {
        const isOfflineErr = checkIsOfflineError(err);
        if (isOfflineErr) {
          console.warn("Firestore is offline, resetting signers queued in local cache:", err);
        } else {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/signers`);
        }
      }
    }
  };

  const handleSignInGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Manual Sign-in Popup Error:", err);
      
      const currentDomain = window.location.hostname;
      if (err?.code === "auth/unauthorized-domain" || err?.message?.includes("unauthorized-domain")) {
        setAuthError(
          `Domain belum diotorisasi di Google Firebase Console Anda!\n\n` +
          `👉 LANGKAH SOLUSI INSTAN:\n` +
          `1. Buka Firebase Console Anda di: https://console.firebase.google.com/\n` +
          `2. Masuk ke proyek "${auth.app.options.projectId || "otwm-872e0"}"\n` +
          `3. Buka menu samping Build > Authentication > klik tab Settings > pilih sub-menu "Authorized domains" (Domain terotorisasi)\n` +
          `4. Klik tombol "Add domain" (Tambah domain) dan masukkan domain berikut:\n` +
          `   • ${currentDomain}\n` +
          `   • (Masukkan juga domain Netlify Anda nanti agar bisa login dari Netlify!)\n` +
          `5. Klik "Add" untuk menyimpan, tunggu 1-2 menit agar Google menyinkronkan perubahan, kemudian silakan segarkan (refresh) halaman ini dan coba hubungkan lagi!`
        );
      } else if (err?.message?.includes("popup-closed-by-user") || err?.code?.includes("popup-closed-by-user")) {
        setAuthError("Sesi masuk dibatalkan. Jendela popup ditutup oleh pengguna sebelum proses masuk selesai.");
      } else {
        setAuthError(
          `Gagal menyambungkan ke Google.\n` +
          `Pesan Error: ${err?.message || "Kesalahan tidak dikenal."}\n\n` +
          `Tips: Pastikan koneksi internet stabil dan pop-up tidak diblokir oleh browser.`
        );
      }
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Profile editing mode
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileName, setTempProfileName] = useState(settings.employeeName);
  const [tempProfileDept, setTempProfileDept] = useState(settings.department);

  // Sync state for temp names when settings are loaded/refetched
  useEffect(() => {
    setTempProfileName(settings.employeeName);
    setTempProfileDept(settings.department);
  }, [settings]);

  const saveProfileSettings = () => {
    const newSets = {
      ...settings,
      employeeName: tempProfileName.trim() || "User",
      department: tempProfileDept.trim() || "Staf",
    };
    handleSettingsUpdate(newSets);
    setIsEditingProfile(false);
  };

  const handleSelectDayFromGrid = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsQuickFormOpen(true);
  };

  // 1. Splash Screen Gate
  if (showSplash) {
    return (
      <div className="min-h-screen bg-[#04060b] flex flex-col items-center justify-center text-slate-100 font-sans select-none relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-indigo-500/15 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="flex flex-col items-center max-w-sm px-6 text-center z-10 space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 to-emerald-500 blur-md opacity-30 animate-pulse duration-1000"></div>
            <img 
              src="/icon-512.png" 
              alt="OTW Logo" 
              className="relative w-28 h-28 rounded-3xl shadow-2xl border border-indigo-500/20 object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="space-y-2">
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-100"
            >
              OTW
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xs font-semibold tracking-widest text-indigo-400 uppercase font-mono"
            >
              Overtime Work Management
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col items-center gap-1.5 pt-8"
          >
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              {isAuthLoading ? "Menghubungkan secure cloud..." : "Mengunduh sesi kerja..."}
            </span>
          </motion.div>
        </div>
      </div>
    );
  }

  // 2. Welcome & Google Cloud Database Authentication Gate
  if (!user && !bypassedLogin) {
    return (
      <div className="min-h-screen bg-[#04060b] flex flex-col justify-center items-center text-slate-100 font-sans relative px-4 overflow-hidden py-12">
        {/* Background Mesh Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 rounded-full blur-[140px] pointer-events-none -z-10"></div>
        <div className="absolute -top-40 -left-40 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <div className="w-full max-w-lg space-y-8 relative z-10">
          
          {/* Logo and Greeting Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-indigo-500 to-emerald-500 blur-md opacity-25 animate-pulse"></div>
              <img 
                src="/icon-512.png" 
                alt="OTW Logo" 
                className="relative w-20 h-20 rounded-3xl border border-indigo-500/10 shadow-xl object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="space-y-1">
              <span className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                OTW <span className="text-[10px] font-mono text-indigo-400 font-black tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">SYSTEM</span>
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
                Over Time Work - management system
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 text-center leading-relaxed">
                Platform pencatatan jam lembur terintegrasi Google Cloud & Smart AI Parsing untuk kenyamanan kerja nyata.
              </p>
            </div>
          </div>

          {/* Central Welcome Card */}
          <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>

            {/* Core Features list */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono text-center border-b border-white/5 pb-2">
                ⚡ FITUR UTAMA OTW
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 bg-indigo-500/15 text-indigo-300 rounded-lg shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-200">Asisten AI Pintar</strong>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Ketik bebas laporan harian, AI hitung jam & ketekunan otomatis.</p>
                  </div>
                </div>
                
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 bg-indigo-500/15 text-indigo-300 rounded-lg shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-200">Timer StopWatch Instan</strong>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Nyalakan stopwatch lembur sekali sentuh untuk ketelitian rill.</p>
                  </div>
                </div>
                
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 bg-indigo-500/15 text-indigo-300 rounded-lg shrink-0 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-200">Visualisasi Heatmap</strong>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Kalender kontribusi warna interaktif untuk konsistensi kerja Anda.</p>
                  </div>
                </div>
                
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 bg-indigo-500/15 text-indigo-300 rounded-lg shrink-0 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-200">Rincian & Gaji Bulanan</strong>
                    <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Skema multiplier (Hidup/Mati) & target jam kerja terkalibrasi.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign in and offline paths */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              
              {authError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs p-4 rounded-xl flex items-start gap-2.5 whitespace-pre-line leading-relaxed text-left w-full shadow-lg">
                  <div className="shrink-0 mt-0.5">⚠️</div>
                  <div className="flex-1">{authError}</div>
                </div>
              )}

              <button
                onClick={handleSignInGoogle}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer text-center"
              >
                <Cloud className="w-4 h-4 animate-bounce" />
                Sambungkan Database Google (Firestore)
              </button>

              <div className="flex items-center justify-center gap-2">
                <span className="h-px bg-white/10 flex-1"></span>
                <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">ATAU</span>
                <span className="h-px bg-white/10 flex-1"></span>
              </div>

              <button
                onClick={() => setBypassedLogin(true)}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-slate-300 hover:text-white font-semibold text-xs border border-white/10 hover:border-white/15 rounded-xl transition-all cursor-pointer text-center"
              >
                Lanjutkan Offline (Mode Simulasi Lokal)
              </button>
            </div>
          </div>

          {/* Secure Firebase Status */}
          <div className="text-center text-[10px] text-slate-500 font-mono tracking-wide">
            Powered by Google Cloud Firebase Secure Storage Node
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060b] text-slate-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-300 pb-20 relative">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      {/* Navigation Header */}
      <header className="border-b border-white/10 bg-[#0f172a]/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 blur-sm opacity-25"></div>
              <img 
                src="/icon-192.png" 
                alt="OTW Logo" 
                className="relative w-9 h-9 rounded-xl border border-indigo-500/10 object-cover shadow-md shadow-indigo-500/10"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-emerald-300">
                OTW
              </span>
              <p className="text-[9px] font-mono text-slate-400 mt-0.5 uppercase tracking-wider font-extrabold">OVERTIME WORK MANAGEMENT</p>
            </div>
          </div>

          {/* User profile widget detail & Google Cloud active sync controls */}
          <div className="flex items-center gap-3">
            {isAuthLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-xs text-slate-400 font-mono">Memeriksa cloud...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Unified profile & signers modal hook button */}
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] sm:text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-slate-200 hover:text-white"
                  title="Atur Nama Lengkap, Nomor Karyawan, dan Daftar Penandatangan Resmi"
                >
                  <span>👤 Profil & database TTD</span>
                </button>

                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || "User avatar"} 
                          className="h-8.5 w-8.5 rounded-full border border-indigo-500/30 object-cover shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-8.5 w-8.5 rounded-full bg-indigo-500/10 border border-indigo-400/35 flex items-center justify-center font-bold text-xs text-indigo-300 font-mono shadow-sm">
                          {settings.employeeName.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-slate-950 p-[2px] rounded-full border border-slate-950 text-[6px]" title="Cloud Synced">
                        <Check className="w-2 h-2 text-slate-950" />
                      </span>
                    </div>

                    <button
                      onClick={handleSignOut}
                      title="Keluar / Putuskan Koneksi"
                      className="p-1.5 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/10 hover:border-red-500/20 rounded-xl transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 animate-pulse" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSignInGoogle}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-[11px] sm:text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                    title="Masuk dengan Google untuk sinkronisasi database awan"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hubungkan Cloud</span>
                    <span className="inline sm:hidden">Cloud</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Body Grid Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {/* Compact Greeting Header */}
        <div id="greeting-header" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b border-white/5 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 font-sans tracking-tight animate-fade-in">
              Selamat datang kembali, {settings.employeeName}! 👋
            </h1>
            <p className="text-xs text-slate-400">
              Kelola rincian gaji, waktu, dan aktivitas lembur Anda dengan praktis dan ringkas.
            </p>
          </div>
          {/* Active Timer Floating Notification Badge if timer is currently running */}
          {isTimerRunning && (
            <button
              onClick={() => setIsTimerModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-semibold rounded-xl flex items-center gap-2 animate-pulse cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              ⏱️ Lembur Anda Sedang Aktif Berjalan!
            </button>
          )}
        </div>

        {/* Interactive Quick Help & FAQ Guide Box */}
        {showGuide && (
          <div className="bg-slate-900/50 border border-indigo-500/15 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3 text-slate-200">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15 shrink-0 mt-0.5">
                  <span className="text-sm">💡</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                    Pusat Informasi & Petunjuk Cepat Aplikasi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300 leading-relaxed pt-1">
                    <div className="space-y-1.5 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="font-bold text-indigo-400 flex items-center gap-1">
                        📥 1. Unduh File Lembur (SPL)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Klik tab <b>"Riwayat & Analitik"</b> di bawah. Pada list aktivitas lembur Anda, klik tombol <b>"Unduh SPL"</b> di log mana pun untuk mengunduh dokumen Word (.doc) atau cetak PDF resmi lengkap dengan rincian TTD supervisor.
                      </p>
                    </div>
                    <div className="space-y-1.5 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="font-bold text-indigo-400 flex items-center gap-1">
                        👤 2. Lihat & Atur Profil Anda
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Klik tombol <b>"👤 Profil & database TTD"</b> di pojok kanan atas layar (header). Di sana Anda dapat mengatur Nama, NIK/Badge, Departemen, Tarif per Jam, serta menambah/mengedit daftar Supervisor penandatangan.
                      </p>
                    </div>
                    <div className="space-y-1.5 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <p className="font-bold text-indigo-400 flex items-center gap-1">
                        📅 3. Sinkronisasi Kalender
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Kalender default sekarang <b>selalu otomatis mengikuti bulan berjalan</b> saat ini (Juni 2026). Jika Anda menambahkan lembur baru, kalender akan langsung menyelaraskan tampilannya ke bulan lembur yang bersangkutan.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-500 hover:text-slate-300 font-mono px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer text-[10px] shrink-0 transition-all"
                title="Sembunyikan Panduan"
              >
                Sembunyikan ✕
              </button>
            </div>
          </div>
        )}

        {/* Auth Error Toast/Banner */}
        {authError && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-300 text-xs font-medium px-5 py-4 rounded-2xl flex items-start justify-between gap-4 shadow-md whitespace-pre-line leading-relaxed">
            <div className="flex gap-2.5">
              <span className="shrink-0">⚠️</span>
              <span>{authError}</span>
            </div>
            <button 
              onClick={() => setAuthError(null)} 
              className="text-red-400 hover:text-white font-mono px-2 py-0.5 bg-red-500/15 rounded-md cursor-pointer text-[10px] shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Database Status Informational Card */}
        {!user && !isAuthLoading && (
          <div className="relative overflow-hidden bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center shadow-lg hover:border-indigo-505/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex gap-3 text-slate-200">
              <Cloud className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs leading-relaxed max-w-2xl">
                <p className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
                  ☁️ Mode Simulasi / Penyimpanan Lokal Aktif
                </p>
                <p className="text-slate-400 mt-1">
                  Data lembur Anda saat ini hanya tersimpan secara lokal di browser Anda. Hubungkan ke database <b>Firebase Firestore</b> (menggunakan Google Sign-In) untuk mengamankan riwayat lembur secara permanen dan menyinkronkan data Anda secara real-time di semua perangkat.
                </p>
              </div>
            </div>
            <button
              onClick={handleSignInGoogle}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 shrink-0 w-full sm:w-auto text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Cloud className="w-3.5 h-3.5" />
              Sambungkan ke Cloud
            </button>
          </div>
        )}

        {/* Active Cloud Sync Toast Banner */}
        {user && (
          <div className="bg-emerald-950/20 border border-emerald-500/15 rounded-2xl p-3 px-4 flex justify-between items-center text-xs text-slate-300 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Sesi Sinkronisasi Cloud aktif dengan akun Google: <strong className="text-emerald-300 font-mono text-[11px] ml-0.5 font-bold">{user.email}</strong>. Data Anda aman tersimpan di Firestore.</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md hidden md:inline-block font-bold">TERKONEKSI</span>
          </div>
        )}

        {/* Navigation Tabs (Dashboard & Controller views) */}
        <div className="flex backdrop-blur-xl bg-white/5 border border-white/10 p-1 rounded-2xl max-w-sm">
          <button
            onClick={() => setActiveTab("input")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "input"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-slate-100 font-bold shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Clock className="w-4 h-4" />
            Metode Pencatatan
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "stats"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-slate-100 font-bold shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Rincian & Gaji
          </button>
        </div>

        {/* Tab View Wrapper Animations */}
        <AnimatePresence mode="wait">
          {activeTab === "input" ? (
            <motion.div
              key="input-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Sebaris Kecil Tombol Pencatatan / Wizard Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setIsAIModalOpen(true)}
                  id="btn-ai-modal"
                  className="group relative overflow-hidden backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] text-left cursor-pointer shadow-sm text-slate-200"
                >
                  <div className="p-2 bg-indigo-500/15 text-indigo-300 rounded-lg group-hover:bg-indigo-500/25 group-hover:text-indigo-200 transition-all shrink-0">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-200 block group-hover:text-white transition-all leading-tight">
                      Pencatatan AI (Ketik Bebas)
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">Gemini mendeteksi jam & lokasi</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTimerModalOpen(true)}
                  id="btn-timer-modal"
                  className={`group relative overflow-hidden backdrop-blur-xl border rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] text-left cursor-pointer shadow-sm ${
                    isTimerRunning 
                      ? "bg-emerald-950/20 hover:bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-300" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-indigo-500/41 text-slate-200"
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-all shrink-0 ${
                    isTimerRunning 
                      ? "bg-emerald-500/20 text-emerald-300 animate-pulse" 
                      : "bg-indigo-500/15 text-indigo-300 group-hover:bg-indigo-500/25 group-hover:text-indigo-200"
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-200 block group-hover:text-white transition-all leading-tight">
                      Timer Instan Lembur
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                      {isTimerRunning ? "⏱️ Sedang Berjalan" : "Stopwatch realtime otomatis"}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuickFormOpen(true)}
                  id="btn-manual-modal"
                  className="group relative overflow-hidden backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] text-left cursor-pointer shadow-sm text-slate-200"
                >
                  <div className="p-2 bg-indigo-500/15 text-indigo-300 rounded-lg group-hover:bg-indigo-500/25 group-hover:text-indigo-200 transition-all shrink-0">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-200 block group-hover:text-white transition-all leading-tight">
                      Isi Manual & Kalender Wizard
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">Form rincian detail lengkap & sub-plant</span>
                  </div>
                </button>
              </div>

              {/* Majestic Main Journal History Monthly Calendar view is front-and-center */}
              <LogHistory
                logs={logs}
                onLogDelete={handleLogDelete}
                selectedDate={selectedDate}
                defaultMode="calendar"
                settings={settings}
                signers={signers}
              />
            </motion.div>
          ) : (
            <motion.div
              key="stats-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Analysis Stat Bento Grid Cards */}
              <OvertimeAnalytics
                logs={logs}
                settings={settings}
                onSettingsChange={handleSettingsUpdate}
                onOpenProfile={() => setIsProfileModalOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Modal Dialog: AI Parser */}
        {isAIModalOpen && (
          <div id="modal-ai-parser" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsAIModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
            <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative z-10 animate-fade-in custom-scroll max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-100 font-sans tracking-tight">Pencatatan AI Pintar</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAIModalOpen(false)}
                  className="text-slate-400 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-all font-mono cursor-pointer"
                >
                  Tutup ✕
                </button>
              </div>
              <AIParsingBox onLogAdd={(l) => { handleLogAdd(l); setIsAIModalOpen(false); }} />
            </div>
          </div>
        )}

        {/* 2. Modal Dialog: stopwatch timer */}
        {isTimerModalOpen && (
          <div id="modal-timer" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsTimerModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
            <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 animate-fade-in">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-100 font-sans tracking-tight">Stopwatch Timer Instant</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTimerModalOpen(false)}
                  className="text-slate-400 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-all font-mono cursor-pointer"
                >
                  Tutup ✕
                </button>
              </div>
              <ActiveTimer onLogAdd={handleLogAdd} onTimerRunningChange={setIsTimerRunning} />
            </div>
          </div>
        )}

        {/* 3. Modal Dialog: Manual Form Wizard (includes Calendar and Form) */}
        {isQuickFormOpen && (
          <div id="modal-quick-form" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setIsQuickFormOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
            <div className="relative bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-5xl p-6 shadow-2xl relative z-10 animate-fade-in max-h-[85vh] overflow-y-auto custom-scroll">
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-sans tracking-tight leading-none mb-1">Pencatatan Manual Wizard</h3>
                    <p className="text-[10px] text-slate-400">Pilih hari pada grid kalender kiri, lalu isi formulir di kanan.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickFormOpen(false)}
                  className="text-slate-400 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-all font-mono cursor-pointer"
                >
                  Tutup ✕
                </button>
              </div>
              
              <HeatmapCalendar
                logs={logs}
                onLogAdd={handleLogAdd}
                onSelectDay={setSelectedDate}
                selectedDate={selectedDate}
                onCloseForm={() => setIsQuickFormOpen(false)}
                settings={settings}
                signers={signers}
              />
            </div>
          </div>
        )}

        {/* 4. Modal Dialog: Profile & Signers Database Manager */}
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          settings={settings}
          onSettingsUpdate={handleSettingsUpdate}
          signers={signers}
          onAddSigner={handleAddSigner}
          onDeleteSigner={handleDeleteSigner}
          onResetSigners={handleResetSigners}
        />

        {/* Subtle spacing divider at bottom */}
        <div className="pt-4 border-t border-white/5"></div>

      </main>

      {/* Footer footer information credit line */}
      <footer className="mt-24 border-t border-white/5 py-8 text-center text-[10px] text-slate-500 font-sans tracking-wide space-y-1">
        <p className="text-slate-400">&copy; OTW (Overtime Work Management) — Dioptimalkan penuh untuk kenyamanan pencatatan di mobile / laptop secara instan.</p>
        <p className="text-[9px] text-slate-500 font-mono">Ditenagai oleh Kecerdasan Buatan Gemini 3.5 & Visualisasi Interaktif @google/genai</p>
      </footer>
    </div>
  );
}

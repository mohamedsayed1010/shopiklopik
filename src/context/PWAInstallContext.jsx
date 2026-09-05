import { createContext, useEffect, useState } from "react";

export const PWAInstallContext = createContext();

export default function PWAInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler
      );
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } =
      await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const openModal = () => setModalOpen(true);

  const closeModal = () => setModalOpen(false);

  return (
    <PWAInstallContext.Provider
      value={{
        installApp,
        canInstall: !!deferredPrompt,
        isIOS,
        isStandalone,

        modalOpen,
        openModal,
        closeModal,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}
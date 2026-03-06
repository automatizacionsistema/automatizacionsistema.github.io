export function useToast() {
  function toast(message) {
    if (typeof window !== "undefined") {
      window.alert(message);
    }
  }

  return { toast };
}
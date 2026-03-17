import { useEffect, useMemo, useState } from 'react';

export function useResendCooldown(defaultSeconds = 30) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) return 0;
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const isCoolingDown = secondsLeft > 0;

  const resendLabel = useMemo(() => {
    if (!isCoolingDown) return 'Resend code';
    return `Resend in ${secondsLeft}s`;
  }, [isCoolingDown, secondsLeft]);

  const startCooldown = (seconds = defaultSeconds) => {
    setSecondsLeft(seconds);
  };

  return {
    secondsLeft,
    isCoolingDown,
    resendLabel,
    startCooldown,
  };
}
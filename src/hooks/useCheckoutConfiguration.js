import { useCallback, useEffect, useState } from "react";
import { getSafeErrorMessage } from "../helpers/api";
import { obtenerConfiguracionCheckout } from "../helpers/checkout";

export const useCheckoutConfiguration = ({ enabled = true } = {}) => {
  const [requestKey, setRequestKey] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    configuration: null,
    error: "",
  });

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();

    obtenerConfiguracionCheckout({ signal: controller.signal })
      .then((configuration) => {
        if (!controller.signal.aborted) {
          setState({ status: "success", configuration, error: "" });
        }
      })
      .catch((error) => {
        if (error?.name !== "AbortError" && !controller.signal.aborted) {
          setState({
            status: "error",
            configuration: null,
            error: getSafeErrorMessage(
              error,
              "No pudimos obtener las opciones de entrega.",
            ),
          });
        }
      });

    return () => controller.abort();
  }, [enabled, requestKey]);

  const retry = useCallback(() => {
    setState({ status: "loading", configuration: null, error: "" });
    setRequestKey((value) => value + 1);
  }, []);

  return { ...state, retry };
};

import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import routes from './routes'

startTransition(() => {
  hydrateRoot(
    document,
    /*<StrictMode>
      <HydratedRouter />
    </StrictMode>*/
    <HydratedRouter routes={routes}/>
  );
});

import React from "react";
import { useAppSelector } from "../shared/store";
import ConfigurationModal from "../shared/components/ConfigurationModal";
import Panel from "./components/Panel/Panel";

function App() {
  const { openRouterConfig } = useAppSelector(state => state.legalAgent);

  return (
    <>
      {!openRouterConfig && <ConfigurationModal />}
      <Panel />
    </>
  );
}

export default App;

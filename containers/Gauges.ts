import { createContainer } from "unstated-next";

import { useFetchGauges } from "./Gauges/useFetchGauges";
import { useWithReward } from "./Gauges/useWithReward";
import { useUniV2Apy } from "./Gauges/useUniV2Apy";
import { useJarGaugeApy } from "./Gauges/useJarGaugeApy";
import { FarmInfo } from "./Farms";

interface IGaugeInfo {
  [key: string]: { tokenName: string; poolName: string };
}

export const GaugeInfo = FarmInfo;

function useGauges() {
  const { rawGauges } = useFetchGauges();
  const { gaugesWithReward } = useWithReward(rawGauges);
  const { uniV2GaugesWithApy } = useUniV2Apy(gaugesWithReward);
  const { jarGaugeWithApy } = useJarGaugeApy(gaugesWithReward);

  
  const uniGauges = uniV2GaugesWithApy?.map((gauge) => {
    console.log(gauge.token);
    const { tokenName, poolName } = GaugeInfo[gauge.token];
    return {
      ...gauge,
      tokenName,
      poolName,
    };
  });
  
  const jarGauges = jarGaugeWithApy?.map((gauge) => {
    const { tokenName, poolName } = GaugeInfo[gauge.token];
    return {
      ...gauge,
      tokenName,
      poolName,
    };
  });
  
  const gauges = uniGauges && jarGauges ? [...uniGauges, ...jarGauges] : null
  console.log("All gauges", gauges);
  return {
    gauges,
  };
}

export const Gauges = createContainer(useGauges);

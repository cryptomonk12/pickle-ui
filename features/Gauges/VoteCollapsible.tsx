import { ethers } from "ethers";
import styled from "styled-components";
import { useState, FC, useEffect, useRef } from "react";
import { Button, Grid, Spacer, Select, Checkbox } from "@geist-ui/react";
import { formatEther } from "ethers/lib/utils";
import {
  JAR_GAUGE_MAP,
  PICKLE_ETH_GAUGE,
} from "../../containers/Gauges/gauges";
import { TransactionStatus, useGaugeProxy } from "../../hooks/useGaugeProxy";
import { PercentageInput } from "../../components/PercentageInput";
import { UserGaugeData, UserGauges } from "../../containers/UserGauges";
import { FARM_LP_TO_ICON as GAUGE_LP_TO_ICON } from "../Farms/FarmCollapsible";
import { Dill, UseDillOutput } from "../../containers/Dill";
import { LpIcon, TokenIcon } from "../../components/TokenIcon";
import Collapse from "../Collapsible/Collapse";
import { isArray } from "util";
import { pickleWhite } from "../../util/constants";

interface Weights {
  [key: string]: number;
}

const Label = styled.div`
  font-family: "Source Sans Pro";
`;

interface DataProps {
  isZero?: boolean;
}

const Data = styled.div<DataProps>`
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${(props) => (props.isZero ? "#444" : "unset")};
`;

const formatPercent = (decimal: number) => {
  if (decimal) {
    return (decimal * 100).toFixed(2);
  }
};

export const VoteCollapsible: FC<{ gauges: UserGaugeData[] }> = ({
  gauges,
}) => {
  const { balance: dillBalanceBN } = Dill.useContainer();
  const [votingFarms, setVotingFarms] = useState();
  const [voteWeights, setVoteWeights] = useState<Weights>({});
  const [newWeights, setNewWeights] = useState();
  const { status: voteTxStatus, vote } = useGaugeProxy();
  let titleRef = useRef();

  let totalGaugeWeight = 0;
  for (let i = 0; i < gauges?.length; i++) {
    totalGaugeWeight += voteWeights[gauges[i].address] || 0;
  }

  const weightsValid = totalGaugeWeight === 100;

  if (!gauges) {
    return null;
  }

  const renderSelectOptions = (gauge: UserGaugeData) => (
    <Select.Option
      style={{ color: pickleWhite }}
      value={gauge.depositTokenName}
    >
      {gauge.depositTokenName}
    </Select.Option>
  );

  const handleSelect = (depositTokens: string | string[]) => {
    titleRef.current.click(); // hack to get select to close
    const selectedFarms = isArray(depositTokens)
      ? depositTokens.map((x) => gauges.find((y) => y.depositTokenName === x))
      : null;

    setVotingFarms(selectedFarms);
  };

  const handleBoost = () => {
    const tokens: string[] = [];
    const weights: number[] = [];

    if (!gauges || !weightsValid) return;
    for (let i = 0; i < gauges.length; i++) {
      tokens.push(gauges[i].depositToken.address);
      weights.push(voteWeights[gauges[i].address]);
    }

    vote(tokens, weights);
  };

  const calculateNewWeights = () => {
    console.log("active gauges", gauges);
    if (weightsValid) {
      const voteArray = Object.entries(voteWeights).map((e) => ({
        [e[0]]: e[1],
      }));
      const newWeights = voteArray.map((x) => {
        const gaugeAddress = Object.keys(x)[0];
        const gauge = gauges.find((gauge) => gauge.address === gaugeAddress);
        if (gauge && dillBalanceBN) {
          const dillBalance = +dillBalanceBN.toString();
          // Revise user's weight distribution for new estimate
          const estimatedWeight =
            (gauge.gaugeWeight -
              gauge.userWeight +
              (dillBalance * Object.values(x)[0]) / 100) /
            (gauge.totalWeight - gauge.userCurrentWeights + dillBalance);

          console.log(`gauge: ${gauge.poolName}`,
            gauge.gaugeWeight,
            gauge.userWeight,
            +dillBalance.toString(),
            Object.values(x)[0],
            gauge.totalWeight,
            gauge.userCurrentWeights,
          );
          return { [gauge.address]: estimatedWeight };
        } else {
          return null;
        }
      });
      setNewWeights(newWeights);
    }
  };

  const initializeVoteWeights = async () => {
    gauges.forEach((gauge) => {
      setVoteWeights({
        ...voteWeights,
        [gauge.address]: 0,
      });
    });
  };

  useEffect(() => {
    initializeVoteWeights();
  }, []);

  const renderVotingOption = (gauge: UserGaugeData) => {
    const {
      poolName,
      depositToken,
      depositTokenName,
      apy,
      allocPoint,
      address,
    } = gauge;
    const newWeight = newWeights
      ? newWeights.find((x: UserGaugeData) => x[address])[address]
      : null;

    return (
      <>
        <Grid xs={24} sm={12} md={6} lg={6}>
          <TokenIcon
            src={
              GAUGE_LP_TO_ICON[
                depositToken.address as keyof typeof GAUGE_LP_TO_ICON
              ]
            }
          />
          <div style={{ width: "100%" }}>
            <div style={{ fontSize: `1rem` }}>{poolName}</div>
            <Label style={{ fontSize: `1rem` }}>{depositTokenName}</Label>
          </div>
        </Grid>
        <Grid xs={24} sm={4} md={4} lg={4} css={{ textAlign: "center" }}>
          <Data isZero={apy === 0}>{formatPercent(apy)}%</Data>
          <Label>Base PICKLE APY</Label>
        </Grid>
        <Grid xs={24} sm={4} md={4} lg={4} css={{ textAlign: "center" }}>
          <Data isZero={apy === 0}>{formatPercent(apy * 2.5)}%</Data>
          <Label>Max PICKLE APY</Label>
        </Grid>
        <Grid xs={24} sm={6} md={6} lg={6} css={{ textAlign: "center" }}>
          <Data isZero={allocPoint === 0}>
            {formatPercent(allocPoint)}%{" "}
            {newWeight ? `-> ${formatPercent(newWeight)}%` : null}
          </Data>
          <Label>Current reward weight</Label>
        </Grid>
        <Grid xs={24} sm={4} md={4} lg={4} css={{ textAlign: "right" }}>
          <PercentageInput
            placeholder="0%"
            css={{
              width: "60px !important",
              minWidth: 0,
              marginLeft: 30,
            }}
            value={
              voteWeights[gauge.address] ? voteWeights[gauge.address] : null
            }
            onValueChange={({ floatValue }) => {
              setVoteWeights({
                ...voteWeights,
                [gauge.address]: floatValue,
              });
            }}
          />
        </Grid>
      </>
    );
  };

  return (
    <Collapse
      style={{ borderWidth: "1px", boxShadow: "none", flex: 1 }}
      shadow
      preview={
        <div>
          Select which farms to allocate PICKLE rewards to using your DILL
          balance
        </div>
      }
    >
      <Spacer y={1} />
      <Select
        placeholder="Select farms to boost"
        multiple
        width="100%"
        onChange={(value) => handleSelect(value)}
      >
        {gauges.map(renderSelectOptions)}
      </Select>
      <Spacer y={0.5} />
      <h3 ref={titleRef}>Selected Farms</h3>
      {votingFarms?.length ? (
        <>
          <Grid.Container gap={1}>
            {votingFarms.map(renderVotingOption)}
          </Grid.Container>
          <Spacer y={1} />
          <Grid.Container gap={2}>
            <Grid xs={24} md={12}>
              <Button
                disabled={
                  !weightsValid || voteTxStatus === TransactionStatus.Pending
                }
                onClick={() => calculateNewWeights()}
                style={{ width: "100%" }}
              >
                {weightsValid
                  ? "Estimate new weights"
                  : "Estimate (weights must total 100%)"}
              </Button>
            </Grid>
            <Grid xs={24} md={12}>
              <Button
                disabled={
                  !weightsValid || voteTxStatus === TransactionStatus.Pending
                }
                onClick={() => handleBoost()}
                style={{ width: "100%" }}
              >
                Submit vote
              </Button>
            </Grid>
          </Grid.Container>
        </>
      ) : (
        "Please select farms from dropdown"
      )}
    </Collapse>
  );
};

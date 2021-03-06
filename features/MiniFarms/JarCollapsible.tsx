import { ethers } from "ethers";
import styled from "styled-components";

import { useState, FC, useEffect, ReactNode } from "react";
import { Button, Link, Input, Grid, Spacer, Tooltip } from "@geist-ui/react";

import { Connection } from "../../containers/Connection";
import { formatEther } from "ethers/lib/utils";
import ReactHtmlParser from "react-html-parser";
import { ERC20Transfer, Status as ERC20TransferStatus } from "../../containers/Erc20Transfer";
import Collapse from "../Collapsible/Collapse";
import { UserJarData } from "../../containers/UserJars";
import { LpIcon, TokenIcon } from "../../components/TokenIcon";
import { getFormatString } from "../Gauges/GaugeInfo";
import { uncompoundAPY } from "util/jars";
import { JarApy } from "./MiniFarmList";
import { useTranslation } from "next-i18next";
import { isUsdcToken } from "containers/Jars/jars";
import { PickleCore } from "containers/Jars/usePickleCore";
import { getRatioStringAndPendingString, RatioAndPendingStrings } from "./JarMiniFarmCollapsible";

interface DataProps {
  isZero?: boolean;
}

const Data = styled.div<DataProps>`
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${(props) => (props.isZero ? "#444" : "unset")};
`;

const Label = styled.div`
  font-family: "Source Sans Pro";
`;
interface ButtonStatus {
  disabled: boolean;
  text: string;
}

const JarName = styled(Grid)({
  display: "flex",
});

// For protocols that share the same deposit token
export const JAR_DEPOSIT_TOKEN_MULTI_FARMS_TO_ICON: {
  [key: string]: { [apiKey: string]: string | ReactNode };
} = {
  // BOO FTM-BOO
  "0xec7178f4c41f346b2721907f5cf7628e388a7a58": {
    "LQDR-BOO-FTM": <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/ftmboo.png"} />,
    "BOO-FTM-BOO": <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmboo.png"} />,
  },
  // BOO FTM-DAI
  "0xe120ffbda0d14f3bb6d6053e90e63c572a66a428": {
    "LQDR-BOO-DAI-FTM": <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/ftmdai.png"} />,
    "BOO-FTM-DAI": <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmdai.png"} />,
  },
  // BOO FTM-USDT
  "0x5965e53aa80a0bcf1cd6dbdd72e6a9b2aa047410": {
    "LQDR-BOO-USDT-FTM": <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/ftmusdt.png"} />,
    "BOO-USDT-FTM": <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmusdt.png"} />,
  },
  // BOO FTM-SUSHI
  "0xf84e313b36e86315af7a06ff26c8b20e9eb443c3": {
    "LQDR-BOO-SUSHI-FTM": (
      <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/ftmsushi.png"} />
    ),
    "BOO-FTM-SUSHI": (
      <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmsushi.png"} />
    ),
  },
  // BOO FTM-MIM
  "0x6f86e65b255c9111109d2d2325ca2dfc82456efc": {
    "LQDR-BOO-MIM-FTM": <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/ftmmim.png"} />,
    "BOO-FTM-MIM": <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmmim.png"} />,
  },
  // BOO FTM-USDC
  "0x2b4c76d0dc16be1c31d4c1dc53bf9b45987fc75c": {
    "LQDR-BOO-USDC-FTM": <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/usdcftm.png"} />,
    "BOO-USDC-FTM": <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/usdcftm.png"} />,
  },
  // BOO FTM-LINK
  "0x89d9bc2f2d091cfbfc31e333d6dc555ddbc2fd29": {
    "LQDR-BOO-LINK-FTM": <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/ftmlink.png"} />,
    "BOO-FTM-LINK": <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmlink.png"} />,
  },
  // BOO FTM
  "0xf0702249f4d3a25cd3ded7859a165693685ab577": {
    "LQDR-BOO-ETH-FTM": <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/ftmeth.png"} />,
    "BOO-FTM-ETH": <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmeth.png"} />,
  },
};
export const JAR_DEPOSIT_TOKEN_TO_ICON: {
  [key: string]: string | ReactNode;
} = {
  // OKEx
  // Please ensure addresses are lowercased
  "0x8e68c0216562bcea5523b27ec6b9b6e1cccbbf88": (
    <LpIcon swapIconSrc={"/cherryswap.png"} tokenIconSrc={"/okex.png"} />
  ),
  "0x089dedbfd12f2ad990c55a2f1061b8ad986bff88": (
    <LpIcon swapIconSrc={"/cherryswap.png"} tokenIconSrc={"/usdt.png"} />
  ),
  "0x407f7a2f61e5bab199f7b9de0ca330527175da93": (
    <LpIcon swapIconSrc={"/cherryswap.png"} tokenIconSrc={"/ethereum.png"} />
  ),
  "0xf3098211d012ff5380a03d80f150ac6e5753caa8": (
    <LpIcon swapIconSrc={"/cherryswap.png"} tokenIconSrc={"/okex.png"} />
  ),
  "0x8009edebbbdeb4a3bb3003c79877fcd98ec7fb45": (
    <LpIcon swapIconSrc={"/jswap.png"} tokenIconSrc={"/usdt.png"} />
  ),
  "0x838a7a7f3e16117763c109d98c79ddcd69f6fd6e": (
    <LpIcon swapIconSrc={"/jswap.png"} tokenIconSrc={"/wbtc.png"} />
  ),
  "0xeb02a695126b998e625394e43dfd26ca4a75ce2b": (
    <LpIcon swapIconSrc={"/jswap.png"} tokenIconSrc={"/weth.png"} />
  ),
  "0xe9313b7dea9cbabd2df710c25bef44a748ab38a9": (
    <LpIcon swapIconSrc={"/jswap.png"} tokenIconSrc={"/dai.png"} />
  ),
  "0xa25e1c05c58ede088159cc3cd24f49445d0be4b2": (
    <LpIcon swapIconSrc={"/jswap.png"} tokenIconSrc={"/usdc.png"} />
  ),

  // Moonriver
  "0x7eda899b3522683636746a2f3a7814e6ffca75e1": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/moonriver.png"} />
  ),
  "0xfe1b71bdaee495dca331d28f5779e87bd32fbe53": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/daiusdc.png"} />
  ),
  "0xe537f70a8b62204832b8ba91940b77d3f79aeb81": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/usdcmovr.png"} />
  ),
  "0xdb66be1005f5fe1d2f486e75ce3c50b52535f886": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/usdc.png"} />
  ),
  "0x2a44696ddc050f14429bd8a4a05c750c6582bf3b": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/usdcusdt.png"} />
  ),
  "0x384704557f73fbfae6e9297fd1e6075fc340dbe5": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/busd.png"} />
  ),
  "0xa0d8dfb2cc9dfe6905edd5b71c56ba92ad09a3dc": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/weth.png"} />
  ),
  "0xfb1d0d6141fc3305c63f189e39cc2f2f7e58f4c2": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/bnb.png"} />
  ),
  "0x83d7a3fc841038e8c8f46e6192bbcca8b19ee4e7": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/wbtc.png"} />
  ),
  "0xb9a61ac826196abc69a3c66ad77c563d6c5bdd7b": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/avax.png"} />
  ),
  "0x55ee073b38bf1069d5f1ed0aa6858062ba42f5a9": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/mimatic.png"} />
  ),
  "0x9051fb701d6d880800e397e5b5d46fddfadc7056": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/mim.webp"} />
  ),
  "0x1eebed8f28a6865a76d91189fd6fc45f4f774d67": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/fantom.png"} />
  ),
  "0x9e0d90ebb44c22303ee3d331c0e4a19667012433": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/relay.png"} />
  ),
  "0xf9b7495b833804e4d894fc5f7b39c10016e0a911": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/rib.png"} />
  ),
  "0x9f9a7a3f8f56afb1a2059dae1e978165816cea44": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/pets.png"} />
  ),
  "0x0acdb54e610dabc82b8fa454b21ad425ae460df9": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/rib.png"} />
  ),
  "0x9432b25fbd8a37e5a1300e36a96bd14e1e6f5c90": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/mim.webp"} />
  ),
  "0x2cc54b4a3878e36e1c754871438113c1117a3ad7": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/frax.webp"} />
  ),
  "0xbe2abe58edaae96b4303f194d2fad5233bad3d87": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/bnb.png"} />
  ),
  "0x0d171b55fc8d3bddf17e376fdb2d90485f900888": (
    <LpIcon swapIconSrc={"/solar.png"} tokenIconSrc={"/weth.png"} />
  ),
  "0xf09211fb5ed5019b072774cfd7db0c9f4ccd5be0": (
    <LpIcon swapIconSrc={"/finn.png"} tokenIconSrc={"/tokens/dotfinn.png"} />
  ),
  "0x14be4d09c5a8237403b83a8a410bace16e8667dc": (
    <LpIcon swapIconSrc={"/finn.png"} tokenIconSrc={"/tokens/finnksm.png"} />
  ),
  "0xd9e98ad7ae9e5612b90cd0bdcd82df4fa5b943b8": (
    <LpIcon swapIconSrc={"/finn.png"} tokenIconSrc={"/tokens/finnrmrk.png"} />
  ),
  "0xbbe2f34367972cb37ae8dea849ae168834440685": (
    <LpIcon swapIconSrc={"/finn.png"} tokenIconSrc={"/tokens/movrfinn.png"} />
  ),
  "0x7128c61da34c27ead5419b8eb50c71ce0b15cd50": (
    <LpIcon swapIconSrc={"/finn.png"} tokenIconSrc={"/usdcmovr.png"} />
  ),

  // Cronos
  "0x1803e360393a472bec6e1a688bdf7048d3076b1a": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/beefy.png"} />
  ),
  "0x3eb9ff92e19b73235a393000c176c8bb150f1b20": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/dai.png"} />
  ),
  "0xc9ea98736dbc94faa91abf9f4ad1eb41e7fb40f4": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/shib.png"} />
  ),
  "0xe61db569e231b3f5530168aa2c9d50246525b6d6": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/cronos.png"} />
  ),
  "0x3d2180db9e1b909f35c398bc39ef36108c0fc8c3": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/cronos.png"} />
  ),
  "0x814920d1b8007207db6cb5a2dd92bf0b082bdba1": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/usdc.png"} />
  ),
  "0x280acad550b2d3ba63c8cbff51b503ea41a1c61b": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/usdt.png"} />
  ),
  "0xbf62c67ea509e86f07c8c69d0286c0636c50270b": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/cronos.png"} />
  ),
  "0x8f09fff247b8fdb80461e5cf5e82dd1ae2ebd6d7": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/wbtc.png"} />
  ),
  "0x39cc0e14795a8e6e9d02a21091b81fe0d61d82f9": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/cronos.png"} />
  ),
  "0xa111c17f8b8303280d3eb01bbcd61000aa7f39f9": (
    <LpIcon swapIconSrc={"/vvs.png"} tokenIconSrc={"/weth.png"} />
  ),

  // Aurora
  "0x20f8aefb5697b77e0bb835a8518be70775cda1b0": (
    <LpIcon swapIconSrc={"/trisolaris.png"} tokenIconSrc={"/nearusdc.png"} />
  ),
  "0x63da4db6ef4e7c62168ab03982399f9588fcd198": (
    <LpIcon swapIconSrc={"/trisolaris.png"} tokenIconSrc={"/neareth.png"} />
  ),
  "0xbc8a244e8fb683ec1fd6f88f3cc6e565082174eb": (
    <LpIcon swapIconSrc={"/trisolaris.png"} tokenIconSrc={"/nearwbtc.png"} />
  ),
  "0x03b666f3488a7992b2385b12df7f35156d7b29cd": (
    <LpIcon swapIconSrc={"/trisolaris.png"} tokenIconSrc={"/nearusdt.png"} />
  ),
  "0x84b123875f0f36b966d0b6ca14b31121bd9676ad": (
    <LpIcon swapIconSrc={"/trisolaris.png"} tokenIconSrc={"/near.png"} />
  ),
  "0x2fe064b6c7d274082aa5d2624709bc9ae7d16c77": (
    <LpIcon swapIconSrc={"/trisolaris.png"} tokenIconSrc={"/usdcusdt.png"} />
  ),
  "0xd1654a7713617d41a8c9530fb9b948d00e162194": (
    <LpIcon swapIconSrc={"/trisolaris.png"} tokenIconSrc={"/auroratri.png"} />
  ),
  "0x5eec60f348cb1d661e4a5122cf4638c7db7a886e": (
    <LpIcon swapIconSrc={"/trisolaris.png"} tokenIconSrc={"/auroraeth.png"} />
  ),
  "0xbf9eef63139b67fd0abf22bd5504acb0519a4212": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/near.png"} />
  ),
  "0xca461686c711aeaadf0b516f9c2ad9d9b645a940": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/usdt.png"} />
  ),
  "0x523fae29d7ff6fd38842c8f271edf2ebd3150435": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/usdc.png"} />
  ),
  "0x7e9ea10e5984a09d19d05f31ca3cb65bb7df359d": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/auroranear.png"} />
  ),
  "0x2e02bea8e9118f7d2ccada1d402286cc6d54bd67": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/nearusdt.png"} />
  ),
  "0xbf560771b6002a58477efbcdd6774a5a1947587b": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/nearusdc.png"} />
  ),
  "0xbf58062d23f869a90c6eb04b9655f0dfca345947": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/nearwbtc.png"} />
  ),
  "0xe6c47b036f6fd0684b109b484ac46094e633af2e": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/neardai.png"} />
  ),
  "0x256d03607eee0156b8a2ab84da1d5b283219fe97": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/neareth.png"} />
  ),
  "0xf56997948d4235514dcc50fc0ea7c0e110ec255d": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/ethbtc.png"} />
  ),
  "0x3502eac6fa27beebdc5cd3615b7cb0784b0ce48f": (
    <LpIcon swapIconSrc={"/wanna.png"} tokenIconSrc={"/usdcusdt.png"} />
  ),

  "0xa188d79d6bdbc1120a662de9eb72384e238af104": (
    <LpIcon swapIconSrc={"/nearpad.png"} tokenIconSrc={"/nearwbtc.png"} />
  ),
  "0x73155e476d6b857fe7722aefebad50f9f8bd0b38": (
    <LpIcon swapIconSrc={"/nearpad.png"} tokenIconSrc={"/usdc.png"} />
  ),
  "0x1fd6cbbfc0363aa394bd77fc74f64009bf54a7e9": (
    <LpIcon swapIconSrc={"/nearpad.png"} tokenIconSrc={"/usdt.png"} />
  ),
  "0x63b4a0538ce8d90876b201af1020d13308a8b253": (
    <LpIcon swapIconSrc={"/nearpad.png"} tokenIconSrc={"/weth.png"} />
  ),
  "0xc374776cf5c497adeef6b505588b00cb298531fd": (
    <LpIcon swapIconSrc={"/nearpad.png"} tokenIconSrc={"/near.png"} />
  ),
  "0xb53bc2537e641c37c7b7a8d33aba1b30283cda2f": (
    <LpIcon swapIconSrc={"/nearpad.png"} tokenIconSrc={"/frax.webp"} />
  ),

  // Metis
  // NET NETT/METIS
  "0x60312d4ebbf3617d3d33841906b5868a86931cbd": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/metis.png"} />
  ),
  // NET BNB/NETT
  "0x3bf77b9192579826f260bc48f2214dfba840fce5": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/bnbnett.png"} />
  ),
  // NET ETH/METIS
  "0x59051b5f5172b69e66869048dc69d35db0b3610d": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/ethmetis.png"} />
  ),
  // NET ETH/NETT
  "0xc8ae82a0ab6ada2062b812827e1556c0fa448dd0": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/ethereum.png"} />
  ),
  // NET ETH/USDC
  "0xf5988809ac97c65121e2c34f5d49558e3d12c253": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/ethusdc.png"} />
  ),
  // NET ETH/USDT
  "0x4db4ce7f5b43a6b455d3c3057b63a083b09b8376": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/ethusdt.png"} />
  ),
  // NET METIS/USDC
  "0x5ae3ee7fbb3cb28c17e7adc3a6ae605ae2465091": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/metisusdc.png"} />
  ),
  // NET NETT/USDC
  "0x0724d37522585e87d27c802728e824862dc72861": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/usdc.png"} />
  ),
  // NET NETT/USDT
  "0x7d02ab940d7dd2b771e59633bbc1ed6ec2b99af1": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/usdt.png"} />
  ),
  // NET USDT/METIS
  "0x3d60afecf67e6ba950b499137a72478b2ca7c5a1": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/metisusdt.png"} />
  ),
  // NET USDT/USDC
  "0x1cad5f8f5d4c0ad49646b2565cc0ca725e4280ea": (
    <LpIcon swapIconSrc={"/netswap.png"} tokenIconSrc={"/usdcusdt.png"} />
  ),
  // TETHYS TETHYS/METIS
  "0xc9b290ff37fa53272e9d71a0b13a444010af4497": (
    <LpIcon swapIconSrc={"/tethys.png"} tokenIconSrc={"/metis.png"} />
  ),
  // TETHYS ETH/METIS
  "0xee5adb5b0dfc51029aca5ad4bc684ad676b307f7": (
    <LpIcon swapIconSrc={"/tethys.png"} tokenIconSrc={"/ethmetis.png"} />
  ),
  // TETHYS METIS/USDC
  "0xdd7df3522a49e6e1127bf1a1d3baea3bc100583b": (
    <LpIcon swapIconSrc={"/tethys.png"} tokenIconSrc={"/metisusdc.png"} />
  ),
  // TETHYS USDT/METIS
  "0x8121113eb9952086dec3113690af0538bb5506fd": (
    <LpIcon swapIconSrc={"/tethys.png"} tokenIconSrc={"/metisusdt.png"} />
  ),
  // TETHYS USDT/METIS
  "0x586f616bb811f1b0dfa953fbf6de3569e7919752": (
    <LpIcon swapIconSrc={"/hades.svg"} tokenIconSrc={"/metis.png"} />
  ),
  // TETHYS USDT/METIS
  "0xcd1cc85dc7b4deef34247ccb5d7c42a58039b1ba": (
    <LpIcon swapIconSrc={"/hellshare.svg"} tokenIconSrc={"/metis.png"} />
  ),

  // Moonbeam

  // STELLA STELLA/GLMR
  "0x7f5ac0fc127bcf1eaf54e3cd01b00300a0861a62": (
    <LpIcon swapIconSrc={"/stella.png"} tokenIconSrc={"/moonbeam.png"} />
  ),
  // STELLA USDC/BNB
  "0xac2657ba28768fe5f09052f07a9b7ea867a4608f": (
    <LpIcon swapIconSrc={"/stella.png"} tokenIconSrc={"/usdcbnb.png"} />
  ),
  // STELLA BUSD/GLMR
  "0x367c36dae9ba198a4fee295c22bc98cb72f77fe1": (
    <LpIcon swapIconSrc={"/stella.png"} tokenIconSrc={"/busdglmr.png"} />
  ),
  // STELLA USDC/DAI
  "0x5ced2f8dd70dc25cba10ad18c7543ad9ad5aeedd": (
    <LpIcon swapIconSrc={"/stella.png"} tokenIconSrc={"/daiusdc.png"} />
  ),
  // STELLA GLMR/ETH
  "0x49a1cc58dcf28d0139daea9c18a3ca23108e78b3": (
    <LpIcon swapIconSrc={"/stella.png"} tokenIconSrc={"/glmreth.png"} />
  ),
  // STELLA GLMR/USDC
  "0x555b74dafc4ef3a5a1640041e3244460dc7610d1": (
    <LpIcon swapIconSrc={"/stella.png"} tokenIconSrc={"/glmrusdc.png"} />
  ),
  // STELLA STELLA/USDC
  "0x81e11a9374033d11cc7e7485a7192ae37d0795d6": (
    <LpIcon swapIconSrc={"/stella.png"} tokenIconSrc={"/usdc.png"} />
  ),
  // STELLA USDT/USDC
  "0x8bc3cceef43392b315ddd92ba30b435f79b66b9e": (
    <LpIcon swapIconSrc={"/stella.png"} tokenIconSrc={"/usdcusdt.png"} />
  ),
  // BEAM BNB/BUSD
  "0x34a1f4ab3548a92c6b32cd778eed310fcd9a340d": (
    <LpIcon swapIconSrc={"/beamswap.webp"} tokenIconSrc={"/bnbbusd.png"} />
  ),
  // BEAM BUSD/GLMR
  "0xfc422eb0a2c7a99bad330377497fd9798c9b1001": (
    <LpIcon swapIconSrc={"/beamswap.webp"} tokenIconSrc={"/busdglmr.png"} />
  ),
  // BEAM BUSD/USDC
  "0xa0799832fb2b9f18acf44b92fbbedcfd6442dd5e": (
    <LpIcon swapIconSrc={"/beamswap.webp"} tokenIconSrc={"/busdusdc.png"} />
  ),
  // BEAM ETH/USDC
  "0x6ba3071760d46040fb4dc7b627c9f68efaca3000": (
    <LpIcon swapIconSrc={"/beamswap.webp"} tokenIconSrc={"/ethusdc.png"} />
  ),
  // BEAM GLMR/GLINT
  "0x99588867e817023162f4d4829995299054a5fc57": (
    <LpIcon swapIconSrc={"/beamswap.webp"} tokenIconSrc={"/tokens/glmr.png"} />
  ),
  // BEAM GLMR/USDC
  "0xb929914b89584b4081c7966ac6287636f7efd053": (
    <LpIcon swapIconSrc={"/beamswap.webp"} tokenIconSrc={"/glmrusdc.png"} />
  ),
  // BEAM USDC/USDT
  "0xa35b2c07cb123ea5e1b9c7530d0812e7e03ec3c1": (
    <LpIcon swapIconSrc={"/beamswap.webp"} tokenIconSrc={"/usdcusdt.png"} />
  ),

  // FLARE FLARE/GLMR
  "0x26a2abd79583155ea5d34443b62399879d42748a": (
    <LpIcon swapIconSrc={"/flare.png"} tokenIconSrc={"/tokens/glmr.png"} />
  ),
  // FLARE FLARE/USDC
  "0x976888647affb4b2d7ac1952cb12ca048cd67762": (
    <LpIcon swapIconSrc={"/flare.png"} tokenIconSrc={"/tokens/usdc.png"} />
  ),
  // FLARE GLMR/MOVR
  "0xa65949fa1053903fcc019ac21b0335aa4b4b1bfa": (
    <LpIcon swapIconSrc={"/flare.png"} tokenIconSrc={"/tokens/movr.png"} />
  ),
  // FLARE GLMR/USDC
  "0xab89ed43d10c7ce0f4d6f21616556aecb71b9c5f": (
    <LpIcon swapIconSrc={"/flare.png"} tokenIconSrc={"/tokens/usdc.png"} />
  ),
  // FLARE GLMR/ETH
  "0xb521c0acf67390c1364f1e940e44db25828e5ef9": (
    <LpIcon swapIconSrc={"/flare.png"} tokenIconSrc={"/tokens/eth.png"} />
  ),
  // FLARE GLMR/WBTC
  "0xdf74d67a4fe29d9d5e0bfaab3516c65b21a5d7cf": (
    <LpIcon swapIconSrc={"/flare.png"} tokenIconSrc={"/tokens/wbtc.png"} />
  ),

  //Optimism

  //ZIP ETH/BTC
  "0x251de0f0368c472bba2e1c8f5db5ac7582b5f847": (
    <LpIcon swapIconSrc={"/zipswap.webp"} tokenIconSrc={"/ethbtc.png"} />
  ),
  //ZIP ETH/DAI
  "0x53790b6c7023786659d11ed82ee03079f3bd6976": (
    <LpIcon swapIconSrc={"/zipswap.webp"} tokenIconSrc={"/ethdai.png"} />
  ),
  //ZIP ETH/USDC
  "0x1a981daa7967c66c3356ad044979bc82e4a478b9": (
    <LpIcon swapIconSrc={"/zipswap.webp"} tokenIconSrc={"/ethusdc.png"} />
  ),
  //ZIP ETH/ZIP
  "0xd7f6ecf4371eddbd60c1080bfaec3d1d60d415d0": (
    <LpIcon swapIconSrc={"/zipswap.webp"} tokenIconSrc={"/ethzip.png"} />
  ),

  // Fantom

  //BOO FTM-ICE
  "0x623ee4a7f290d11c11315994db70fb148b13021d": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmice.png"} />
  ),
  //BOO FTM-SPELL
  "0x78f82c16992932efdd18d93f889141ccf326dbc2": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmspell.png"} />
  ),
  //BOO CRV-FTM
  "0xb471ac6ef617e952b84c6a9ff5de65a9da96c93b": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/crvftm.png"} />
  ),
  //BOO FTM-AVAX
  "0x5df809e410d9cc577f0d01b4e623c567c7ad56c1": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmavax.png"} />
  ),
  //BOO FTM-ETH
  "0xf0702249f4d3a25cd3ded7859a165693685ab577": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmeth.png"} />
  ),
  //BOO FTM-BNB
  "0x956de13ea0fa5b577e4097be837bf4ac80005820": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmbnb.png"} />
  ),
  //BOO YFI-ETH
  "0x0845c0bfe75691b1e21b24351aac581a7fb6b7df": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/yfieth.png"} />
  ),
  //BOO FTM-TREEB
  "0xe8b72a866b8d59f5c13d2adef96e40a3ef5b3152": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmtreeb.png"} />
  ),
  //BOO FTM-ANY
  "0x5c021d9cfad40aafc57786b409a9ce571de375b4": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmany.png"} />
  ),
  //BOO FTM-MATIC
  "0x7051c6f0c1f1437498505521a3bd949654923fe1": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmatic.png"} />
  ),
  //BOO FTM-BTC
  "0xfdb9ab8b9513ad9e419cf19530fee49d412c3ee3": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/tokens/ftmbtc.png"} />
  ),
  //BOO BTC-ETH
  "0xec454eda10accdd66209c57af8c12924556f3abd": (
    <LpIcon swapIconSrc={"/spookyswap.png"} tokenIconSrc={"/ethbtc.png"} />
  ),
  //LQDR SPIRIT DEUS-FTM
  "0x2599eba5fd1e49f294c76d034557948034d6c96e": (
    <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/deusftm.png"} />
  ),
  //LQDR SPIRIT FRAX-FTM
  "0x7ed0cddb9bb6c6dfea6fb63e117c8305479b8d7d": (
    <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/fraxftm.png"} />
  ),
  //LQDR SPIRIT MIM-FTM
  "0xb32b31dfafbd53e310390f641c7119b5b9ea0488": (
    <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/mimftm.png"} />
  ),
  //LQDR SPIRIT USDC-FTM
  "0xe7e90f5a767406eff87fdad7eb07ef407922ec1d": (
    <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/usdcftm.png"} />
  ),
  //LQDR SPIRIT PILLS-FTM
  "0x9c775d3d66167685b2a3f4567b548567d2875350": (
    <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/pillftm.png"} />
  ),
  //LQDR SPIRIT ETH-FTM
  "0x613bf4e46b4817015c01c6bb31c7ae9edaadc26e": (
    <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/ftmeth.png"} />
  ),
  //LQDR SPIRIT SPIRIT-FTM
  "0x30748322b6e34545dbe0788c421886aeb5297789": (
    <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/spiritftm.png"} />
  ),
  //LQDR SPIRIT LQDR-FTM
  "0x4fe6f19031239f105f753d1df8a0d24857d0caa2": (
    <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/lqdrftm.png"} />
  ),
  //LQDR SPIRIT DEI-USDC
  "0x8efd36aa4afa9f4e157bec759f1744a7febaea0e": (
    <LpIcon swapIconSrc={"/lqdr.png"} tokenIconSrc={"/tokens/usdcdei.png"} />
  ),
  //BEETS FTM-BEETS
  "0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1": (
    <LpIcon swapIconSrc={"/beets.png"} tokenIconSrc={"/tokens/ftmbeets.png"} />
  ),
  //BEETS BTC-ETH-FTM
  "0xd47d2791d3b46f9452709fa41855a045304d6f9d": (
    <LpIcon swapIconSrc={"/beets.png"} tokenIconSrc={"/tokens/ftmethbtc.png"} />
  ),
  //BEETS LQDR-FTM
  "0x5e02ab5699549675a6d3beeb92a62782712d0509": (
    <LpIcon swapIconSrc={"/beets.png"} tokenIconSrc={"/tokens/lqdrftm.png"} />
  ),
  //BEETS FTM-MATIC-SOL-AVAX-LUNA-BNB
  "0x9af1f0e9ac9c844a4a4439d446c1437807183075": (
    <LpIcon swapIconSrc={"/beets.png"} tokenIconSrc={"/tokens/ftmmaticsolavaxlunabnb.png"} />
  ),
  //BEETS FTM-USDC
  "0xcdf68a4d525ba2e90fe959c74330430a5a6b8226": (
    <LpIcon swapIconSrc={"/beets.png"} tokenIconSrc={"/tokens/usdcftm.png"} />
  ),
  //BEETS USDC-DAI-MAI
  "0x2c580c6f08044d6dfaca8976a66c8fadddbd9901": (
    <LpIcon swapIconSrc={"/beets.png"} tokenIconSrc={"/tokens/usdcdaimai.png"} />
  ),
  //BEETS USDC-FTM-BTC-ETH
  "0xf3a602d30dcb723a74a0198313a7551feaca7dac": (
    <LpIcon swapIconSrc={"/beets.png"} tokenIconSrc={"/tokens/usdcftmbtceth.png"} />
  ),
};

const USDC_SCALE = ethers.utils.parseUnits("1", 12);

const setButtonStatus = (
  status: ERC20TransferStatus,
  transfering: string,
  idle: string,
  setButtonText: (arg0: ButtonStatus) => void,
) => {
  // Deposit
  if (status === ERC20TransferStatus.Approving) {
    setButtonText({
      disabled: true,
      text: "Approving...",
    });
  }
  if (status === ERC20TransferStatus.Transfering) {
    setButtonText({
      disabled: true,
      text: transfering,
    });
  }
  if (
    status === ERC20TransferStatus.Success ||
    status === ERC20TransferStatus.Failed ||
    status === ERC20TransferStatus.Cancelled
  ) {
    setButtonText({
      disabled: false,
      text: idle,
    });
  }
};

export const JarCollapsible: FC<{
  jarData: UserJarData;
  isYearnJar?: boolean;
}> = ({ jarData }) => {
  const {
    name,
    jarContract,
    depositToken,
    ratio,
    depositTokenName,
    balance,
    deposited,
    usdPerPToken,
    APYs,
    totalAPY,
    depositTokenLink,
    apr,
    tvlUSD,
  } = jarData;
  const { t } = useTranslation("common");
  const { pickleCore } = PickleCore.useContainer();

  const isUsdc = isUsdcToken(depositToken.address);

  let uncompounded = APYs?.map((x) => {
    const k: string = Object.keys(x)[0];
    const shouldNotUncompound = k === "pickle" || k === "lp";
    const v = shouldNotUncompound ? Object.values(x)[0] : uncompoundAPY(Object.values(x)[0]);
    const ret: JarApy = {};
    ret[k] = v;
    return ret;
  });

  const totalAPR: number = uncompounded
    ?.map((x) => {
      return Object.values(x).reduce((acc, y) => acc + y, 0);
    })
    .reduce((acc, x) => acc + x, 0);
  let difference = totalAPY - totalAPR;

  if (!uncompounded) {
    uncompounded = [{lp:0}];
  }


  const tooltipText = [
    `${t("farms.baseAPRs")}:`,
    ...uncompounded?.map((x) => {
      const k = Object.keys(x)[0];
      const v = Object.values(x)[0];
      return v ? `${k}: ${v.toFixed(2)}%` : null;
    }),
    ,
    `${t(
      "farms.compounding",
    )} <img src="/magicwand.svg" height="16" width="16"/>: ${difference.toFixed(2)}%`,
  ]
    .filter((x) => x)
    .join(" <br/> ");

  const balNum = parseFloat(formatEther(isUsdc && balance ? balance.mul(USDC_SCALE) : balance));
  const depositedNum = parseFloat(
    formatEther(isUsdc && deposited ? deposited.mul(USDC_SCALE) : deposited),
  );
  const balStr = balNum.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: balNum < 1 ? 8 : 4,
  });
  const depositedStr = depositedNum.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: depositedNum < 1 ? 8 : 4,
  });
  const depositedUnderlyingStr = (
    parseFloat(formatEther(isUsdc && deposited ? deposited.mul(USDC_SCALE) : deposited)) * ratio
  ).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: depositedNum < 1 ? 8 : 4,
  });
  const valueStr = (usdPerPToken * depositedNum).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [depositButton, setDepositButton] = useState<ButtonStatus>({
    disabled: false,
    text: t("farms.deposit"),
  });
  const [withdrawButton, setWithdrawButton] = useState<ButtonStatus>({
    disabled: false,
    text: t("farms.withdraw"),
  });

  const {
    status: erc20TransferStatuses,
    transfer,
    getTransferStatus,
  } = ERC20Transfer.useContainer();
  const { signer, chainName } = Connection.useContainer();

  useEffect(() => {
    const dStatus = getTransferStatus(depositToken.address, jarContract.address);
    const wStatus = getTransferStatus(jarContract.address, jarContract.address);

    setButtonStatus(dStatus, t("farms.depositing"), t("farms.deposit"), setDepositButton);
    setButtonStatus(wStatus, t("farms.withdrawing"), t("farms.withdraw"), setWithdrawButton);
  }, [erc20TransferStatuses]);

  const explanations: RatioAndPendingStrings = getRatioStringAndPendingString(
    usdPerPToken,
    depositedNum,
    0,
    ratio,
    jarContract.address.toLowerCase(),
    pickleCore,
    t,
  );
  const valueStrExplained = explanations.ratioString;
  const userSharePendingStr = explanations.pendingString;

  const multiFarmsDepositToken = Object.keys(JAR_DEPOSIT_TOKEN_MULTI_FARMS_TO_ICON).includes(
    depositToken.address.toLowerCase(),
  );
  let multiFarmsApiKey: string | undefined;
  if (multiFarmsDepositToken) multiFarmsApiKey = jarData.apiKey;

  return (
    <Collapse
      style={{ borderWidth: "1px", boxShadow: "none" }}
      shadow
      preview={
        <Grid.Container gap={1}>
          <JarName xs={24} sm={12} md={5} lg={6}>
            <TokenIcon
              src={
                multiFarmsApiKey
                  ? JAR_DEPOSIT_TOKEN_MULTI_FARMS_TO_ICON[
                      depositToken.address.toLowerCase() as keyof typeof JAR_DEPOSIT_TOKEN_MULTI_FARMS_TO_ICON
                    ][multiFarmsApiKey]
                  : JAR_DEPOSIT_TOKEN_TO_ICON[
                      depositToken.address.toLowerCase() as keyof typeof JAR_DEPOSIT_TOKEN_TO_ICON
                    ]
              }
            />
            <div style={{ width: "100%" }}>
              <div style={{ fontSize: `1rem` }}>{name}</div>
              <a href={depositTokenLink} target="_" style={{ fontSize: `1rem` }}>
                {depositTokenName}
              </a>
            </div>
          </JarName>
          <Grid xs={24} sm={8} md={4} lg={4} css={{ textAlign: "center" }}>
            <Data isZero={balNum === 0}>{balStr}</Data>
            <Label>{t("balances.balance")}</Label>
          </Grid>
          <Grid xs={24} sm={8} md={4} lg={3} css={{ textAlign: "center" }}>
            <Data isZero={depositedNum === 0}>{depositedStr}</Data>
            <Label>{t("farms.deposited")}</Label>
          </Grid>
          <Grid xs={24} sm={8} md={4} lg={3} css={{ textAlign: "center" }}>
            <Data isZero={usdPerPToken * depositedNum === 0}>${valueStr}</Data>
            <Label>{t("balances.depositValue")}</Label>
            {Boolean(valueStrExplained !== undefined) && <Label>{valueStrExplained}</Label>}
            {Boolean(userSharePendingStr !== undefined) && <Label>{userSharePendingStr}</Label>}
          </Grid>

          <Grid xs={24} sm={12} md={5} lg={4} css={{ textAlign: "center" }}>
            <Data>
              <Tooltip text={ReactHtmlParser(tooltipText)}>
                {getFormatString(totalAPY) + "%" || "--"}
              </Tooltip>
              <img src="./question.svg" width="15px" style={{ marginLeft: 5 }} />
              <div>
                <span>{t("balances.apy")}</span>
              </div>
            </Data>
          </Grid>
          <Grid xs={24} sm={12} md={4} lg={4} css={{ textAlign: "center" }}>
            <Data isZero={tvlUSD === 0}>${getFormatString(tvlUSD)}</Data>
            <Label>{t("balances.tvl")}</Label>
          </Grid>
        </Grid.Container>
      }
    >
      <Spacer y={1} />
      <Grid.Container gap={2}>
        <Grid xs={24} md={depositedNum ? 12 : 24}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              {t("balances.balance")}: {balStr} {depositTokenName}
            </div>
            <Link
              color
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setDepositAmount(
                  formatEther(isUsdc && balance ? balance.mul(USDC_SCALE) : balance),
                );
              }}
            >
              {t("balances.max")}
            </Link>
          </div>
          <Input
            onChange={(e) => setDepositAmount(e.target.value)}
            value={depositAmount}
            width="100%"
          ></Input>
          <Spacer y={0.5} />
          <Button
            onClick={() => {
              if (signer) {
                // Allow Jar to get LP Token
                const depositAmt = ethers.utils.parseUnits(depositAmount, isUsdc ? 6 : 18);
                transfer({
                  token: depositToken.address,
                  recipient: jarContract.address,
                  approvalAmountRequired: depositAmt,
                  transferCallback: async () => {
                    return jarContract.connect(signer).deposit(depositAmt);
                  },
                });
              }
            }}
            disabled={depositButton.disabled}
            style={{ width: "100%" }}
          >
            {depositButton.text}
          </Button>
        </Grid>
        {depositedNum !== 0 && (
          <Grid xs={24} md={12}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                {t("balances.balance")} {depositedStr} (
                <Tooltip
                  text={`${
                    deposited && ratio
                      ? parseFloat(
                          formatEther(isUsdc && deposited ? deposited.mul(USDC_SCALE) : deposited),
                        ) * ratio
                      : 0
                  } ${depositTokenName}`}
                >
                  {depositedUnderlyingStr}
                </Tooltip>{" "}
                {depositTokenName}){" "}
              </div>
              <Link
                color
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setWithdrawAmount(formatEther(isUsdc ? deposited.mul(USDC_SCALE) : deposited));
                }}
              >
                {t("balances.max")}
              </Link>
            </div>
            <Input
              onChange={(e) => setWithdrawAmount(e.target.value)}
              value={withdrawAmount}
              width="100%"
            ></Input>
            <Spacer y={0.5} />
            <Button
              disabled={withdrawButton.disabled}
              onClick={() => {
                if (signer) {
                  // Allow pToken to burn its pToken
                  // and refund lpToken
                  transfer({
                    token: jarContract.address,
                    recipient: jarContract.address,
                    transferCallback: async () => {
                      return jarContract
                        .connect(signer)
                        .withdraw(ethers.utils.parseUnits(withdrawAmount, isUsdc ? 6 : 18));
                    },
                    approval: false,
                  });
                }
              }}
              style={{ width: "100%" }}
            >
              {withdrawButton.text}
            </Button>
          </Grid>
        )}
      </Grid.Container>
    </Collapse>
  );
};

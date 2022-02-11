import { FC } from "react";
import { useTranslation } from "next-i18next";
import { useSelector } from "react-redux";

import type { PickleFinancePage } from "v2/types";
import Link from "v2/components/Link";
import HistoricChart from "v2/features/dill/HistoricChart";
import RevenueStats from "v2/features/dill/RevenueStats";
import { CoreSelectors } from "v2/store/core";
import DillInfo from "v2/features/dill/DillInfo";
import LoadingIndicator from "v2/components/LoadingIndicator";

const Dill: PickleFinancePage = () => {
  const core = useSelector(CoreSelectors.selectCore);

  if (!core) {
    return <LoadingIndicator waitForCore />;
  }

  return (
    <div className="w-full sm:w-4/5 sm:mb-5">
      <div className="block sm:flex mb-6 sm:mb-10">
        <DillInfo />
      </div>
      <div className="mb-3">
        <RevenueStats dill={core.dill} />
      </div>
      <HistoricChart />
    </div>
  );
};

const PageTitle: FC = () => {
  const { t } = useTranslation("common");

  return (
    <>
      <h1 className="font-title font-medium text-2xl sm:text-3xl pt-2">
        {t("v2.nav.dill")}
      </h1>
      <h2 className="font-body font-normal text-gray-light text-sm sm:text-base leading-4 sm:leading-6 mt-1">
        {t("v2.dill.description")}
        <Link
          href="https://docs.pickle.finance/dill/vote-locking-pickle-for-dill"
          external
          primary
          className="font-bold ml-1"
        >
          {t("v2.dill.readMore")}
        </Link>
      </h2>
    </>
  );
};

Dill.PageTitle = PageTitle;

export { getStaticProps } from "../../util/locales";

export default Dill;

"use client";

import { Tab } from "@headlessui/react";
import { Fragment } from "react";
import { ReaderHome } from "./_components/ReaderHome";
import type {
  NewsletterCardDto,
  SeriesWithWriterDto,
} from "@moonjin/api-types";
import WritterHome from "./_components/WritterHome";

export default function HomeTab({
  userType,
  seriesList,
  newsletterList,
  myNewsletterList,
}: {
  userType: any;
  seriesList: SeriesWithWriterDto[];
  newsletterList: NewsletterCardDto[];
  myNewsletterList?: NewsletterCardDto[];
}) {
  const tabList = userType === "작가" ? ["발행글", "구독함"] : ["구독함"];
  return (
    <>
      <Tab.Group defaultIndex={0}>
        <Tab.List className="flex gap-x-3">
          {tabList?.map((value, index) => (
            <Tab as={Fragment} key={index}>
              {({ selected }) => (
                /* Use the `selected` state to conditionally style the selected tab. */
                <button
                  className={`${
                    selected ? "border-b font-semibold" : null
                  } border-primary outline-none`}
                >
                  {value}
                </button>
              )}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {userType === "작가" && myNewsletterList != null && (
            <Tab.Panel>
              <WritterHome myNewsletterList={myNewsletterList} />
            </Tab.Panel>
          )}
          <Tab.Panel>
            <ReaderHome
              seriesList={seriesList}
              newsletterList={newsletterList}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
}

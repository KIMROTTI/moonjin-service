"use client";

import { Tab } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { isNonEmptyArray } from "@toss/utils";
import NewsLetterCard from "../../../_components/NewsLetterCard";
import {
  ReleasedPostWithWriterDto,
  ReleasedSeriesWithWriterDto,
} from "@moonjin/api-types";
import SeriesCard from "../../../_components/SeriesCard";
import EmptyCard from "../../../_components/EmptyCard";
import { useSearchParams } from "next/navigation";

export default function SubscribeTab({
  seriesList,
  newsletterList,
}: {
  seriesList: ReleasedSeriesWithWriterDto[];
  newsletterList: ReleasedPostWithWriterDto[];
}) {
  const params = useSearchParams();

  return (
    <Tab.Group defaultIndex={params.get("type") === "series" ? 1 : 0}>
      <Tab.List className="w-full flex gap-x-4">
        {["모든 뉴스레터", "시리즈"].map((category, index) => (
          <Tab key={index} as={Fragment}>
            {({ selected }) => (
              /* Use the `selected` state to conditionally style the selected tab. */
              <button
                className={`${
                  selected ? "border-b-2 font-semibold" : null
                } border-primary py-1 outline-none`}
              >
                {category}
              </button>
            )}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="w-full mt-4">
        <Tab.Panel>
          <section className="flex flex-col w-full">
            {isNonEmptyArray(newsletterList) ? (
              newsletterList.map((value, index) => (
                <NewsLetterCard key={index} value={value} />
              ))
            ) : (
              <EmptyCard text={"구독중인 뉴스레터가 없습니다"} />
            )}
          </section>
        </Tab.Panel>
        <Tab.Panel>
          <section className="flex flex-col w-full">
            {isNonEmptyArray(seriesList) ? (
              seriesList.map((value, index) => <SeriesCard value={value} />)
            ) : (
              <EmptyCard text={"구독중인 시리즈가 없습니다"} />
            )}
          </section>
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
}
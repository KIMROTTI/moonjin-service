"use client";

import * as I from "@components/icons";
import Link from "next/link";
import useSWR from "swr";
import type { ResponseForm, UserOrWriterDto } from "@moonjin/api-types";
import csr from "@lib/fetcher/csr";
import toast from "react-hot-toast";
import { checkType } from "@utils/checkUser";
import { useRouter } from "next/navigation";

export default function WriterHeader() {
  const router = useRouter();
  const { data: userInfo, mutate } =
    useSWR<ResponseForm<UserOrWriterDto>>("user");

  function onClickLogout() {
    csr
      .post("auth/logout")
      .then((res) => {
        router.refresh();
        return mutate(undefined);
      })
      .catch((err) => {
        toast.error("로그아웃 실패");
      });
  }

  return (
    <header className="w-full flex justify-center h-16">
      <section className="max-w-[1006px] w-full flex items-center">
        <Link className="flex  items-center h-full text-white" href="/">
          <I.Logo fill="#7b0000" height="29" viewBox="0 0 149 39" width="139" />
        </Link>
        <div className="flex h-full items-center ml-auto">
          {userInfo ? (
            <div className="w-fit h-full   items-center flex  relative text-grayscale-600">
              <div className="h-fit gap-x-4 px-4 group  flex  bg-transparent hover:bg-black/80 rounded-full  items-center">
                <nav className=" items-center  gap-x-4 text-sm font-medium transition duration-300 ease-in-out   overflow-hidden  text-grayscale-100 h-full  w-fit hidden  whitespace-nowrap  hover:flex group-hover:flex ">
                  {checkType(userInfo?.data?.user?.role) === "작가" && (
                    <Link
                      className="py-1.5 "
                      href={`/@${userInfo?.data?.writerInfo?.moonjinId}`}
                    >
                      작가의 서재
                    </Link>
                  )}

                  <Link className=" py-1.5 " href="/mypage">
                    마이페이지
                  </Link>
                </nav>
                <button className="h-full  py-2.5 relative  text-white ">
                  <I.User
                    className={`fill-grayscale-600 group-hover:fill-white`}
                    height="23"
                    viewBox="0 0 24 25"
                    width="22"
                  />
                </button>
              </div>
              <button className="py-2.5 px-3" onClick={onClickLogout}>
                <I.SignOut />
              </button>
            </div>
          ) : (
            <Link
              className="py-2.5 h-fit px-5  text-sm border border-primary text-primary  rounded-full"
              href="/auth/login"
            >
              로그인
            </Link>
            // <Link
            //   className="py-1.5 h-fit flex items-center gap-x-2 px-2.5 text-grayscale-600 text-sm border border-grayscale-500 rounded-full"
            //   href="/auth/login"
            // >
            //   {/*<I.PencilSimpleLine />*/}
            //   시작하기
            // </Link>
          )}
        </div>
      </section>
    </header>
  );
}

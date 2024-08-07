"use client";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useEffect } from "react";
import * as I from "components/icons";
import csr from "../../../lib/fetcher/csr";
import { ErrorCodeEnum } from "@moonjin/api-types";
import Background from "public/images/background.png";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import * as Tb from "react-icons/tb";

export default function Page() {
  const params = useSearchParams();

  const {
    register,
    setValue,
    resetField,
    watch,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<any>();
  const role = watch("role");

  async function onClickSignup(data: any) {
    const auth = {
      ...data,
      role: parseInt(data.role),
    };

    await csr
      .post("auth/oauth/signup", { json: auth })
      .then((res) => {
        window.location.href = "/";
      })
      .catch((err) => {
        if (err.code === ErrorCodeEnum.EMAIL_ALREADY_EXIST)
          return alert(err.data.message);
        alert("회원가입 실패");
      });
  }

  useEffect(() => {
    resetField("moonjinId");
    setValue("email", params.get("email"));
  }, [role]);

  return (
    <div className="relative flex items-center justify-center w-full h-full min-h-screen">
      <Image
        className="absolute top-0 left-0 z-0 w-screen h-screen object-cover"
        src={Background}
        alt="백그라운드 이미지"
      />
      <section className="flex-1 z-10 w-1/2 h-full min-h-screen ">
        <div className="text-white flex h-full min-h-screen flex-col pl-20 py-20">
          <div className="font-serif font-semibold  text-2xl leading-relaxed ">
            일상을 담은 <br />
            다양한 뉴스레터를 <br />
            받아보실 수 있습니다__
          </div>
          <I.LogoLeft className="mt-auto" />
        </div>
      </section>
      <section className="z-10  bg-white flex-1 w-1/2 h-full min-h-screen flex flex-col items-center justify-center">
        <div className="  flex w-full max-w-[680px] px-20 gap-y-3 flex-col items-center">
          <I.AuthLogo />
          <form
            onSubmit={handleSubmit(onClickSignup)}
            className="w-full h-fit flex flex-col items-start gap-y-3"
          >
            <div className="w-full flex mt-4 flex-col  ">
              <span>회원구분</span>
              <div className="flex mt-2 w-full items-center gap-x-3">
                <div className="flex items-center gap-x-2">
                  <input
                    {...register("role", { required: "이메일을 입력해주세요" })}
                    id="0"
                    type="radio"
                    name="role"
                    defaultChecked={true}
                    value={0}
                    className="w-4 h-4 text-[#7b0000]  border-4 border-gray-400 focus:ring-[#7b0000] dark:focus:ring-[#7b0000] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="0">독자 회원</label>
                </div>
                <div className="flex items-center gap-x-2">
                  <input
                    {...register("role", { required: "이메일을 입력해주세요" })}
                    id="1"
                    type="radio"
                    name="role"
                    value={1}
                    className="w-4 h-4 text-[#7b0000]  border-4 border-gray-400 focus:ring-[#7b0000] dark:focus:ring-[#7b0000] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="1">작가 회원</label>
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full">
              <label htmlFor="nickname">닉네임</label>
              <input
                type="text"
                id="nickname"
                placeholder="닉네임"
                className="mt-2 w-full h-10 border border-grayscale-300 rounded-lg px-2 placeholder:text-sm"
                {...register("nickname", { required: "닉네임을 입력해주세요" })}
              />
              {errors.nickname?.message && (
                <div className="flex mt-1 items-center  text-rose-500 gap-x-1">
                  <Tb.TbAlertCircle />
                  <span className="text-xs text-rose-500 ">{`${errors.nickname?.message}`}</span>
                </div>
              )}
              <label className="mt-4" htmlFor="email">
                이메일
              </label>
              <input
                id="email"
                type="email"
                placeholder="이메일"
                disabled={true}
                defaultValue={"andy6239@gmail.com"}
                className="mt-2 w-full h-10 border border-grayscale-300 rounded-lg px-2 placeholder:text-sm"
                {...register("email", { required: "이메일을 입력해주세요" })}
              />
              {errors.email?.message && (
                <div className="flex items-center mt-1 text-rose-500 gap-x-1">
                  <Tb.TbAlertCircle />
                  <span className="text-xs text-rose-500 ">{`${errors.email?.message}`}</span>
                </div>
              )}

              {role === "1" ? (
                <div className="w-full mt-4">
                  <label htmlFor="moonjinId">문진 이메일</label>
                  <div className="mt-2 flex items-center text-gray-800">
                    <input
                      id="moonjinId"
                      type="text"
                      placeholder="문진 이메일 아이디"
                      className=" w-1/3 h-10 border border-grayscale-300 rounded-lg px-2 placeholder:text-sm"
                      {...register("moonjinId", {
                        required: "레터를 발송할 이메일을 입력해주세요",
                      })}
                    />
                    <span className="ml-1.5 font-medium text-grayscale-500">
                      @ moonjin.site
                    </span>
                  </div>
                  {errors.moonjinId?.message && (
                    <div className="flex items-center mt-1 text-rose-500 gap-x-1">
                      <Tb.TbAlertCircle />
                      <span className="text-xs text-rose-500 ">{`${errors.moonjinId?.message}`}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <button
              type="submit"
              className="mt-2 disabled:bg-gray-900 w-full h-10 rounded-2xl bg-[#7b0000] text-white"
            >
              회원가입
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

"use client";

import * as I from "../../../../components/icons";
import EditorJS from "@editorjs/editorjs";
import {
  EDITOR_JS_I18N,
  EDITOR_JS_TOOLS,
} from "@components/editorjs/customEditorConfig";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PiCaretUpDownBold } from "react-icons/pi";
import "components/editorjs/customEditorView.css";
import csr from "../../../../lib/fetcher/csr";
import {
  FileTypeEnum,
  PostWithContentDto,
  ResponseForm,
  SeriesDto,
} from "@moonjin/api-types";
import { Listbox } from "@headlessui/react";
import Link from "next/link";
import useSWR from "swr";
import { fileUpload } from "@lib/file/fileUpload";
import Image from "next/image";
import { CgSpinner } from "react-icons/cg";
import { CategoryList } from "@components/category/CategoryList";
import { overlay } from "overlay-kit";

export default function NewEditorJS() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editor, setEditor] = useState<null | EditorJS>(null);
  const {
    watch,
    setValue,
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm();

  const mySeriesId = searchParams.get("seriesId") ?? null;
  const mySeries = mySeriesId
    ? useSWR<ResponseForm<SeriesDto>>(`series/writing/${mySeriesId}`)
    : null;

  const { data: seriesList } =
    useSWR<ResponseForm<SeriesDto[]>>("series/me/summary");

  const title = watch("title");
  register("title", { required: "제목을 입력해주세요" });

  function onClickSave(value: any) {
    if (editor)
      editor
        .save()
        .then((outputData: any) => {
          csr
            .post("post", {
              json: {
                ...value,
                content: outputData,
                seriesId: mySeries?.data?.data?.id,
              },
            })
            .then(async (res) => {
              const { data: nInfo } =
                await res.json<ResponseForm<PostWithContentDto>>();
              toast.success("글을 저장했습니다");
              router.push(`/write/${nInfo.post.id}/edit`);
            })
            .catch(() => toast.error("글 저장에 실패하였습니다"));
        })
        .catch((error) => {
          console.log("Saving failed: ", error);
        });
  }

  function onClickSubmit(value: any) {
    if (editor)
      editor
        .save()
        .then((outputData: any) => {
          overlay.open(({ isOpen, unmount }) => {
            return (
              <OverlaySetting
                unmount={unmount}
                seriesList={seriesList}
                outputData={outputData}
                title={title}
                mySeriesInfo={mySeries?.data?.data}
              />
            );
          });
        })
        .catch((error) => {
          console.log("Saving failed: ", error);
        });
  }

  const preventClose = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "";
  };

  useEffect(() => {
    const editorInstance = new EditorJS({
      holder: "editorjs",
      autofocus: false,
      readOnly: false,
      tools: EDITOR_JS_TOOLS,
      i18n: EDITOR_JS_I18N,
      onReady: () => {
        console.log("Editor.js is ready to work!");
      },
    });

    setEditor(editorInstance);

    return () => {
      editorInstance.destroy();
    };
  }, []);

  useEffect(() => {
    (() => {
      window.addEventListener("beforeunload", preventClose);
    })();

    return () => {
      window.removeEventListener("beforeunload", preventClose);
    };
  }, []);

  return (
    <div className=" w-full    flex flex-col items-center">
      <section className="w-full  flex justify-between text-grayscale-600 fixed top-0 py-6 px-8">
        <a
          href={"/"}
          className="flex items-center font-semibold gap-x-2.5 font-libre"
        >
          <I.LogoIcon width="36" height="36" viewBox="0 0 67 67" /> moonjin
        </a>
        <div className="flex items-center gap-x-4">
          {isSubmitting && (
            <div className="px-4 font-medium text-sm flex items-center gap-x-2 text-grayscale-400">
              <CgSpinner className="animate-spin" /> 저장 중
            </div>
          )}
          <button
            onClick={handleSubmit(onClickSubmit, () => {
              toast.error("제목을 입력해주세요");
            })}
            className="border hover:-translate-y-1 transition duration-300 ease-in-out gap-x-1 flex items-center text-sm font-medium border-primary py-1.5 px-2 text-primary rounded-full"
          >
            <I.PaperPlaneTilt />글 게시
          </button>
          <button
            onClick={handleSubmit(onClickSave, () => {
              toast.error("제목을 입력해주세요");
            })}
            className="border hover:-translate-y-1 transition duration-300 ease-in-out gap-x-1 flex items-center text-sm font-medium border-grayscale-500 py-1.5 px-2 text-grayscale-500 rounded-full"
          >
            <I.Save />글 저장
          </button>
        </div>
      </section>
      <section className="mt-48 max-w-[680px] w-full">
        {mySeriesId && mySeries && (
          <span className="px-4 font-serif text-grayscale-500">
            # {mySeries?.data?.data?.title}
          </span>
        )}

        <input
          type="text"
          onChange={(e) => setValue("title", e.target.value)}
          placeholder="제목을 입력해주세요"
          maxLength={32}
          className="w-full py-2 font-serif text-grayscale-500 text-2xl outline-none focus:ring-0 border-none"
        />

        <hr className="border border-grayscale-100" />
      </section>
    </div>
  );
}

function OverlaySetting({
  unmount,
  seriesList,
  title,
  outputData,
  mySeriesInfo,
}: {
  unmount: () => void;
  seriesList: any | null;
  title: any | null;
  outputData: any;
  mySeriesInfo?: any;
}) {
  const router = useRouter();
  const { register, handleSubmit, watch, setValue } = useForm<any>({
    defaultValues: {
      type: mySeriesInfo ? "시리즈" : "자유글",
      series: mySeriesInfo ? mySeriesInfo : null,
      cover: null,
    },
  });
  const cover = watch("cover");
  const type = watch("type");
  const series = watch("series");

  function onClickSave(value: any) {
    csr
      .post("post", {
        json: {
          title: title,
          content: outputData,
          cover: value.cover,
          seriesId: value?.series?.id,
          category: value.category ?? "",
        },
      })
      .then(async (res) => {
        const { data: nInfo } =
          await res.json<ResponseForm<PostWithContentDto>>();
        toast.success("글을 저장했습니다");
        router.push(`/write/${nInfo.post.id}/publish`);
      })
      .catch(() => toast.error("글 저장에 실패하였습니다"));
  }

  return (
    <div
      onClick={(e) => {
        unmount();
      }}
      className="fixed  top-0 flex items-center justify-center z-50 w-screen h-screen bg-black/40"
    >
      <form
        onSubmit={handleSubmit(onClickSave)}
        onClick={(e) => e.stopPropagation()}
        className="w-fit max-h-[530px] min-w-[520px] max-w-[520px] overflow-y-auto py-8 px-8 rounded-lg bg-white"
      >
        <h1 className="text-lg font-semibold">뉴스레터 정보</h1>

        <section className="mt-8">
          <div className="text-primary">
            * <span className="font-medium text-grayscale-700">발행 방식</span>
          </div>
          <ul className="text-sm text-grayscale-600 mt-2 flex items-center gap-x-6 ">
            <li className="flex items-center gap-x-2.5">
              <input
                {...register("type")}
                value={"자유글"}
                id="normal"
                type="radio"
                className="focus:ring-0 outline-none text-primary active:bg-primary checked:bg-primary"
              />
              <label htmlFor="normal">자유글</label>
            </li>
            <li className="flex items-center gap-x-2.5">
              <input
                {...register("type")}
                value={"시리즈"}
                id="series"
                type="radio"
                className="focus:ring-0 outline-none text-primary active:bg-primary checked:bg-primary"
              />
              <label htmlFor="series">시리즈</label>
            </li>
          </ul>
        </section>
        {type === "자유글" && (
          <section className="mt-8">
            <div className="text-primary">
              *{" "}
              <span className="font-medium text-grayscale-700">
                작성하신 글의 카테고리를 설정해주세요
              </span>
            </div>
            <ul className="text-sm text-grayscale-600 mt-2 flex flex-wrap w-full gap-x-2 gap-y-1.5 ">
              {CategoryList.map((category, index) => (
                <label
                  htmlFor={`category${index}`}
                  key={index}
                  className="flex group"
                >
                  <input
                    {...register("category")}
                    id={`category${index}`}
                    value={category}
                    defaultChecked={index === 0}
                    type="radio"
                    className="focus:ring-0 hidden peer outline-none text-primary active:bg-primary checked:bg-primary"
                  />
                  <div className="peer-checked:text-primary peer-checked:border-primary h-full w-full text-center border rounded-full py-1.5 px-2 border-grayscale-200 ">
                    {category}
                  </div>
                </label>
              ))}
            </ul>
          </section>
        )}
        {type === "시리즈" && (
          <section className="mt-8 flex flex-col">
            <div className="text-primary">
              *{" "}
              <span className="font-medium text-grayscale-700">
                시리즈 선택
              </span>
            </div>
            {seriesList?.data?.length > 0 ? (
              <div className="w-full flex  gap-x-1.5">
                <div className="flex flex-col w-full">
                  <Listbox
                    value={series}
                    onChange={(e) => setValue("series", e)}
                  >
                    <Listbox.Button className="w-full mt-2 py-2 px-2.5 bg-grayscale-100 rounded-lg flex items-center">
                      {series?.title ?? "시리즈를 선택해주세요"}{" "}
                      <PiCaretUpDownBold className="ml-auto" />
                    </Listbox.Button>
                    <Listbox.Options className="mt-2 h-fit py-2 px-2.5 border rounded-lg w-full flex flex-col">
                      {seriesList?.data?.map((series: any) => (
                        <Listbox.Option
                          key={series.id}
                          value={series}
                          className="py-1.5 cursor-pointer"
                        >
                          {series.title}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Listbox>
                </div>
                <Link
                  target="_blank"
                  onClick={() => unmount()}
                  href="/mypage/newsletter/series/new"
                  className="min-w-[40px] mt-2 flex items-center justify-center size-10 border border-grayscale-100 rounded shadow"
                >
                  +
                </Link>
              </div>
            ) : (
              <Link
                target="_blank"
                href="/mypage/newsletter/series/new"
                className="py-1.5  w-fit border border-grayscale-200 rounded-lg mt-2 text-sm px-2"
              >
                새로운 시리즈 만들기 +
              </Link>
            )}
          </section>
        )}

        <section className="flex flex-col w-full mt-8">
          <div className="text-primary">
            <span className="font-medium text-grayscale-700">
              뉴스레터의 썸네일을 설정해주세요
            </span>
          </div>
          {cover ? (
            <Image
              onClick={(e) => {
                setValue("cover", null);
              }}
              src={cover}
              alt="커버이미지"
              width={200}
              height={200}
              className="w-full object-contain mt-4 max-w-[440px] overflow-hidden cursor-pointer  max-h-[280px] justify-center flex flex-col items-center h-56 bg-grayscale-100 rounded-lg"
            />
          ) : (
            <>
              <label
                htmlFor="cover"
                className="w-full mt-4 cursor-pointer min-w-[440px] justify-center flex flex-col items-center h-56 bg-grayscale-100 rounded-lg"
              >
                <I.Image />
                <span className=" text-grayscale-500 text-center mt-2">
                  원하는 썸네일 이미지 파일을
                  <br />
                  등록해주세요.
                </span>
                <div className="py-1.5 px-2 border rounded mt-4 border-primary text-primary">
                  이미지 업로드
                </div>
              </label>
              <input
                id="cover"
                className="hidden"
                onChange={(e) => {
                  if (e?.target?.files) {
                    fileUpload(e.target.files[0], FileTypeEnum.NEWSLETTER)
                      .then((res) => setValue("cover", res?.file))
                      .catch((e) => toast.error("파일 업로드 실패"));
                  }
                }}
                type="file"
                accept="image/*"
              />
            </>
          )}
          <span className="mt-2 text-sm text-grayscale-500">
            * 썸네일이 없을 시, 문진 기본 이미지로 대체됩니다
          </span>
        </section>
        <section className="w-full mt-8 justify-center items-center flex gap-x-4">
          <button
            onClick={() => unmount()}
            className="border border-grayscale-500 rounded py-1.5 px-3"
          >
            이전
          </button>
          <button
            type="submit"
            className="bg-primary text-white rounded py-1.5 px-3"
          >
            다음
          </button>
        </section>
      </form>
    </div>
  );
}

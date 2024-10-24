import {Controller, UseGuards} from '@nestjs/common';
import {TypedBody, TypedParam, TypedRoute} from "@nestia/core";
import {PostService} from "./post.service";
import {
    PostWithSeriesDto,
    PostWithContentDto,
    PostWithContentAndSeriesDto
} from "./dto";
import {createResponseForm} from "../response/responseForm";
import { TryCatch} from "../response/tryCatch";
import {
    CREATE_POST_ERROR,
    FORBIDDEN_FOR_POST,
    POST_CONTENT_NOT_FOUND,
    POST_NOT_FOUND,
} from "../response/error/post";
import {User} from "../auth/decorator/user.decorator";
import {UserAuthDto} from "../auth/dto";
import {WriterAuthGuard} from "../auth/guard/writerAuth.guard";
import {SeriesService} from "../series/series.service";
import {UserAuthGuard} from "../auth/guard/userAuth.guard";
import {USER_NOT_WRITER} from "../response/error/auth";
import { SERIES_NOT_FOUND} from "../response/error/series";
import {ICreatePostContent} from "./api-types/ICreatePostContent";
import {PostContentDto} from "./dto";
import PostDtoMapper from "./postDtoMapper";
import SeriesDtoMapper from "../series/seriesDtoMapper";
import {Category} from "@moonjin/api-types";
import {IUpdatePost} from "./api-types/IUpdatePost";
import {WriterInfoService} from "../writerInfo/writerInfo.service";


@Controller('post')
export class PostController {
    constructor(
        private readonly postService: PostService,
        private readonly seriesService: SeriesService,
        private readonly writerInfoService:WriterInfoService,
    ) {}

    /**
     * @summary 게시글 생성 API
     * @param postData
     * @param user
     * @return PostDto
     * @throws CREATE_POST_ERROR
     * @throws SERIES_NOT_FOUND
     */
    @TypedRoute.Post()
    @UseGuards(WriterAuthGuard)
    async createPost(@TypedBody() postData : IUpdatePost, @User() user:UserAuthDto): Promise<TryCatch<
        PostWithContentDto, SERIES_NOT_FOUND | CREATE_POST_ERROR>>
    {
        let category = Category.getNumberByCategory(postData.category);
        if(postData.seriesId) {
            const series = await this.seriesService.assertSeriesExist(postData.seriesId);
            category = series.category;
        }
        const post = await this.postService.createPost({...postData,category},user.id);
        if(postData.seriesId) await this.seriesService.updateSeriesNewsletterCount(postData.seriesId);
        return createResponseForm(post)
    }

    /**
     * @summary 해당 글의 내용 업데이트
     * @param postId
     * @param postUpdateData
     * @param user
     * @returns PostContentDto
     * @throws POST_NOT_FOUND
     * @throws FORBIDDEN_FOR_POST
     * @throws CREATE_POST_ERROR
     * @throws SERIES_NOT_FOUND
     */
    @TypedRoute.Patch(':id')
    @UseGuards(WriterAuthGuard)
    async updatePost(@TypedParam('id') postId : number, @TypedBody() postUpdateData : IUpdatePost, @User() user:UserAuthDto) : Promise<
        TryCatch<PostWithContentDto, POST_NOT_FOUND | FORBIDDEN_FOR_POST | SERIES_NOT_FOUND | CREATE_POST_ERROR>>
    {
        await this.postService.assertWriterOfPost(postId,user.id);
        let category = Category.getNumberByCategory(postUpdateData.category);
        if(postUpdateData.seriesId) {
            const series = await this.seriesService.assertSeriesExist(postUpdateData.seriesId);
            category = series.category;
        }
        return createResponseForm(await this.postService.updatePost(postId,{...postUpdateData, category}))
    }

    /**
     * @summary 해당 유저의 작성 중인 글 목록 가져오기
     * @param user
     * @returns PostWithSeriesDto[]
     * @throws USER_NOT_WRITER
     */
    @TypedRoute.Get('/writing')
    @UseGuards(WriterAuthGuard)
    async getWritingPostList(@User() user:UserAuthDto) : Promise<TryCatch<PostWithSeriesDto[], USER_NOT_WRITER>>{
        const postWithSeriesList = await this.postService.getWritingPostList(user.id);
        return createResponseForm(postWithSeriesList.map(postWithSeries => {
            const {series, ...postData} = postWithSeries;
            return {
                post : PostDtoMapper.PostToPostDto(postData),
                series : series? SeriesDtoMapper.SeriesToSeriesDto(series) : null
            }
        }));
    }

    /**
     * @summary 해당 유저의 글 삭제
     * @param user
     * @param postId
     * @throws POST_NOT_FOUND
     * @throws FORBIDDEN_FOR_POST
     */
    @TypedRoute.Delete(':id')
    @UseGuards(WriterAuthGuard)
    async deletePost(@User() user:UserAuthDto, @TypedParam('id') postId : number) : Promise<
        TryCatch<{ message:string },
        POST_NOT_FOUND | FORBIDDEN_FOR_POST>>
    {
        await this.postService.deletePost(postId,user.id);
        await this.writerInfoService.synchronizeNewsLetter(user.id);
        return createResponseForm({
            message : "해당 글을 삭제했습니다."
        })
    }

    /**
     * @summary 해당 글의 내용 업데이트
     * @param postData
     * @param user
     * @returns PostContentDto
     * @throws POST_NOT_FOUND
     * @throws FORBIDDEN_FOR_POST
     * @throws CREATE_POST_ERROR
     */
    @TypedRoute.Patch("content")
    @UseGuards(WriterAuthGuard)
    async updatePostContent(@TypedBody() postData : ICreatePostContent, @User() user:UserAuthDto) : Promise<
        TryCatch<PostContentDto, POST_NOT_FOUND | FORBIDDEN_FOR_POST | CREATE_POST_ERROR>>
    {
        await this.postService.assertWriterOfPost(postData.postId,user.id);
        const postContent = await this.postService.uploadPostContent(postData);
        return createResponseForm(postContent)
    }

    /**
     * @summary 해당 글의 내용 가져오기
     * @param postId
     * @returns PostWithContentDto | PostWithContentAndSeriesDto
     * @throws POST_CONTENT_NOT_FOUND
     * @throws POST_NOT_FOUND
     */
    @TypedRoute.Get(":id")
    @UseGuards(UserAuthGuard)
    async getPostWithContentAndSeries(@TypedParam('id') postId : number): Promise<TryCatch<PostWithContentDto | PostWithContentAndSeriesDto,
        POST_CONTENT_NOT_FOUND | POST_NOT_FOUND>>
    {
        const postContent = await this.postService.getPostWithContentAndSeries(postId);
        return createResponseForm(postContent)
    }

    /**
     * @summary 해당 글의 metadata 가져오기
     * @param postId
     * @returns PostMetaDataDto | UnreleasedPostWithSeriesDto
     * @throws POST_CONTENT_NOT_FOUND
     * @throws POST_NOT_FOUND
     */
    @TypedRoute.Get(":id/metadata")
    @UseGuards(UserAuthGuard)
    async getPostMetadata(@TypedParam('id') postId : number): Promise<TryCatch<PostWithSeriesDto,
        POST_CONTENT_NOT_FOUND | POST_NOT_FOUND>>
    {
        const postContent = await this.postService.getPostById(postId);
        if(postContent.seriesId > 0){
            const series = await this.seriesService.getReleasedSeriesById(postContent.seriesId);
            return createResponseForm({
                post : postContent,
                series
            })
        }
        return createResponseForm({
            post :postContent,
            series : null
        })
    }
}

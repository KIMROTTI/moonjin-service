import { Injectable } from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {ExceptionList} from "../response/error/errorInstances";
import {NewsletterSummaryDto} from "./dto";
import NewsletterDtoMapper from "./newsletterDtoMapper";
import {PostWithContentAndSeriesAndWriterDto} from "../post/dto";
import {PostService} from "../post/post.service";
import {SubscribeService} from "../subscribe/subscribe.service";
import {UtilService} from "../util/util.service";
import {sendNewsLetterWithHtmlDto} from "../mail/dto";
import {MailService} from "../mail/mail.service";
import {
    NewsletterWithPostWithWriterAndSeries,
} from "./prisma/NewsletterWithPostWithWriterAndSeries.prisma.type";
import {EditorJsToHtml} from "@moonjin/editorjs";
import {PaginationOptionsDto} from "../common/pagination/dto";
import {WebNewsletterWithNewsletterWithPost} from "./prisma/webNewsletterWithNewsletterWithPost.prisma.type";

@Injectable()
export class NewsletterService {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly mailService:MailService,
        private readonly postService: PostService,
        private readonly utilService: UtilService,
        private readonly subscribeService: SubscribeService
    ) {}

    /**
     * @summary 해당 유저의 받은 뉴스레터 목록 가져오기
     * @param userId
     * @param seriesOnly
     * @return NewsletterDto[]
     */
    async getNewsletterListByUserId(userId : number, seriesOnly = false) : Promise<WebNewsletterWithNewsletterWithPost[]>{
        return this.prismaService.webNewsletter.findMany({
            where : {
                receiverId : userId,
                newsletter : {
                    post : {
                        series : seriesOnly ? {
                            id : {
                                gt : 0
                            }
                        } : undefined
                    }
                },

            },
            include:{
                newsletter: {
                    include : {
                        post : {
                            include : {
                                writerInfo : {
                                    include : {
                                        user : true
                                    }
                                },
                                series : true
                            }
                        }
                    }
                }
            },
            relationLoadStrategy: 'join',
            orderBy : {
                newsletter : {
                    sentAt : 'desc'
                }
            },
        })
    }


    /**
     * @summary 해당 글을 뉴스레터로 발송
     * @param postId
     * @param writerId
     * @param newsletterTitle
     */
    async sendNewsLetter(postId: number, writerId: number,newsletterTitle: string): Promise<number>{
        // 1. 해당 글이 보낼 수 있는 상태인지 확인
        const postWithContentAndSeriesAndWriter = await this.assertNewsletterCanBeSent(writerId, postId);

        // 2. 구독자 목록 가져오기
        const receiverList = await this.subscribeService.getAllSubscriberByWriterId(writerId);
        const receiverEmailSet = new Set(receiverList.externalSubscriberList.map(subscriber => subscriber.subscriberEmail));
        receiverList.subscriberList.forEach(follower => {
            receiverEmailSet.add(follower.user.email)
        })
        receiverEmailSet.add(postWithContentAndSeriesAndWriter.user.email);
        const receiverEmailList = Array.from(receiverEmailSet);
        const receiverIdList = receiverList.subscriberList.map(subscriber => subscriber.user.id);

        try{
            const sentAt = this.utilService.getCurrentDateInKorea();
            const newsletter = await this.prismaService.newsletter.create({
                data : {
                    postId,
                    postContentId: postWithContentAndSeriesAndWriter.postContent.id,
                    sentAt,
                    webNewsletter : {
                        createMany : {
                            data : receiverIdList.map(receiverId => {
                                return {
                                    receiverId
                                }
                            }),
                            skipDuplicates : true
                        }
                    },
                    newsletterSend: {
                        create: {
                            title: newsletterTitle,
                            sentAt,
                            mailNewsletter: {
                                createMany: {
                                    data: receiverEmailList.map(email => {
                                        return {
                                            receiverEmail: email
                                        }
                                    }),
                                    skipDuplicates: true
                                }
                            }
                        }
                    }
                }
            })

            const newsletterSendInfo : sendNewsLetterWithHtmlDto = {
                newsletterId : newsletter.id,
                senderName : postWithContentAndSeriesAndWriter.user.nickname,
                senderMailAddress : postWithContentAndSeriesAndWriter.writerInfo.moonjinId + "@" + process.env.MAILGUN_DOMAIN,
                subject : newsletterTitle,
                html : EditorJsToHtml(postWithContentAndSeriesAndWriter.postContent.content),
                emailList : receiverEmailList
            };
            await this.mailService.sendNewsLetterWithHtml(newsletterSendInfo);
            return receiverEmailList.length;
        }catch (error){
            throw ExceptionList.SEND_NEWSLETTER_ERROR;
        }
    }

    /**
     * @summary 뉴스레터 summary 가져오기
     * @param newsletterId
     * @return NewsletterSummaryDto
     * @throws NEWSLETTER_NOT_FOUND
     */
    async getNewsletterSummaryById(newsletterId: number): Promise<NewsletterSummaryDto>{
        const newsletter = await this.prismaService.newsletter.findUnique({
            where: {
                id: newsletterId
            },
        })
        if(!newsletter) throw ExceptionList.NEWSLETTER_NOT_FOUND;
        return NewsletterDtoMapper.newsletterToNewsletterSummaryDto(newsletter);
    }

    /**
     * @summary 뉴스레터 전송 가능 여부 확인
     * @param userId
     * @param postId
     * @throws POST_NOT_FOUND
     * @throws FORBIDDEN_FOR_POST
     * @throws NEWSLETTER_CATEGORY_NOT_FOUND
     */
    async assertNewsletterCanBeSent(userId: number, postId: number): Promise<PostWithContentAndSeriesAndWriterDto>{
        const postWithContentAndSeriesAndWriter = await this.postService.getPostAndPostContentAndWriterById(postId);
        if(userId != postWithContentAndSeriesAndWriter.post.writerId) throw ExceptionList.FORBIDDEN_FOR_POST;
        if(postWithContentAndSeriesAndWriter.post.category != 0) throw ExceptionList.NEWSLETTER_CATEGORY_NOT_FOUND;
        return postWithContentAndSeriesAndWriter;
    }

    /**
     * @summary 해당 유저의 발행한 뉴스레터 목록 가져오기
     * @param writerId
     * @param paginationOptions
     * @return SentNewsletterWithCounts[]
     */
    async getSentNewsletterListByWriterId(writerId: number, paginationOptions?:PaginationOptionsDto): Promise<NewsletterWithPostWithWriterAndSeries[]>{
        return this.prismaService.newsletter.findMany({
            where : {
                post : {
                    writerId,
                    deleted : false
                },
            },
            include: {
                post : {
                    include : {
                        writerInfo : {
                            include : {
                                user : true
                            }
                        },
                        series : true
                    },
                },
            },
            relationLoadStrategy: 'join',
            orderBy : {
                sentAt : 'desc'
            },
            skip: paginationOptions?.skip,
            take: paginationOptions?.take,
            cursor: paginationOptions?.cursor ? {
                id : paginationOptions.cursor
            } : undefined
        })
    }

    /**
     * @summary 해당 유저의 게시글 목록 가져오기
     * @param moonjinId
     * @param paginationOptions
     * @return SentNewsletterWithCounts[]
     */
    async getAllSentNewsletterListByMoonjinId(moonjinId: string, paginationOptions?:PaginationOptionsDto): Promise<NewsletterWithPostWithWriterAndSeries[]>{
        return this.prismaService.newsletter.findMany({
            where : {
                post : {
                    writerInfo:{
                        moonjinId
                    },
                    deleted : false,
                },
            },
            include: {
                post : {
                    include : {
                        writerInfo : {
                            include : {
                                user : true
                            }
                        },
                        series : true
                    }
                },
            },
            relationLoadStrategy: 'join',
            orderBy : {
                id : 'desc'
            },
            skip: paginationOptions?.skip,
            take: paginationOptions?.take,
            cursor: paginationOptions?.cursor ? {
                id : paginationOptions.cursor
            } : undefined
        })
    }

    /**
     * @summary 해당 유저의 일반게시글 목록 가져오기
     * @param moonjinId
     * @param paginationOptions
     * @return SentNewsletterWithCounts[]
     */
    async getAllSentNormalNewsletterListByMoonjinId(moonjinId: string, paginationOptions?:PaginationOptionsDto): Promise<NewsletterWithPostWithWriterAndSeries[]>{
        return this.prismaService.newsletter.findMany({
            where : {
                post : {
                    writerInfo:{
                        moonjinId
                    },
                    seriesId : 0,
                    deleted : false,
                },
            },
            include: {
                post : {
                    include : {
                        writerInfo : {
                            include : {
                                user : true
                            }
                        },
                        series : true
                    }
                },
            },
            relationLoadStrategy: 'join',
            orderBy : {
                id : 'desc'
            },
            skip: paginationOptions?.skip,
            take: paginationOptions?.take,
            cursor: paginationOptions?.cursor ? {
                id : paginationOptions.cursor
            } : undefined
        })
    }

    /**
     * @summary 해당 시리즈의 뉴스레터 목록 가져오기
     * @param seriesId
     */
    async getNewsletterInSeriesBySeriesId(seriesId: number): Promise<NewsletterWithPostWithWriterAndSeries[]>{
        return this.prismaService.newsletter.findMany({
            where: {
                post : {
                    seriesId
                }
            },
            include: {
                post : {
                    include : {
                        writerInfo : {
                            include : {
                                user : true
                            }
                        },
                        series : true
                    }
                }
            },
            relationLoadStrategy: 'join',
            orderBy : {
                sentAt : 'desc'
            }
        })
    }
}

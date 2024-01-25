import { Controller, UseGuards } from '@nestjs/common';
import {TypedBody, TypedRoute} from "@nestia/core";
import {User} from "../auth/decorator/user.decorator";
import {UserDto} from "../auth/dto/user.dto";
import {ICreateSeries} from "./api-types/ICreateSeries";
import {SeriesService} from "./series.service";
import {createResponseForm} from "../response/responseForm";
import {WriterAuthGuard} from "../auth/guard/writerAuth.guard";

@Controller('series')
export class SeriesController {
    constructor(
        private readonly seriesService: SeriesService
    ) {}

    /**
     * @summary 시리즈 생성 API
     */
    @TypedRoute.Post()
    @UseGuards(WriterAuthGuard)
    async createSeries(
        @User() user :UserDto,
        @TypedBody() seriesData : ICreateSeries
    ){
        const series = await this.seriesService.createSeries({writerId: user.id,...seriesData});
        return createResponseForm(series)
    }

}

import {Injectable} from '@nestjs/common';
import {PrismaService} from "../prisma/prisma.service";
import {User} from "@prisma/client";
import * as console from "console";
import {UtilService} from "../util/util.service";
import {UserDto} from "./dto/user.dto";
import {Exception} from "../response/error/error";
import { SignupDataDto } from './dto/signupData.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import {ExceptionList} from "../response/error/errorInstances";
import {LocalLoginDto} from "./dto/localLogin.dto";
import {UserAccessTokensDto} from "./dto/userAccessTokens.dto";
import {SocialSignupDto} from "./dto/socialSignup.dto";
import {UserRoleEnum} from "./enum/userRole.enum";
import {WriterSignupDto} from "./dto/writerSignup.dto";
import {WriterInfoDto} from "./dto/writerInfo.dto";
import AuthDtoMapper from "./authDtoMapper";

@Injectable()
export class AuthService {
    constructor(private readonly prismaService: PrismaService, private readonly utilService: UtilService) {}

    /**
     * @summary 작가 | 독자의 회원가입을 진행하는 기능
     *
     * @param signUpData
     * @returns UserDto
     * @throws EMAIL_ALREADY_EXIST
     * @throws NICKNAME_ALREADY_EXIST
     * @throws MOONJIN_EMAIL_ALREADY_EXIST
     * @throws SIGNUP_ERROR
     * @throws WRITER_SIGNUP_ERROR
     */
    async localSignUp(signUpData : SignupDataDto): Promise<UserDto> {
        let userId = 0;
        try {
            const {moonjinId, hashedPassword ,...data} = signUpData;
            // 회원가입
            const createdUser : User = await this.prismaService.user.create({
                data : {
                    ...data,
                    password : hashedPassword
                }
            });
            userId = createdUser.id;
            if(signUpData.role === UserRoleEnum.WRITER && moonjinId){ // 작가 회원가입
                await this.writerSignup({userId, moonjinId});
            }
            return AuthDtoMapper.UserToUserDto(createdUser);
        }catch(error){
            if(userId > 0){ // writerSignup Error : user가 생성되었으니 transaction rollback
                await this.prismaService.user.delete({
                    where:{
                        id : userId
                    }
                })
                throw error;
            }
            this.prismaSignupErrorHandling(error);
            if(error instanceof Exception){
                throw error;
            }
            console.error(error)
            throw ExceptionList.SIGNUP_ERROR;
        }
    }

    /**
     * @summary 작가 회원가입을 진행하는 함수
     * @param writerSignupData
     * @returns WriterInfoDto
     * @throws MOONJIN_EMAIL_ALREADY_EXIST
     * @throws WRITER_SIGNUP_ERROR
     */
    async writerSignup(writerSignupData : WriterSignupDto) : Promise<WriterInfoDto>{
        try {
            const writer = await this.prismaService.writerInfo.create({
                data:writerSignupData
            })
            return AuthDtoMapper.WriterInfoToWriterInfoDto(writer);
        } catch (error){
            if(error instanceof PrismaClientKnownRequestError){
                throw ExceptionList.MOONJIN_EMAIL_ALREADY_EXIST;
            }
            throw ExceptionList.WRITER_SIGNUP_ERROR;
        }
    }

    /**
     * @summary 비밀번호 변경
     * @param id
     * @param password
     * @throws PASSWORD_CHANGE_ERROR
     * @returns void
     */
    async passwordChange(id : number, password : string): Promise<void> {
        try {
            await this.prismaService.user.update({
                where:{
                    id,
                    deleted : false
                },
                data:{
                    password : this.utilService.getHashCode(password)
                }
            })
        } catch (error){
            console.error(error)
            throw ExceptionList.PASSWORD_CHANGE_ERROR;
        }
    }

    async getUserByEmail(email : string): Promise<UserDto | null> {
        const user = await this.prismaService.user.findMany({
            where:{
                email,
                deleted : false
            }
        })
        return user ? AuthDtoMapper.UserToUserDto(user[0]) : null;
    }

    /**
     * @summary 로컬 로그인을 진행하는 함수
     * @param loginData 로그인할 유저 정보
     * @returns UserDto
     * @throws SOCIAL_USER_ERROR
     * @throws INVALID_PASSWORD
     * @throws USER_NOT_FOUND
     * @throws LOGIN_ERROR
     */
    async localLogin(loginData : LocalLoginDto) : Promise<UserDto> {
        try {
            const user = await this.prismaService.user.findUnique({
                where:{
                    email: loginData.email,
                }
            })
            if(user){ // 유저가 있는 경우
                if(!user.password) { // 소셜 유저
                    throw ExceptionList.SOCIAL_USER_ERROR;
                } else{
                    const userData = AuthDtoMapper.UserToUserDto(user);
                    const isValidPassword = this.utilService.compareHash(loginData.password, user.password)
                    if (isValidPassword)
                        return userData;
                    else // 비밀번호가 틀린 경우
                        throw ExceptionList.INVALID_PASSWORD;
                }
            } else{ // 유저가 없는 경우
                throw ExceptionList.USER_NOT_FOUND;
            }
        } catch (error) {
            console.error(error)
            if(error instanceof PrismaClientKnownRequestError){
                throw ExceptionList.LOGIN_ERROR;
            }
            throw error;
        }
    }

    /**
     * @summary 소셜 회원가입을 진행하는 함수
     * @param socialSignupData
     * @returns UserDto
     * @throws SOCIAL_SIGNUP_ERROR
     * @throws EMAIL_ALREADY_EXIST
     * @throws NICKNAME_ALREADY_EXIST
     * @throws MOONJIN_EMAIL_ALREADY_EXIST
     */
    async socialSignup(socialSignupData : SocialSignupDto): Promise<UserDto> {
        let createdUserId = 0
        let createdOauthId = 0
        try {
            const {oauthId, social, moonjinId, ...userSignupData} = socialSignupData;
            const createdUser = await this.prismaService.user.create({
                data: userSignupData
            })
            createdUserId = createdUser.id;
            const createdOauth = await this.prismaService.oauth.create({
                data:{
                    oauthId,
                    social,
                    userId : createdUser.id
                }
            })
            createdOauthId = createdOauth.id;
            if(userSignupData.role === UserRoleEnum.WRITER && moonjinId){ // 작가 회원가입
                await this.writerSignup({userId: createdUser.id, moonjinId});
            }
            return AuthDtoMapper.UserToUserDto(createdUser)
        } catch (error){
            if(createdOauthId > 0){ // transaction rollback
                await this.prismaService.oauth.delete({
                    where:{
                        id : createdOauthId
                    }
                })
            }
            if(createdUserId > 0){ // transaction rollback
                await this.prismaService.user.delete({
                    where:{
                        id : createdUserId
                    }
                })
            }
            this.prismaSignupErrorHandling(error);
            console.error(error);
            throw ExceptionList.SOCIAL_SIGNUP_ERROR;
        }
    }

    /**
     * @summary prisma 에서 signup 시 에러를 처리하는 함수
     * @param error
     * @throws EMAIL_ALREADY_EXIST
     * @throws NICKNAME_ALREADY_EXIST
     * @throws MOONJIN_EMAIL_ALREADY_EXIST
     */
    prismaSignupErrorHandling(error : Error){
        if (error instanceof PrismaClientKnownRequestError){
            if (error.code == "P2002" && error.meta){
                const errorField = (error.meta.target as string[])[0]
                switch (errorField){
                    case "email":
                        throw ExceptionList.EMAIL_ALREADY_EXIST;
                    case "nickname":
                        throw ExceptionList.NICKNAME_ALREADY_EXIST;
                    case "moonjinId":
                        throw ExceptionList.MOONJIN_EMAIL_ALREADY_EXIST;
                }
            }
        }
    }

    /**
     * @summary userData가 담긴 atk, rtk을 발급
     * @param userData
     * @returns {accessToken, refreshToken}
     */
    getAccessTokens(userData: UserDto) : UserAccessTokensDto {
        const accessToken = this.utilService.generateJwtToken(userData,60 * 15);
        const refreshToken = this.utilService.generateJwtToken(userData, 60 * 60 * 24 * 7);
        return {accessToken, refreshToken}
    }
}
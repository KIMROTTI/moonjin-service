export enum ErrorCodeEnum {
    // auth/signup
    EMAIL_ALREADY_EXIST = '0001',
    NICKNAME_ALREADY_EXIST = "0002",
    MOONJIN_EMAIL_ALREADY_EXIST = "0003",
    SIGNUP_ERROR = "0004",
    WRITER_SIGNUP_ERROR = "0005",
    SIGNUP_ROLE_ERROR = "0006",
    // mail/mail
    EMAIL_NOT_EXIST = '0010',
    // auth/jwtToken
    TOKEN_NOT_FOUND = '0020',
    INVALID_TOKEN = '0021',
    // auth/login
    USER_NOT_FOUND = '0030',
    INVALID_PASSWORD = '0031',
    LOGIN_ERROR = "0032",
    EMAIL_NOT_VERIFIED = "0033",
    INVALID_SOCIAL = "0034",
    USER_NOT_FOUND_IN_SOCIAL = "0035",
    SOCIAL_PROFILE_NOT_FOUND = "0036",
    SOCIAL_LOGIN_ERROR = "0037",
    SOCIAL_USER_ERROR = "0038",
    SOCIAL_SIGNUP_TOKEN_NOT_FOUND = "0039",
    // social
    SOCIAL_SIGNUP_ERROR = "0040",
    // auth
    PASSWORD_CHANGE_ERROR = "0050",
    USER_NOT_WRITER = "0051",
    // post
    CREATE_POST_ERROR = "0100",
    // series
    CREATE_SERIES_ERROR = "0201",
    SERIES_NOT_FOUND = "0202",

    // user
    /// follow
    FOLLOW_MYSELF_ERROR = "0400",
    FOLLOW_ALREADY_ERROR = "0401",
}
// import {EditorJsonDto} from "../../common/editor/dto";

export interface CreatePostDto {
  title: string;
  content: any;
  category?: string;
  status?: boolean;
  cover?: string;
  seriesId?: number;
}

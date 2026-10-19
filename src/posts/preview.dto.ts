import { IsString } from 'class-validator';

export class PreviewDto {
    @IsString()
    title: string;

    @IsString()
    content: string;
}
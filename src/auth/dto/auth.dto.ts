import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class UserLoginDto {
  @ApiProperty({ example: '01012121212' })
  @IsString()
  @Matches(/^010[1-9]\d{7}$/)
  mobileNumber: string;

  @ApiProperty({ example: 'test123' })
  @IsString()
  uuid: string;
}

export class UserVerifyCodeDto {
  @ApiProperty({ example: '01012121212' })
  @IsString()
  @Matches(/^010[1-9]\d{7}$/)
  mobileNumber: string;

  @ApiProperty({ example: '121212' })
  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}

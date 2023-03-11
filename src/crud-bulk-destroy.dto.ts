import { ApiProperty } from "@nestjs/swagger";

export class CrudBulkDestroyDto {
  @ApiProperty({
    description: "待删除记录的 ID 列表",
    example: [1, 2],
  })
  ids: number[];
}

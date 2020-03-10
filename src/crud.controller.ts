import {
  Body,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res
} from "@nestjs/common";
import { Request, Response } from "express";
import { QueryDto } from "./query.dto";
import { PlaceholderDto } from "./placeholder.dto";
import { ApiOperation } from "@nestjs/swagger";

export class CrudController {
  constructor(public repository: any) {}

  public include: Object;

  @Get()
  @ApiOperation({
    summary: "获取列表"
  })
  async findAll(
    @Query() query: QueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const { include, ...restQuery } = req.query;

    res.json({
      data: {
        total: await this.repository.count(restQuery),
        items: await this.repository.findAll({
          ...restQuery,
          include:
            include && include[0]
              ? include.map(item => ({
                  ...item,
                  model: this.include[item.model]
                }))
              : []
        })
      }
    });
  }

  @Get(":id")
  @ApiOperation({
    summary: "获取详情"
  })
  async findByPk(
    @Param("id") id: string,
    @Query() query: QueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const { include } = req.query;
    const ret = await this.repository.findByPk(id, {
      include:
        include && include[0]
          ? include.map(item => ({
              ...item,
              model: this.include[item.model]
            }))
          : []
    });

    if (ret) {
      res.json({ data: ret });
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @Post()
  @ApiOperation({
    summary: "新增"
  })
  async create(
    @Body() body: PlaceholderDto,
    @Res() res: Response
  ): Promise<void> {
    res.json({ data: await this.repository.create(body) });
  }

  @Put(":id")
  @ApiOperation({
    summary: "编辑"
  })
  async update(
    @Param("id") id: string,
    @Body() body: PlaceholderDto,
    @Res() res: Response
  ): Promise<void> {
    const ret = await this.repository.update(body, { where: { id } });

    if (ret[0]) {
      res.json();
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @Delete(":id")
  @ApiOperation({
    summary: "删除"
  })
  async destroy(@Param("id") id: string, @Res() res: Response): Promise<void> {
    const ret = await this.repository.destroy({ where: { id } });

    if (ret) {
      res.json();
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }
}

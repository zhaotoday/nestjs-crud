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
import { OrderAction } from "./order-action.enum";
import { Includeable } from "sequelize";

export class CrudController {
  public include: Includeable[];

  public orderable: boolean = false;

  constructor(private readonly repository: any) {}

  private getInclude(include) {
    return include && include[0]
      ? include.map(item => ({
          ...item,
          model: this.include[item.model],
          include: item.include ? this.getInclude(include) : []
        }))
      : [];
  }

  @ApiOperation({ summary: "获取列表" })
  @Get()
  async findAll(
    @Query() query: QueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const { attributes = null, include, order, ...restQuery } = req.query;

    res.json({
      data: {
        total: await this.repository.count(restQuery),
        items: await this.repository.findAll({
          ...restQuery,
          attributes,
          include: this.getInclude(include),
          order: order && order[0] ? order : [["id", "DESC"]]
        })
      }
    });
  }

  @ApiOperation({
    summary: "获取详情"
  })
  @Get(":id")
  async findByPk(
    @Param("id") id: string,
    @Query() query: QueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const { attributes = null, include } = req.query;
    const ret = await this.repository.findByPk(id, {
      attributes,
      include: this.getInclude(include)
    });

    if (ret) {
      res.json({ data: ret });
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @ApiOperation({
    summary: "新增"
  })
  @Post()
  async create(
    @Body() body: PlaceholderDto,
    @Res() res: Response
  ): Promise<void> {
    if (this.orderable) {
      const maxId = (await this.repository.max("id")) || 1;
      body.order = maxId + 1;
    }
    res.json({ data: await this.repository.create(body) });
  }

  @ApiOperation({
    summary: "编辑"
  })
  @Put(":id")
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

  @ApiOperation({
    summary: "删除"
  })
  @Delete(":id")
  async destroy(@Param("id") id: string, @Res() res: Response): Promise<void> {
    const ids = id.split(",");
    const ret = await this.repository.destroy({
      where: {
        id: ids.length > 1 ? { $in: ids } : id
      }
    });

    if (ret) {
      res.json();
    } else {
      res.status(HttpStatus.NOT_FOUND).json();
    }
  }

  @ApiOperation({
    summary: "排序"
  })
  @Post(":id/actions/order")
  async order(
    @Param("id") id: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const { where } = req.query;
    const { action } = req.body;
    const findByPkRes = await this.repository.findByPk(id);
    const findPrevRes = await this.repository.findAll({
      where: Object.assign(where, {
        order: { $gt: findByPkRes.order }
      }),
      order: [["order", "ASC"]],
      limit: 1
    });

    const findNextRes = await this.repository.findAll({
      where: Object.assign(where, {
        order: { $lt: findByPkRes.order }
      }),
      order: [["order", "DESC"]],
      limit: 1
    });

    if (action === OrderAction.ToPrev && findPrevRes[0]) {
      await this.repository.update(
        { order: findPrevRes[0].order },
        {
          where: { id }
        }
      );

      await this.repository.update(
        { order: findByPkRes.order },
        {
          where: { id: findPrevRes[0].id }
        }
      );
    } else if (action === OrderAction.ToNext && findNextRes[0]) {
      await this.repository.update(
        { order: findNextRes[0].order },
        { where: { id } }
      );

      await this.repository.update(
        { order: findByPkRes.order },
        { where: { id: findNextRes[0].id } }
      );
    }

    res.json();
  }
}

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform
} from "@nestjs/common";

@Injectable()
export class CrudPipe implements PipeTransform {
  transform(value, { type, data }: ArgumentMetadata) {
    switch (type) {
      case "query": {
        ["where", "include", "order", "attributes"].forEach(key => {
          CrudPipe.toObj(key, value);
        });

        ["offset", "limit"].forEach(key => {
          CrudPipe.toInt(key, value);
        });

        return value;
      }

      case "param": {
        if (data === "id") {
          if (isNaN(value)) {
            throw new BadRequestException("id 参数错误");
          }

          return parseInt(value, 10);
        }

        return value;
      }

      default:
        return value;
    }
  }

  static toObj(key, value) {
    if (value[key]) {
      try {
        value[key] = JSON.parse(value[key]);
      } catch (e) {
        throw new BadRequestException(`${key} 参数错误`);
      }
    }
  }

  static toInt(key, value) {
    if (value[key]) {
      if (isNaN(value[key])) {
        throw new BadRequestException(`${key} 参数错误`);
      } else {
        value[key] = parseInt(value[key]);
      }
    }
  }
}

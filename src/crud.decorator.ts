import { PARAMTYPES_METADATA } from "@nestjs/common/constants";
import { get } from "lodash";
import { PlaceholderDto } from "./placeholder.dto";
import { CrudController } from "./crud.controller";
import { ControllerMethod } from "./controller-method.enum";

function cloneDecorators(from, to): void {
  Reflect.getMetadataKeys(from).forEach(key => {
    const value = Reflect.getMetadata(key, from);
    Reflect.defineMetadata(key, value, to);
  });
}

function clonePropDecorators(from, to, name): void {
  Reflect.getMetadataKeys(from, name).forEach(key => {
    const value = Reflect.getMetadata(key, from, name);
    Reflect.defineMetadata(key, value, to, name);
  });
}

export function Crud({
  Dto = PlaceholderDto,
  methods = [
    ControllerMethod.FindALL,
    ControllerMethod.FindByPk,
    ControllerMethod.Create,
    ControllerMethod.Update,
    ControllerMethod.Destroy
  ]
}): Function {
  return function(target): void {
    const crudController = new CrudController(target.repository);
    const Controller = target;
    const controller = target.prototype;

    for (const method of methods) {
      controller[method] = function(...args): Function {
        return crudController[method].apply(this, args);
      };

      Object.defineProperty(controller[method], "name", {
        value: method
      });

      cloneDecorators(crudController, controller);
      cloneDecorators(crudController[method], controller[method]);
      clonePropDecorators(crudController, controller, method);
      clonePropDecorators(CrudController, Controller, method);

      const types: [] = Reflect.getMetadata(
        PARAMTYPES_METADATA,
        controller,
        method
      );

      Reflect.decorate(
        [
          Reflect.metadata(
            PARAMTYPES_METADATA,
            types.map((v: any) => {
              if (Dto && get(v, "name") === PlaceholderDto.name) {
                return Dto;
              }
              return v;
            })
          )
        ],
        controller,
        method,
        Object.getOwnPropertyDescriptor(controller, method)
      );
    }
  };
}

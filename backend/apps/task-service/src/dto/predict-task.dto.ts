import { PartialType } from "@nestjs/mapped-types";
import { TaskNerDto } from "./task-ner.dto";
import { DateTimeResult } from "./dt-result.dto";

export class PredictTaskDto extends PartialType(TaskNerDto) {
    priority: number;
    datetime: DateTimeResult;
}
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateStatusDto } from './create-status.dto';

// Không cho phép thay đổi projectId của status
export class UpdateStatusDto extends PartialType(
  OmitType(CreateStatusDto, ['projectId']),
) {}
